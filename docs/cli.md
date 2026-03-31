# CLI Reference

The CLI is an HTTP client that talks to the embedded server. In plugin mode, the server auto-starts. In standalone mode, run `claude-code-skill serve` first.

## Server

```bash
claude-code-skill serve [-p, --port <port>]
```

Start standalone embedded server (default port 18796). Set `CLAUDE_CODE_API_URL` to override the base URL.

## Session Management

### session-start

```bash
claude-code-skill session-start [name] [options]
```

| Flag | Description |
|------|-------------|
| `-d, --cwd <dir>` | Working directory |
| `-e, --engine <engine>` | Engine: `claude` (default) or `codex` |
| `-m, --model <model>` | Model name or alias |
| `--permission-mode <mode>` | `acceptEdits`, `plan`, `auto`, `bypassPermissions` |
| `--effort <level>` | `low`, `medium`, `high`, `max`, `auto` |
| `--allowed-tools <tools>` | Comma-separated tool whitelist |
| `--max-turns <n>` | Max agent loop turns |
| `--max-budget <usd>` | API cost ceiling |
| `--system-prompt <text>` | Replace system prompt |
| `--append-system-prompt <text>` | Append to system prompt |
| `--agents <json>` | Custom sub-agents JSON |
| `--agent <name>` | Default agent |
| `--bare` | No CLAUDE.md, no git context |
| `-w, --worktree [name]` | Git worktree |
| `--fallback-model <model>` | Fallback model |
| `--json-schema <schema>` | JSON Schema for structured output |
| `--mcp-config <paths>` | MCP config files (comma-separated) |
| `--settings <path>` | Settings.json path |
| `--skip-persistence` | Disable session persistence |
| `--betas <headers>` | Beta headers (comma-separated) |
| `--enable-agent-teams` | Enable agent teams |

### session-send

```bash
claude-code-skill session-send <name> <message> [options]
```

| Flag | Description |
|------|-------------|
| `--effort <level>` | Override effort for this message |
| `--plan` | Enable plan mode |
| `-s, --stream` | Collect streaming chunks |
| `-t, --timeout <ms>` | Timeout (default 300000) |

### session-stop

```bash
claude-code-skill session-stop <name>
```

### session-list

```bash
claude-code-skill session-list
```

### session-status

```bash
claude-code-skill session-status <name>
```

### session-grep

```bash
claude-code-skill session-grep <name> <pattern> [-n, --limit <n>]
```

### session-compact

```bash
claude-code-skill session-compact <name> [--summary <text>]
```

## Agent Management

```bash
claude-code-skill agents-list [-d, --cwd <dir>]
claude-code-skill agents-create <name> [--description <desc>] [--prompt <prompt>]
```

## Skills Management

```bash
claude-code-skill skills-list [-d, --cwd <dir>]
claude-code-skill skills-create <name> [--description <desc>] [--prompt <prompt>] [--trigger <t>]
```

## Rules Management

```bash
claude-code-skill rules-list [-d, --cwd <dir>]
claude-code-skill rules-create <name> [--description <desc>] [--content <text>] [--paths <glob>] [--condition <expr>]
```

## Agent Teams

```bash
claude-code-skill session-team-list <name>
claude-code-skill session-team-send <name> <teammate> <message>
```
