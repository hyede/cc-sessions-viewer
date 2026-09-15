//! skills.sh 的搜索接口。
//!
//! 这是整个「发现」面板唯一能用的公开接口，方案文档 1.1 / 1.2 记了实测过程：
//! `/api/v1/*` 要 Vercel OIDC token、`/api/skill/...` 返回 401、详情页是 Next.js
//! RSC（build hash 一变就废）。**所以这儿只有搜索，描述和文件清单都得另走 git。**
//!
//! 两条要记住的约束：
//!
//! 1. **返回只有五个字段，没有描述。** 试过 `version` / `searchVersion` /
//!    `includeDescription` / `full` 等参数，返回形状一个字段都不变。列表第二行只能
//!    放 source，这是数据决定的，不是设计偏好。
//! 2. **`name` 可能不等于 `skillId`**（200 条样本里 5 条，`agent development` vs
//!    `agent-development`）。目录名、检出路径**一律用 `skill_id`**，`name` 只用来显示。
//!
//! # 榜单（`/trending`）
//!
//! 搜索接口**拒绝空查询**（`{"error":"Query must be at least 2 characters"}`，连 `*`
//! 都不收），所以面板一打开是空的 —— 用户得先猜一个词才知道这儿有东西。榜单就是拿来
//! 填这一屏的。
//!
//! 它**没有 JSON 接口**。`/hot`、`/trending`、`/` 是三个独立的 SSR 页面，切换就是跳
//! 链接，整页零个 XHR；`/api/hot`、`/api/trending`、`/api/skills`、`/api/leaderboard`
//! 全 404；`/api/search` 加 `sort=` / `orderBy=` 返回形状一个字段都不变。
//!
//! 能拿的只有一处：SSR 出来的 HTML 里嵌着一个叫 `initialSkills` 的 prop，600 条、
//! **已经排好序**。取前 80 就是榜单。三个页面的语义不同 ——
//!
//! | 页面 | 语义 | `installs` 的含义 |
//! | --- | --- | --- |
//! | `/` | 历史总榜 | 总装机量（百万级）|
//! | `/trending` | 24 小时 | 当日装机量（万级）|
//! | `/hot` | 1 小时 | **只有两位数**，是增量不是总量 |
//!
//! 选 `/trending`：`/hot` 的 `installs` 是 1 小时增量，榜首写着 `67` 会被当成坏了，
//! 而它真实的总装机量是六位数。
//!
//! **这是扒前端的 prop 名，不是公开接口。** 对方改一次前端就会失效，所以抽取失败一律
//! 当「没有榜单」处理，退回原来的空态提示，绝不弹错误框 —— 榜单是锦上添花，不该让一个
//! 本来就能用的搜索面板看起来坏了。

use std::sync::Mutex;
use std::time::{Duration, Instant};

use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

const SEARCH_URL: &str = "https://www.skills.sh/api/search";
/// 榜单页。语义见模块头那张表。
const TRENDING_URL: &str = "https://www.skills.sh/trending";
/// 榜单取多少条。页面自己嵌了 600 条，但面板是用来「看一眼有什么」的，不是拿来翻的。
const TRENDING_LIMIT: usize = 80;
/// 榜单缓存多久。24 小时榜一小时内不会有肉眼可见的变化，没必要每次开面板都去打一次。
const TRENDING_TTL: Duration = Duration::from_secs(60 * 60);
/// 接口自己的上限。传 201 / 500 都只回 200 条，照它的规矩夹住，别指望它报错。
const MAX_LIMIT: u32 = 200;
/// 接口拒绝更短的查询（`{"error":"Query must be at least 2 characters"}`，HTTP 400）。
const MIN_QUERY: usize = 2;

// ---------------------------------------------------------------------------
// 对外形状
// ---------------------------------------------------------------------------

