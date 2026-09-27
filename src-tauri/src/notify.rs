//! 第三方推送（Bark / Telegram）的配置、安装与测试。
//!
//! 运行时发送由 `notify_hook.cjs` 完成 —— 它由各 agent 的 hook 触发，app 关着也能跑。
//! 本模块只负责：把凭证/开关写进 `notify.json`、把脚本释放到磁盘、复用
//! [`crate::tools::hooks_write`] 那套安全写入把 hook 挂到 Claude / Codex，以及在设置页
//! 里点「测试」时直接用 `ureq` 发一条（GUI 进程的 PATH 里未必有 node，所以测试不走脚本）。
//!
//! 隐私不变量与脚本一致：只发 图标 + 类别 + agent + 项目名(basename) + 时间。

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use crate::tools::hooks_write::{apply, HookEdit, HookOp, HookWriteReport};

const HOOK_SCRIPT: &str = include_str!("notify_hook.cjs");
const SCRIPT_NAME: &str = "notify-hook.cjs";
const HTTP_TIMEOUT: Duration = Duration::from_secs(8);

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct BarkConfig {
    enabled: bool,
    server: String,
    key: String,
}

impl Default for BarkConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            server: "https://api.day.app".to_string(),
            key: String::new(),
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct TelegramConfig {
    enabled: bool,
    bot_token: String,
    chat_id: String,
}

/// 何时推送。`Always`（默认）= app 关着也推；`AppHiddenOnly` = 仅在 app 开着但
/// 窗口没在看时推（离开电脑 / app 已退出则不推）。后者的判定靠 GUI 心跳写入的
/// `notify-presence.json`，实际门槛在 `notify_hook.cjs` 里执行。
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PushWhen {
    Always,
    AppHiddenOnly,
}

impl Default for PushWhen {
    fn default() -> Self {
        PushWhen::Always
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct NotifyConfig {
    bark: BarkConfig,
    telegram: TelegramConfig,
    /// http 代理（Telegram 常需要）。空 = 直连。
    proxy: String,
    /// 回复结束时通知（Claude/Codex 的 Stop）。
    notify_done: bool,
    /// 需要关注时通知（需要输入 / 授权）。
    notify_attention: bool,
    /// 挂在哪些 agent 上。
    agents: Vec<String>,
    /// 防抖窗口秒数。
    window_seconds: u32,
    /// 一批最多合并多少条。
    max_batch: u32,
    /// 推送时机（全部 / 仅 app 后台）。
    push_when: PushWhen,
}

impl Default for NotifyConfig {
    fn default() -> Self {
        Self {
            bark: BarkConfig::default(),
            telegram: TelegramConfig::default(),
            proxy: String::new(),
            notify_done: true,
            notify_attention: true,
            agents: vec!["claude".to_string(), "codex".to_string()],
            window_seconds: 30,
            max_batch: 5,
            push_when: PushWhen::Always,
        }
    }
}

fn data_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .or_else(dirs::data_dir)
        .ok_or_else(|| "Cannot locate local data directory".to_string())?;
    Ok(base.join("cc-sessions-viewer"))
}

fn config_path() -> Result<PathBuf, String> {
    Ok(data_dir()?.join("notify.json"))
}

fn script_path() -> Result<PathBuf, String> {
    Ok(data_dir()?.join(SCRIPT_NAME))
}

fn presence_path() -> Result<PathBuf, String> {
    Ok(data_dir()?.join("notify-presence.json"))
}

fn read_config() -> NotifyConfig {
    config_path()
        .ok()
        .and_then(|path| fs::read(path).ok())
        .and_then(|bytes| serde_json::from_slice(&bytes).ok())
        .unwrap_or_default()
}

fn write_config_file(config: &NotifyConfig) -> Result<(), String> {
    let path = config_path()?;
    let parent = path
        .parent()
        .ok_or_else(|| "Data directory is unavailable".to_string())?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let temporary = path.with_extension("json.tmp");
    let bytes = serde_json::to_vec_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&temporary, bytes).map_err(|e| e.to_string())?;
    fs::rename(temporary, path).map_err(|e| e.to_string())
}

fn write_script() -> Result<PathBuf, String> {
    let path = script_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create notify dir: {e}"))?;
    }
    fs::write(&path, HOOK_SCRIPT).map_err(|e| format!("Failed to write notify script: {e}"))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&path)
            .map_err(|e| e.to_string())?
            .permissions();
        perms.set_mode(0o755);
        fs::set_permissions(&path, perms).map_err(|e| e.to_string())?;
    }
    Ok(path)
}

/// 命令行参数按 turn hook 的写法双引号包裹并转义（路径里有 "Application Support" 的空格）。
fn quote(raw: &str) -> String {
    format!("\"{}\"", raw.replace('\\', "\\\\").replace('"', "\\\""))
}

