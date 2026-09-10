# 🧠 MindPM2

> A powerful interactive PM2 management CLI for Node.js servers.

MindPM2 is an interactive command line tool that makes managing [PM2](https://pm2.keymetrics.io/) processes easy. Instead of remembering dozens of `pm2` commands, open one beautiful terminal interface to view, start, stop, restart, reload, delete, monitor and diagnose your processes.

MindPM2 is **not** a replacement for PM2 — it is a friendly management layer on top of it.

---

## Features

- 🖥️ Interactive terminal dashboard with keyboard navigation
- ⚡ Direct CLI commands for scripting and automation
- 📋 Process list, details, search and sorting
- ▶️ Start, stop, restart, reload, delete, reset and scale
- 📜 Log viewing, live log streaming and log flushing
- 💾 `pm2 save` and `pm2 resurrect` with clear feedback
- ⚙️ PM2 startup management (systemd, launchd, Windows)
- 📁 Ecosystem file support (`ecosystem.config.js`/`.cjs`/`.json`)
- 📊 Live monitoring: CPU, RAM, disk, uptime, restarts, PID
- 🖥️ Server information (OS, kernel, Node, NPM, PM2, CPU, disk)
- 🩺 `doctor` diagnostics with suggested fixes
- 🔐 Sensitive environment variables are masked by default
- 🎨 Clean, modern UI with tables, boxes, colors and spinners
- 🌗 Four themes (`default`, `dark`, `light`, `mono`)
- 🌍 English and Dutch interface
- 🌐 Cross-platform: Linux, macOS and Windows
- 📦 NPM-ready with `npx` and `npm link` support

---

## Installation

### Global (NPM)

```bash
npm install -g mindpm2
mindpm2
```

### Without installing (NPX)

```bash
npx mindpm2
```

> MindPM2 requires PM2 to be installed. If it is missing, MindPM2 shows a clear message:
>
> ```bash
> npm install -g pm2
> ```

---

## Usage

### Interactive mode

```bash
mindpm2
```

Opens the main menu:

```text
┌──────────────────────────────┐
│ MindPM2                      │
│ PM2 Management               │
├──────────────────────────────┤
│ ❯ Dashboard                  │
│   Processes                  │
│   Start Application          │
│   Process Logs               │
│   Monitoring                 │
│   Startup                    │
│   Save / Restore             │
│   Ecosystem                  │
│   Server Information         │
│   Cleanup                    │
│   Settings                   │
│   Doctor                     │
│   Update                     │
│   Exit                       │
└──────────────────────────────┘
```

Navigate with the arrow keys, select with `Enter`, and go back with `Esc` / `Ctrl+C`.

### Direct CLI mode

```bash
mindpm2 list
mindpm2 start app.js --name my-app
mindpm2 stop my-app
mindpm2 restart my-app
mindpm2 reload my-app
mindpm2 logs my-app
mindpm2 save
mindpm2 startup
```

---

## Commands

| Command | Description |
| --- | --- |
| `mindpm2` | Open the interactive interface |
| `mindpm2 list [target]` | List PM2 processes (`--sort`, `--status`, `--json`) |
| `mindpm2 status [target]` | Alias for `list` |
| `mindpm2 start [target]` | Start a script, process, NPM script or ecosystem file |
| `mindpm2 stop <target>` | Stop a process |
| `mindpm2 restart <target>` | Restart a process |
| `mindpm2 reload <target>` | Zero-downtime reload |
| `mindpm2 delete <target>` | Delete a process |
| `mindpm2 reset <target>` | Reset restart/uptime counters |
| `mindpm2 scale <target> <n>` | Scale a process to `n` instances |
| `mindpm2 logs [target]` | Show logs (`--live`, `--err`, `--out`, `--lines`, `--clear`, `--files`) |
| `mindpm2 save` | Save the PM2 process list |
| `mindpm2 resurrect` | Restore the saved process list |
| `mindpm2 startup` | Manage startup (`--status`, `--disable`) |
| `mindpm2 doctor` | Diagnose the environment |
| `mindpm2 monitor` | Live monitor (`--once`, `--interval`) |
| `mindpm2 info` | Server information |
| `mindpm2 details <target>` | Detailed process info (`--reveal`, `--json`) |
| `mindpm2 ecosystem [action] [file]` | Manage ecosystem files |
| `mindpm2 cleanup` | Remove stopped/errored processes |
| `mindpm2 config [action]` | Manage MindPM2 configuration |
| `mindpm2 update` | Check for updates |
| `mindpm2 version` | Show version information |

### Global options

```text
--debug     Enable debug mode
--json      Output JSON
--yes       Skip confirmations
-V, --version
-h, --help
```

### Examples

```bash
# Start with options
mindpm2 start ./index.js --name MindAPI -i 2 --cluster --max-memory 500M

# JSON output for scripting
mindpm2 list --json
mindpm2 info --json

# Non-interactive stop
mindpm2 stop MindAPI --yes

# Live logs
mindpm2 logs MindAPI --live
```

---

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Success |
| 1 | General error |
| 2 | Invalid command |
| 3 | PM2 unavailable |
| 4 | Permission error |
| 5 | Process not found |

---

## Configuration

MindPM2 stores its configuration in `~/.mindpm2/config.json`:

```json
{
  "theme": "default",
  "language": "auto",
  "autoRefresh": true,
  "refreshInterval": 3000,
  "showLogo": true,
  "confirmDangerousActions": true,
  "maskEnvironmentVariables": true,
  "monitorInterval": 2000,
  "logLines": 50,
  "trustPlatform": true
}
```

Configuration is **optional** — MindPM2 always falls back to sensible defaults.

```bash
mindpm2 config show
mindpm2 config get refreshInterval
mindpm2 config set refreshInterval 5000
mindpm2 config reset
mindpm2 config edit
```

### Themes

MindPM2 ships with four themes: `default`, `dark`, `light` and `mono`.

```bash
mindpm2 config set theme mono
```

### Language

The interface is available in **English** and **Dutch**. `language` accepts `auto`, `en` or `nl`.
`auto` follows your system locale (or `MINDPM2_LANG`).

```bash
mindpm2 config set language nl
MINDPM2_LANG=nl mindpm2
```

---

## Logging

MindPM2 writes its own logs to `~/.mindpm2/logs/`:

```text
~/.mindpm2/logs/
├── mindpm2.log
└── errors.log
```

Logs are rotated automatically and never contain sensitive values.

---

## Security

- No passwords or secrets are ever stored.
- Sensitive environment variables (`*PASSWORD*`, `*TOKEN*`, `*API_KEY*`, ...) are masked by default and only revealed on explicit request.
- Commands are executed with `execFile`/`spawn` **without a shell**, preventing command injection.
- Process names, IDs, memory values and instances are validated before use.
- Dangerous actions (delete, reset, disable startup) always ask for confirmation.
- Sudo/root commands generated by `pm2 startup` are **never executed automatically** — MindPM2 prints them for you to run yourself.

---

## Development

```bash
git clone <repository>
cd MindPM2
npm install
npm link        # makes the `mindpm2` command available
```

Run the tests:

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:cli
```

Unlink:

```bash
npm unlink -g mindpm2
```

### Debugging

```bash
mindpm2 --debug
DEBUG=mindpm2 mindpm2
```

---

## Project structure

```text
src/
├── index.js            # CLI entry point (bin)
├── cli/                # commands, interactive UI, menus, prompts
├── pm2/                # PM2 abstraction (processes, logs, startup, ecosystem)
├── system/             # cpu, memory, disk, os, server info + platform modules
├── config/             # configuration manager and defaults
├── security/           # validator, sanitizer, permissions
├── ui/                 # logo, colors, tables, boxes, spinner
└── utils/              # errors, platform, version, paths, logger, debug
tests/
├── unit/
├── integration/
└── cli/
assets/
└── logo.txt
```

---

## License

[MIT](./LICENSE) © MindDevelopment
