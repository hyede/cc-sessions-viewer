---
title: Install on macOS, Windows and Linux
description: Download the Sessions Viewer installer for macOS, Windows or Linux, and get past the Gatekeeper warning that the unsigned macOS build triggers on first launch.
---

# Install on macOS, Windows and Linux

Download the installer for your platform from the [releases page](https://github.com/jerrywu001/cc-sessions-viewer/releases):

| Platform | File |
| --- | --- |
| macOS (Apple Silicon + Intel) | `.dmg` |
| Windows x64 | `-setup.exe` / `.msi` |
| Linux x86_64 | `.deb` / `.AppImage` |

## macOS: getting past Gatekeeper

> [!IMPORTANT]
> The macOS build is ad-hoc signed and not notarized, so Gatekeeper blocks the first launch with *"Apple could not verify 'Sessions Viewer' is free of malware."* That is the normal message for an unsigned open-source build, not a sign that something is wrong.

### macOS 15 Sequoia and later

Apple removed the Control-click bypass in Sequoia, so use System Settings instead:

1. Double-click the app once and dismiss the warning.
2. Open **System Settings → Privacy & Security** and scroll to the bottom.
3. Next to *"Sessions Viewer" was blocked*, click **Open Anyway** and authenticate.
4. Launch the app again and click **Open**.

### macOS 14 Sonoma and earlier

Control-click (or right-click) the app in Finder, choose **Open**, then click **Open** in the dialog. Once is enough.

### From the terminal, on any macOS version

```bash
xattr -dr com.apple.quarantine "/Applications/Sessions Viewer.app"
```

Prefix the command with `sudo` if it reports `Operation not permitted`.

## Linux

The `.AppImage` is portable: run `chmod +x` on it and start it. The `.deb` installs with:

```bash
sudo apt install ./cc-sessions-viewer_<ver>_amd64.deb
```