fn hook_command(script: &Path, agent: &str, kind: &str, data_dir: &Path) -> String {
    format!(
        "node {} hook {} {} {}",
        quote(&script.to_string_lossy()),
        agent,
        kind,
        quote(&data_dir.to_string_lossy()),
    )
}

struct EventTarget {
    event: &'static str,
    matcher: Option<&'static str>,
}

/// 一个 (agent, kind) 对应到该 agent 上的哪些事件。Codex 没有 Notification：
/// 「需要关注」= 需要输入(PreToolUse/request_user_input) + 需要授权(PermissionRequest)。
fn targets(agent: &str, kind: &str) -> Vec<EventTarget> {
    match (agent, kind) {
        ("claude", "done") => vec![EventTarget { event: "Stop", matcher: None }],
        ("claude", "attention") => vec![EventTarget { event: "Notification", matcher: None }],
        ("codex", "done") => vec![EventTarget { event: "Stop", matcher: None }],
        ("codex", "attention") => vec![
            EventTarget { event: "PreToolUse", matcher: Some("request_user_input") },
            EventTarget { event: "PermissionRequest", matcher: None },
        ],
        _ => vec![],
    }
}

const SUPPORTED_AGENTS: [&str; 2] = ["claude", "codex"];
const KINDS: [&str; 2] = ["done", "attention"];

fn edit(agent: &str, op: HookOp, tgt: &EventTarget, command: String) -> HookEdit {
    HookEdit {
        agent: agent.to_string(),
        op,
        event: tgt.event.to_string(),
        matcher: tgt.matcher.map(str::to_string),
        command,
        timeout: Some(10),
    }
}

/// 按当前配置的开关，要装哪些落点。
fn desired_edits(config: &NotifyConfig, script: &Path, data_dir: &Path) -> Vec<HookEdit> {
    let mut kinds: Vec<&str> = Vec::new();
    if config.notify_done {
        kinds.push("done");
    }
    if config.notify_attention {
        kinds.push("attention");
    }
    let mut out = Vec::new();
    for agent in &config.agents {
        if !SUPPORTED_AGENTS.contains(&agent.as_str()) {
            continue;
        }
        for kind in &kinds {
            let command = hook_command(script, agent, kind, data_dir);
            for tgt in targets(agent, kind) {
                out.push(edit(agent, HookOp::Add, &tgt, command.clone()));
            }
        }
    }
    out
}

/// 所有可能的落点（不看开关）—— 用于「先清干净」和卸载，避免改了开关后残留旧 hook。
fn all_edits(script: &Path, data_dir: &Path, op: HookOp) -> Vec<HookEdit> {
    let mut out = Vec::new();
    for agent in SUPPORTED_AGENTS {
        for kind in KINDS {
            let command = hook_command(script, agent, kind, data_dir);
            for tgt in targets(agent, kind) {
                out.push(edit(agent, op, &tgt, command.clone()));
            }
        }
    }
    out
}

fn install() -> Result<HookWriteReport, String> {
    let config = read_config();
    let script = write_script()?;
    let data = data_dir()?;
    // 先把所有旧落点清掉，再按当前开关装 —— 保证与配置一致，不留残条。
    let _ = apply(&all_edits(&script, &data, HookOp::Remove), None, false);
    apply(&desired_edits(&config, &script, &data), None, false)
}