/// 一条搜索结果。
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryHit {
    /// `emilkowalski/skills`（GitHub 仓库）或 `code.deepline.com`（厂商自托管）。
    pub source: String,
    /// 目录名、安装名。**永远用它**，不要用 `name`。
    pub skill_id: String,
    /// 显示名，可能带空格。
    pub name: String,
    pub installs: u64,
    /// `source` 是不是 `owner/repo` 形态 —— 只有这种才装得了，见 [`installable_source`]。
    pub installable: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistrySearch {
    /// 接口回显的查询词。用它而不是我们发出去的那个，才能判断响应过不过期。
    pub query: String,
    /// `fuzzy` / `semantic`。多词查询会切到语义搜索，排序看着「不像」，原样显示出来
    /// 比让用户猜强。
    pub search_type: String,
    pub hits: Vec<RegistryHit>,
}

/// 搜不成的原因。
///
/// 分类而不是甩一句 `ureq` 的错误原文：面板有四种语言，而「断网」和「服务端 500」
/// 对用户意味着完全不同的下一步（一个是检查网络，一个是等一会儿再试）。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RegistryErrKind {
    /// 连不上 —— 断网、DNS、超时。
    Offline,
    /// 查询词太短，接口不收。前端本来就该拦住，这儿是第二道。
    TooShort,
    /// 连上了但对方不高兴（4xx / 5xx）。
    Http,
    /// 连上也回了，但不是我们认得的形状。
    BadJson,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RegistryError {
    pub kind: RegistryErrKind,
    /// 底层原文，给「展开详情」用。界面上默认只显示按 `kind` 翻出来的那句话。
    pub detail: String,
}

impl RegistryError {
    fn new(kind: RegistryErrKind, detail: impl Into<String>) -> Self {
        Self {
            kind,
            detail: detail.into(),
        }
    }
}

// ---------------------------------------------------------------------------
// 来源形态
// ---------------------------------------------------------------------------

/// 这个 source 是不是 `owner/repo`，也就是**装不装得了**。
///
/// 另一种形态是域名（`code.deepline.com`、`smithery.ai`、`open.feishu.cn` …，八次
/// 查询里占 0%–8%）。那些是厂商自托管的 skill，`/skills.json`、
/// `/.well-known/skills.json`、`/<slug>/SKILL.md` 全 404，详情页也没有 SSR 内容 ——
/// **没有任何公开的取内容路径**。列出来但标成不可安装，不假装能装。
///
/// 收紧到 `[A-Za-z0-9._-]`，并且两段都不能是 `.` / `..`、不能以 `-` 开头：
/// 这个字符串后面会被拼进 `https://github.com/<source>.git` 交给 `git`，
/// 以 `-` 开头的会被当成命令行参数。
pub fn installable_source(source: &str) -> bool {
    let mut parts = source.split('/');
    let (Some(owner), Some(repo), None) = (parts.next(), parts.next(), parts.next()) else {
        return false;
    };
    [owner, repo].iter().all(|seg| {
        !seg.is_empty()
            && *seg != "."
            && *seg != ".."
            && !seg.starts_with('-')
            && seg
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
    })
}

// ---------------------------------------------------------------------------
// 搜索
// ---------------------------------------------------------------------------

/// 接口原样的一条。只在本模块内部存在 —— 对外的是 [`RegistryHit`]。
///
/// `id` 恒等于 `source + "/" + skillId`（200/200 命中），所以不收：留着它只会多一个
/// 可能和另外两个字段对不上的真相来源。
#[derive(Deserialize)]
struct RawHit {
    #[serde(rename = "skillId")]
    skill_id: Option<String>,
    name: Option<String>,
    #[serde(default)]
    installs: u64,
    source: Option<String>,
}

#[derive(Deserialize)]
struct RawSearch {
    query: Option<String>,
    #[serde(rename = "searchType")]
    search_type: Option<String>,
    #[serde(default)]
    skills: Vec<RawHit>,
}

/// 这个查询词够不够长发出去。按 **char** 数不是字节数 —— 两个汉字是六个字节，
/// 按字节判会把一个合法查询当成太短。
pub fn too_short(query: &str) -> bool {
    query.trim().chars().count() < MIN_QUERY
}

pub fn search(query: &str, limit: u32) -> Result<RegistrySearch, RegistryError> {
    let q = query.trim();
    if too_short(q) {
        return Err(RegistryError::new(RegistryErrKind::TooShort, q.to_string()));
    }
    let raw: RawSearch = ureq::get(SEARCH_URL)
        .query("q", q)
        .query("limit", &limit.clamp(1, MAX_LIMIT).to_string())
        .timeout(Duration::from_secs(15))
        .call()
        .map_err(|e| match e {
            // 连上了但状态码不对。对方的 body 常常是 `{"error":"…"}`，带上原文。
            ureq::Error::Status(code, resp) => RegistryError::new(
                RegistryErrKind::Http,
                format!("{code} {}", resp.into_string().unwrap_or_default().trim()),
            ),
            other => RegistryError::new(RegistryErrKind::Offline, other.to_string()),
        })?
        .into_json()
        .map_err(|e| RegistryError::new(RegistryErrKind::BadJson, e.to_string()))?;

    // 缺字段的条目直接丢掉，不用空串凑数：一条没有 source 的结果既点不开也装不了，
    // 摆在列表里只会让人以为是我们坏了。
    let hits = raw
        .skills
        .into_iter()
        .filter_map(|h| {
            let source = h.source?;
            let skill_id = h.skill_id?;
            Some(RegistryHit {
                installable: installable_source(&source),
                name: h.name.unwrap_or_else(|| skill_id.clone()),
                installs: h.installs,
                source,
                skill_id,
            })
        })
        .collect();

    Ok(RegistrySearch {
        query: raw.query.unwrap_or_else(|| q.to_string()),
        search_type: raw.search_type.unwrap_or_default(),
        hits,
    })
}

// ---------------------------------------------------------------------------
// 榜单
// ---------------------------------------------------------------------------

/// 榜单页嵌的一条。字段比搜索接口还少一个（没有 `id`），形状见模块头。
#[derive(Deserialize)]
struct RawTrending {
    source: Option<String>,
    #[serde(rename = "skillId")]
    skill_id: Option<String>,
    name: Option<String>,
    #[serde(default)]
    installs: u64,
}

/// 从 SSR 出来的 HTML 里抠出 `initialSkills` 那个数组，返回**反转义后**的 JSON 文本。
///
/// 这里有**两层转义**，分不清就必错：
///
/// 1. 外层：数组塞在 RSC flight 的一个 JS 字符串字面量里，所以 HTML 里的引号写作 `\"`，
///    反斜杠写作 `\\`。
/// 2. 内层：还原出来才是 JSON，JSON 自己的字符串里还能再有 `\"`。
///
/// 于是页面上一个 **JSON 层的转义引号**长这样：`\\` + `\"`。只认外层的扫描器会把后半截
/// 当成字符串结束，从此括号计数全乱。
///
/// 为什么非要扫括号而不是找第一个 `]`：skill 名字里出现一个 `]` 就会把数组截断在半路，
/// 而截出来的**照样是合法 JSON**（数组少几条不报错），结果是榜单神不知鬼不觉少一截。
fn extract_initial_skills(html: &str) -> Option<String> {
    const KEY: &str = r#"initialSkills\":"#;
    let after_key = &html[html.find(KEY)? + KEY.len()..];
    let open = after_key.find('[')?;
    let body = &after_key[open..];
    let bytes = body.as_bytes();

    /// 读掉外层转义的一个单元，返回（JSON 层的那个字节, 吃掉几个字节）。
    /// `\uXXXX` 的内容与语法无关，用一个占位字节代表即可。
    fn unit(bytes: &[u8], i: usize) -> (u8, usize) {
        if bytes[i] != b'\\' || i + 1 >= bytes.len() {
            return (bytes[i], 1);
        }
        match bytes[i + 1] {
            b'"' => (b'"', 2),
            b'\\' => (b'\\', 2),
            b'u' if i + 6 <= bytes.len() => (b'u', 6),
            other => (other, 2),
        }
    }

    let mut depth = 0usize;
    let mut in_string = false;
    let mut i = 0usize;
    let mut end = None;
    while i < bytes.len() {
        let (c, w) = unit(bytes, i);
        if in_string {
            if c == b'\\' {
                // JSON 层的转义符：下一个 JSON 字符没有语法意义，连它一起吃掉。
                if i + w >= bytes.len() {
                    return None;
                }
                let (_, w2) = unit(bytes, i + w);
                i += w + w2;
                continue;
            }
            if c == b'"' {
                in_string = false;
            }
        } else {
            match c {
                b'"' => in_string = true,
                b'[' | b'{' => depth += 1,
                b'}' => depth = depth.checked_sub(1)?,
                b']' => {
                    depth = depth.checked_sub(1)?;
                    if depth == 0 {
                        end = Some(i + w);
                        break;
                    }
                }
                _ => {}
            }
        }
        i += w;
    }
    let slice = &body[..end?];

    // 反转义交给 serde_json：这段本来就是某个 JSON 字符串的一部分，用同一套规则还原
    // 才不会在 `é` 或 `\uXXXX` 上翻车。自己写 replace 只能覆盖到想得起来的那几个。
    serde_json::from_str::<String>(&format!("\"{slice}\"")).ok()
}

fn fetch_trending() -> Result<Vec<RegistryHit>, RegistryError> {
    let html = ureq::get(TRENDING_URL)
        .timeout(Duration::from_secs(15))
        .call()
        .map_err(|e| match e {
            ureq::Error::Status(code, _) => {
                RegistryError::new(RegistryErrKind::Http, format!("{code}"))
            }
            other => RegistryError::new(RegistryErrKind::Offline, other.to_string()),
        })?
        .into_string()
        .map_err(|e| RegistryError::new(RegistryErrKind::Http, e.to_string()))?;

    let json = extract_initial_skills(&html).ok_or_else(|| {
        RegistryError::new(
            RegistryErrKind::BadJson,
            "initialSkills not found in the trending page",
        )
    })?;
    let raw: Vec<RawTrending> = serde_json::from_str(&json)
        .map_err(|e| RegistryError::new(RegistryErrKind::BadJson, e.to_string()))?;

    Ok(raw
        .into_iter()
        .filter_map(|h| {
            let source = h.source?;
            let skill_id = h.skill_id?;
            Some(RegistryHit {
                installable: installable_source(&source),
                name: h.name.unwrap_or_else(|| skill_id.clone()),
                installs: h.installs,
                source,
                skill_id,
            })
        })
        .take(TRENDING_LIMIT)
        .collect())
}

/// 取到的那一刻 + 那一批。时间戳跟着数据走，不然判过期要另找一个地方存。
type TrendingSnapshot = (Instant, Vec<RegistryHit>);

static TRENDING_CACHE: Lazy<Mutex<Option<TrendingSnapshot>>> = Lazy::new(|| Mutex::new(None));

/// 榜单。TTL 内直接回缓存，不起网络。
///
/// `force` 绕过 TTL —— 面板上那个刷新按钮专用。没有它的话按钮在一小时内是个空操作：
/// 转一圈 loading，回来还是同一份缓存，用户以为刷新了其实根本没联网。
///
/// 取数失败时**回退到上一次成功的结果**（哪怕过了 TTL，哪怕是 `force`）：面板已经画出来
/// 的一屏东西不该因为一次网络抖动就变空。真的一次都没成功过才返回 `Err`。
pub fn trending(force: bool) -> Result<Vec<RegistryHit>, RegistryError> {
    if !force {
        if let Ok(cache) = TRENDING_CACHE.lock() {
            if let Some((at, hits)) = cache.as_ref() {
                if at.elapsed() < TRENDING_TTL {
                    return Ok(hits.clone());
                }
            }
        }
    }
    match fetch_trending() {
        Ok(hits) => {
            if let Ok(mut cache) = TRENDING_CACHE.lock() {
                *cache = Some((Instant::now(), hits.clone()));
            }
            Ok(hits)
        }
        Err(e) => {
            let stale = TRENDING_CACHE
                .lock()
                .ok()
                .and_then(|c| c.as_ref().map(|(_, hits)| hits.clone()));
            match stale {
                Some(hits) => Ok(hits),
                None => Err(e),
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Tauri 命令
// ---------------------------------------------------------------------------

#[tauri::command(async)]
pub fn tools_registry_search(query: String, limit: u32) -> Result<RegistrySearch, RegistryError> {
    search(&query, limit)
}

#[tauri::command(async)]
pub fn tools_registry_trending(force: bool) -> Result<Vec<RegistryHit>, RegistryError> {
    trending(force)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_two_segment_owner_repo_is_installable() {
        for s in [
            "emilkowalski/skills",
            "github/awesome-copilot",
            "a_b/c.d-e",
            "anthropics/claude-code",
        ] {
            assert!(installable_source(s), "{s}");
        }
    }

    /// 域名源是真实存在的（deepline 那批安装量 8k~26k），但没有任何公开的取内容
    /// 路径。判错一次就是给用户一个按下去必然失败的安装按钮。
    #[test]
    fn a_bare_domain_is_not_installable() {
        for s in [
            "code.deepline.com",
            "smithery.ai",
            "open.feishu.cn",
            "developer.paddle.com",
        ] {
            assert!(!installable_source(s), "{s}");
        }
    }

    /// 这个字符串会被拼进 `https://github.com/<source>.git` 交给 `git` 子进程。
    /// 放过一条就是把 git 的传输层交给陌生人。
    #[test]
    fn anything_that_could_reach_git_as_something_else_is_refused() {
        for s in [
            "a/b/c",                      // 三段：路径里能多插一层
            "../x/y",                     // 逃出去
            "a/..",                       //
            "-upload-pack/x",             // 以 `-` 开头会被 git 当参数
            "x/-c",                       //
            "ext::sh -c whoami/x",        // git 的 ext:: 传输协议
            "file:///etc/passwd",         //
            "https://github.com/a/b.git", // 完整 URL 一律不收，URL 由我们拼
            "a b/c",                      // 空格
            "a/",                         // 空段
            "/b",                         //
            "",                           //
        ] {
            assert!(!installable_source(s), "{s} 不该被放行");
        }
    }

    /// 接口的硬门槛是 2 个字符（HTTP 400）。本地先挡住，别拿一句英文报错糊用户脸上。
    #[test]
    fn a_query_shorter_than_two_characters_never_leaves_the_machine() {
        for q in ["", " ", "a", "  x  ", "\t"] {
            assert!(too_short(q), "{q:?} 不该发出去");
        }
        // 两个汉字是六个字节，按字节判会把一个合法查询当成太短。
        for q in ["中文", "ab", " ab "] {
            assert!(!too_short(q), "{q:?} 该发出去");
        }
    }

    // --- 榜单抽取 ---------------------------------------------------------
    //
    // 样本照实测抄的：数组塞在 RSC flight 的 JS 字符串字面量里，所以引号是 `\"`。
    // 这些测试全部离线，测的是抽取，不是 skills.sh。

    /// 把一段「正常 JSON」包成页面里那种转义态，省得每个用例手写一串反斜杠。
    fn as_page(json: &str) -> String {
        format!(
            r#"<script>self.__next_f.push([1,"...\"initialSkills\":{}\,\"totalSkills\":600..."])</script>"#,
            json.replace('\\', r"\\").replace('"', r#"\""#)
        )
    }

    #[test]
    fn the_trending_array_comes_out_of_the_page_with_its_fields_intact() {
        let html = as_page(
            r#"[{"source":"vercel-labs/agent-skills","skillId":"deploy-to-vercel","name":"deploy-to-vercel","installs":23166}]"#,
        );
        let json = extract_initial_skills(&html).expect("initialSkills should be found");
        let raw: Vec<RawTrending> = serde_json::from_str(&json).expect("valid json");
        assert_eq!(raw.len(), 1);
        assert_eq!(raw[0].skill_id.as_deref(), Some("deploy-to-vercel"));
        assert_eq!(raw[0].source.as_deref(), Some("vercel-labs/agent-skills"));
        assert_eq!(raw[0].installs, 23166);
    }

    /// 这是整个抽取最容易错的地方：名字里带 `]` 的话，不认转义层的括号扫描会把数组
    /// 截断在半路 —— 而截出来的东西**照样是合法 JSON**，于是榜单静悄悄地少一截，
    /// 没有任何报错。
    #[test]
    fn a_bracket_inside_a_name_does_not_truncate_the_array() {
        let html = as_page(
            r#"[{"source":"a/b","skillId":"x","name":"weird ] name","installs":1},{"source":"c/d","skillId":"y","name":"y","installs":2}]"#,
        );
        let json = extract_initial_skills(&html).expect("found");
        let raw: Vec<RawTrending> = serde_json::from_str(&json).expect("valid json");
        assert_eq!(raw.len(), 2, "第二条被 `]` 截掉了");
        assert_eq!(raw[1].skill_id.as_deref(), Some("y"));
    }

    /// 非 ASCII 要原样还原。自己写 replace 反转义的版本会在这里翻车。
    #[test]
    fn escapes_and_non_ascii_survive_the_unescaping() {
        let html = as_page(
            r#"[{"source":"a/b","skillId":"x","name":"café \" 中文","installs":1}]"#,
        );
        let json = extract_initial_skills(&html).expect("found");
        let raw: Vec<RawTrending> = serde_json::from_str(&json).expect("valid json");
        assert_eq!(raw[0].name.as_deref(), Some(r#"café " 中文"#));
    }

    /// 对方改了前端 → 抽不出来 → `None`。**不许 panic、不许 unwrap 出界**：
    /// 榜单只是锦上添花，它没了搜索还得能用。
    #[test]
    fn a_page_without_the_prop_yields_nothing_instead_of_panicking() {
        for html in [
            "",
            "<html><body>nothing here</body></html>",
            r#"<script>self.__next_f.push([1,"\"initialSkills\":"])</script>"#, // 有 key 没数组
            r#"<script>self.__next_f.push([1,"\"initialSkills\":[{\"source\":\"a/b\""])</script>"#, // 截断
            r#"<script>\"initialSkills\":]]]</script>"#, // 括号先闭合
        ] {
            assert!(
                extract_initial_skills(html).is_none(),
                "该抽不出来却抽出来了: {html}"
            );
        }
    }

    /// 打真站，默认不跑。
    ///
    /// 留着它是因为**这是扒前端，迟早会失效**：哪天面板空了，跑一句
    /// `cargo test -- --ignored the_live_trending_page` 就能立刻分清是「对方改了
    /// prop 名」还是「我们自己的解析坏了」，不用靠猜。
    #[test]
    #[ignore = "hits the network"]
    fn the_live_trending_page_still_carries_the_prop_we_read() {
        let hits = trending(true).expect("trending should come back");
        assert_eq!(hits.len(), TRENDING_LIMIT, "条数应当正好是取的上限");
        let first = &hits[0];
        assert!(!first.skill_id.is_empty());
        assert!(!first.source.is_empty());
        assert!(first.installs > 0, "24 小时榜首不该是 0 装机");
        // 已排好序：我们不再排一次，所以这条得由对方保证。
        assert!(
            hits.windows(2).all(|w| w[0].installs >= w[1].installs),
            "榜单不是降序的，得自己排了"
        );
    }

    /// 域名源在榜单里同样存在，同样标成装不了 —— 和搜索走的是同一个判定。
    #[test]
    fn the_trending_list_marks_domain_sources_as_not_installable() {
        assert!(installable_source("vercel-labs/agent-skills"));
        assert!(!installable_source("code.deepline.com"));
    }

    /// `search` 走到网络之前先自己拦一道 —— 测的是这道拦截，不是接口。
    #[test]
    fn the_search_entry_point_refuses_a_short_query_without_touching_the_network() {
        assert_eq!(
            search("a", 100).unwrap_err().kind,
            RegistryErrKind::TooShort
        );
    }
}
