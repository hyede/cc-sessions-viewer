---
title: Export and trash
description: Export one agent session or a batch as offline Markdown, HTML or lossless JSON, and delete sessions into a shared, restorable trash instead of running rm.
image: /screenshots/export.png
---

# Export and trash

## Export

![A session exported as a self-contained HTML file, opened in a browser](/screenshots/export.png)

`⌘E` exports the open session. Three formats, for three different reasons:

| Format | Use it for |
| --- | --- |
| Markdown | Pasting into an issue, a pull request or a document |
| HTML | Sending to someone. Fully offline, opens in any browser, no assets to ship alongside |
| JSON | Keeping the data. Lossless and still machine-readable |

The HTML export is self-contained: images are embedded, styles are inline, and it renders in a light or dark theme of your choosing. There is nothing to serve and no link that expires.

Batch export works the same way over a selection, and previous exports stay in a history list so you can find the file you made last week.

## Trash

![The shared trash listing deleted sessions from several agents](/screenshots/trash.png)

Deleting a session moves it into a trash directory. Nothing is removed with `rm`.

`⌘⇧T` opens the trash. Everything in it shows which agent it came from, which project, and when it was deleted, and restore puts it back where it was. Restore refuses to overwrite a session that already exists at the destination.

### One trash for every agent

The seven agents store sessions in seven different shapes: a single file for some, a whole directory for others, and a row in a [SQLite database](/agents/opencode) for opencode. The trash handles all of them through the same list, recording each entry's original path, agent, project and storage kind so it can be put back correctly.

That matters most for the directory-backed agents. Deleting a [Grok Build](/agents/grok-build) session means moving an entire folder, including `updates.jsonl`, `summary.json` and the lock files, and restoring it means recreating that folder intact.

## The read-only guarantee {#the-read-only-guarantee}

The app never modifies the contents of an original transcript. Reading, searching, exporting and analysing are all read-only operations.

Exactly three things write to agent data, and all three are explicit actions you take:

1. Renaming a session, which is synced back so the CLI's own session list agrees
2. Deleting, which is a reversible move into the trash
3. Continuing a session in chat, where new turns are appended by the agent CLI itself, exactly as if you had typed them in a terminal

Everything stays on your machine. Nothing is uploaded anywhere.