fn uninstall() -> Result<HookWriteReport, String> {
    let script = script_path()?;
    let data = data_dir()?;
    apply(&all_edits(&script, &data, HookOp::Remove), None, false)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotifyStatus {
    installed: bool,
    /// 已挂上我们 hook 的 agent。
    agents: Vec<String>,
    script_present: bool,
}

fn status() -> NotifyStatus {
    let script_present = script_path().map(|p| p.is_file()).unwrap_or(false);
    let scan = crate::tools::hooks::scan(None);
    let mut agents: Vec<String> = Vec::new();
    for entry in &scan.hooks {
        if entry.command.contains(SCRIPT_NAME) {
            for agent in &entry.agents {
                if !agents.contains(agent) {
                    agents.push(agent.clone());
                }
            }
        }
    }
    NotifyStatus {
        installed: !agents.is_empty(),
        agents,
        script_present,
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChannelResult {
    ok: bool,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotifyTestResult {
    /// None = 该渠道未启用。
    bark: Option<ChannelResult>,
    telegram: Option<ChannelResult>,
}

fn build_agent(proxy: &str) -> Result<ureq::Agent, String> {
    let mut builder = ureq::AgentBuilder::new();
    let proxy = proxy.trim();
    if !proxy.is_empty() {
        let p = ureq::Proxy::new(proxy).map_err(|e| format!("Invalid proxy: {e}"))?;
        builder = builder.proxy(p);
    }
    Ok(builder.build())
}

fn send_bark(agent: &ureq::Agent, cfg: &BarkConfig, text: &str) -> Result<(), String> {
    let server = cfg.server.trim().trim_end_matches('/');
    let url = format!("{server}/{}", cfg.key.trim());
    agent
        .post(&url)
        .timeout(HTTP_TIMEOUT)
        .send_json(serde_json::json!({
            "title": "cc-sessions-viewer",
            "body": text,
            "group": "cc-sessions-viewer",
        }))
        .map(|_| ())
        .map_err(|e| e.to_string())
}

fn send_telegram(agent: &ureq::Agent, cfg: &TelegramConfig, text: &str) -> Result<(), String> {
    let url = format!("https://api.telegram.org/bot{}/sendMessage", cfg.bot_token.trim());
    agent
        .post(&url)
        .timeout(HTTP_TIMEOUT)
        .send_json(serde_json::json!({
            "chat_id": cfg.chat_id.trim(),
            "text": text,
            "disable_web_page_preview": true,
        }))
        .map(|_| ())
        .map_err(|e| e.to_string())
}

fn send_test() -> Result<NotifyTestResult, String> {
    let config = read_config();
    let text = "\u{1F9EA} cc-sessions-viewer 测试通知";
    let mut result = NotifyTestResult {
        bark: None,
        telegram: None,
    };
    if config.bark.enabled && !config.bark.key.trim().is_empty() {
        let outcome = build_agent(&config.proxy).and_then(|a| send_bark(&a, &config.bark, text));
        result.bark = Some(ChannelResult {
            ok: outcome.is_ok(),
            error: outcome.err(),
        });
    }
    if config.telegram.enabled
        && !config.telegram.bot_token.trim().is_empty()
        && !config.telegram.chat_id.trim().is_empty()
    {
        let outcome =
            build_agent(&config.proxy).and_then(|a| send_telegram(&a, &config.telegram, text));
        result.telegram = Some(ChannelResult {
            ok: outcome.is_ok(),
            error: outcome.err(),
        });
    }
    Ok(result)
}

// ---------------------------------------------------------------------------
// App 存活 / 可见性心跳（供 `pushWhen = appHiddenOnly` 判定）
// ---------------------------------------------------------------------------
//
// GUI 通过 `set_notify_visibility` 上报窗口是否在看，并由后台线程每 10s 续一次
// 时间戳，把 `{ visible, ts }` 写进 `notify-presence.json`。脚本据此判断 app 是否
// 还开着（ts 新鲜）以及是否在前台（visible）。仅在 appHiddenOnly 模式下写文件 ——
// always 模式脚本根本不读它，避免无谓的持续写盘。用后台线程而非 webview 定时器，
// 是因为窗口被遮挡/最小化时 webview 的 JS 定时器会被系统节流甚至挂起。

static APP_VISIBLE: AtomicBool = AtomicBool::new(true);

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn write_presence_if_enabled(visible: bool) {
    if read_config().push_when != PushWhen::AppHiddenOnly {
        return;
    }
    let Ok(path) = presence_path() else {
        return;
    };
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let body = serde_json::json!({ "visible": visible, "ts": now_ms() });
    if let Ok(bytes) = serde_json::to_vec(&body) {
        let temporary = path.with_extension("json.tmp");
        if fs::write(&temporary, bytes).is_ok() {
            let _ = fs::rename(temporary, path);
        }
    }
}

/// 每 10s 续一次心跳，让脚本能区分「app 开着挂后台」与「app 已退出」。
pub fn spawn_presence_heartbeat() {
    std::thread::spawn(|| loop {
        std::thread::sleep(Duration::from_secs(10));
        write_presence_if_enabled(APP_VISIBLE.load(Ordering::Relaxed));
    });
}

// ---------------------------------------------------------------------------
// Tauri 命令
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn read_notify_config() -> NotifyConfig {
    read_config()
}

#[tauri::command]
pub fn write_notify_config(config: NotifyConfig) -> Result<(), String> {
    write_config_file(&config)
}

#[tauri::command(async)]
pub fn install_notify_hooks() -> Result<HookWriteReport, String> {
    install()
}

#[tauri::command(async)]
pub fn uninstall_notify_hooks() -> Result<HookWriteReport, String> {
    uninstall()
}

#[tauri::command(async)]
pub fn notify_hook_status() -> NotifyStatus {
    status()
}

#[tauri::command(async)]
pub fn notify_send_test() -> Result<NotifyTestResult, String> {
    send_test()
}

/// GUI 上报窗口可见性（聚焦 + 未隐藏）。立刻落盘一次，心跳线程随后续时间戳。
#[tauri::command]
pub fn set_notify_visibility(visible: bool) {
    APP_VISIBLE.store(visible, Ordering::Relaxed);
    write_presence_if_enabled(visible);
}

