# openclaw-claude-code

Programmable bridge that turns Claude Code CLI into a headless, agentic coding engine — persistent sessions, multi-model proxy, agent teams, and dynamic runtime control.

[![npm version](https://img.shields.io/npm/v/@enderfga/openclaw-claude-code.svg)](https://www.npmjs.com/package/@enderfga/openclaw-claude-code)
[![CI](https://github.com/Enderfga/openclaw-claude-code/actions/workflows/ci.yml/badge.svg)](https://github.com/Enderfga/openclaw-claude-code/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why This Exists

Claude Code is a powerful coding CLI, but it's designed for interactive, human-in-the-loop use. If you want AI agents to **programmatically** drive coding sessions — start them, send tasks, manage context, coordinate teams, switch models mid-conversation — you need a control layer.

That's what this project is. It wraps mature CLI tools (starting with Claude Code) and exposes their **programming capabilities** as a clean, tool-based API. Your agents get persistent sessions that survive across messages, real-time streaming, multi-model routing, and full lifecycle control — without reimplementing the coding engine from scratch.

**Works as:**

| Mode | Description |
|------|-------------|
| **OpenClaw Plugin** | Install once, agents get `claude_session_*` tools automatically |
| **Standalone CLI** | `claude-code-skill serve` — no OpenClaw needed |
| **TypeScript Library** | `import { SessionManager } from '@enderfga/openclaw-claude-code'` |

## Quick Start

### As OpenClaw Plugin

```bash
openclaw plugins install @enderfga/openclaw-claude-code
openclaw gateway restart
```

Agents can now use all 14 tools: `claude_session_start`, `claude_session_send`, etc.

### Standalone CLI

```bash
npm install -g @enderfga/openclaw-claude-code

# Start the embedded server
claude-code-skill serve

# Drive sessions from the command line
claude-code-skill session-start myproject -d ~/project
claude-code-skill session-send myproject "fix the auth bug"
claude-code-skill session-status myproject
claude-code-skill session-stop myproject
```

### TypeScript Library

```typescript
import { SessionManager } from '@enderfga/openclaw-claude-code';

const manager = new SessionManager({ defaultModel: 'claude-sonnet-4-6' });

const session = await manager.startSession({
  name: 'backend-fix',
  cwd: '/path/to/project',
  permissionMode: 'acceptEdits',
  allowedTools: ['Bash', 'Read', 'Edit', 'Write'],
});

const result = await manager.sendMessage('backend-fix', 'Fix the failing tests in src/auth/');
console.log(result.text);

await manager.stopSession('backend-fix');
```

## Tools (14)

### Session Lifecycle

| Tool | Description |
|------|-------------|
| `claude_session_start` | Start a session with full CLI flag support (model, effort, worktree, bare, agents, etc.) |
| `claude_session_send` | Send a message, get streaming response with token/cost tracking |
| `claude_session_stop` | Graceful shutdown (SIGTERM → SIGKILL fallback) |
| `claude_session_list` | List active + persisted sessions (survives gateway restarts) |
| `claude_session_status` | Tokens, cost, context %, tool calls, uptime |

### Session Operations

| Tool | Description |
|------|-------------|
| `claude_session_grep` | Regex search over session history (last 500 events) |
| `claude_session_compact` | Reclaim context window via `/compact` with optional summary |
| `claude_session_update_tools` | Add/remove allowed tools at runtime (restarts with `--resume`) |
| `claude_session_switch_model` | Hot-swap model mid-conversation (preserves history via `--resume`) |

### Agent Teams

| Tool | Description |
|------|-------------|
| `claude_agents_list` | List agent definitions from `.claude/agents/` (project + global) |
| `claude_team_list` | List teammates in an agent team session |
| `claude_team_send` | Send message to a specific teammate |

### Health & Monitoring

| Tool | Description |
|------|-------------|
| `claude_session_health` | Health check for a specific session |
| `claude_sessions_overview` | Plugin-wide dashboard: all sessions, aggregate stats, version |

## Key Features

### Persistent Sessions

Claude Code CLI normally exits after each message. This plugin keeps sessions alive indefinitely — multi-turn agent loops without startup overhead, shared context across messages, conversation history preserved.

```bash
# Start once, send many messages
claude-code-skill session-start task -d ~/project -m opus --effort high
claude-code-skill session-send task "Implement rate limiting"
claude-code-skill session-send task "Now add tests for it"
claude-code-skill session-send task "Run the test suite and fix failures"

# Resume after restart (sessions persist to disk with 7-day TTL)
claude-code-skill session-send task "Continue where we left off" --auto-resume
```

### Session Resume & Fork

Leverage Claude Code's `--resume` flag to preserve multi-turn context across process restarts. This enables dynamic model/tool switching without losing conversation history.

```bash
# Switch model mid-conversation — history preserved
claude-code-skill session-model myproject opus

# Update tool permissions at runtime
claude-code-skill session-start safe -d ~/project --allowed-tools "Read,Glob,Grep"
# Later, grant write access:
# claude_session_update_tools({ name: "safe", allowedTools: ["Read,Glob,Grep,Edit,Write"] })

# Fork a session for experiments
claude-code-skill session-fork main experimental
```

### Multi-Model Proxy

Built-in Anthropic-to-OpenAI format translation. Claude Code CLI speaks Anthropic format; the proxy converts bidirectionally for Gemini, GPT, and other models. Pure TypeScript, zero Python.

- Streaming SSE conversion (Anthropic ↔ OpenAI format)
- Gemini tool schema cleaning (removes unsupported JSON Schema keys)
- Gemini thought signature caching (round-trip thinking on 2nd+ turns)
- Auto-detect provider from model name (claude/gemini/gpt patterns)
- Gateway passthrough mode (OpenClaw handles routing)

### Agent Teams

Deploy multiple Claude agents working together. Define roles, switch agents mid-conversation, coordinate via `@teammate` mentions.

```bash
claude-code-skill session-start team -d ~/project \
  --enable-agent-teams \
  --agents '{
    "architect": { "prompt": "Design scalable systems" },
    "developer": { "prompt": "Write clean, tested code" },
    "reviewer":  { "prompt": "Review for bugs and improvements" }
  }' \
  --agent architect

claude-code-skill session-send team "Design the authentication system"
claude-code-skill session-send team "@developer implement the design"
claude-code-skill session-send team "@reviewer review the implementation"
```

### Cost Tracking & Effort Control

Real-time token accounting with per-model pricing. Effort levels control thinking depth.

```bash
# Effort levels
claude-code-skill session-send task "Quick lint fix" --effort low
claude-code-skill session-send task "Design new auth system" --ultrathink

# Budget limits
claude-code-skill session-start task -d ~/project --max-budget 5.00

# Cost breakdown
claude-code-skill session-cost myproject
# → Input $0.0103 | Cached $0.0033 | Output $0.0518 | Total: $0.0654
```

## Architecture

```
                    ┌─────────────────────────────┐
                    │      OpenClaw Gateway        │
                    │   (or standalone HTTP server) │
                    └──────────┬──────────────────┘
                               │ 14 tools
                    ┌──────────▼──────────────────┐
                    │     Plugin Entry (index.ts)   │
                    │  tool registration + hooks     │
                    └──────────┬──────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │      SessionManager              │
              │  multi-session orchestration      │
              │  persistence, TTL, health         │
              └───────┬────────────────┬────────┘
                      │                │
         ┌────────────▼──┐    ┌───────▼──────────┐
         │ Persistent     │    │ Multi-Model       │
         │ ClaudeSession  │    │ Proxy             │
         │                │    │                   │
         │ CLI subprocess │    │ Anthropic ↔ OpenAI│
         │ JSON streaming │    │ SSE conversion    │
         │ event tracking │    │ Schema cleaning   │
         └───────┬────────┘    └───────┬──────────┘
                 │                     │
         ┌───────▼────────┐    ┌───────▼──────────┐
         │  Claude Code    │    │  Gemini / GPT /  │
         │  CLI            │    │  Other Models    │
         └────────────────┘    └──────────────────┘
```

```
src/
├── index.ts                 # Plugin entry — 14 tools + hooks + proxy route
├── types.ts                 # Shared types, model pricing/aliases
├── persistent-session.ts    # Claude CLI subprocess management
├── session-manager.ts       # Multi-session orchestration + persistence
├── embedded-server.ts       # Auto-start HTTP server for standalone mode
├── hooks/
│   └── prompt-bypass.ts     # Passthrough workspace hook
└── proxy/
    ├── handler.ts           # HTTP route handler + provider detection
    ├── anthropic-adapter.ts # Anthropic ↔ OpenAI bidirectional conversion
    ├── schema-cleaner.ts    # Gemini JSON Schema compatibility
    └── thought-cache.ts     # Gemini thought signature LRU cache
```

## CLI Reference

### Session Management

```bash
claude-code-skill session-start [name] [options]
  -d, --dir <path>              Working directory
  -m, --model <model>           Model name or alias (opus, sonnet, haiku, gemini-pro, etc.)
  --effort <level>              low | medium | high | max | auto
  --permission-mode <mode>      acceptEdits | plan | auto | default | bypassPermissions
  --allowed-tools <tools>       Comma-separated tool whitelist
  --disallowed-tools <tools>    Comma-separated tool blacklist
  --max-budget <usd>            API cost ceiling
  --bare                        No CLAUDE.md, no git context
  --worktree                    Isolated git worktree
  --fallback-model <model>      Fallback if primary model fails
  --enable-agent-teams          Enable multi-agent mode
  --append-system-prompt <text> Append to system prompt

claude-code-skill session-send <name> <message> [options]
  --stream                      Real-time SSE output
  --effort <level>              Override effort for this message
  --plan                        Enter plan mode (Claude plans before executing)
  --ultrathink                  Maximum thinking depth
  -t, --timeout <ms>            Custom timeout (default 300s)

claude-code-skill session-stop <name>
claude-code-skill session-list
claude-code-skill session-status <name>
claude-code-skill session-grep <name> <pattern>
claude-code-skill session-compact <name> [--summary <text>]
claude-code-skill session-cost <name>
claude-code-skill session-model <name> <model>
```

### Agent & Skill Management

```bash
claude-code-skill agents-list [-d <dir>]
claude-code-skill agents-create <name> [--description <desc>] [--prompt <prompt>]
claude-code-skill skills-list [-d <dir>]
claude-code-skill skills-create <name> [--description <desc>] [--prompt <prompt>]
claude-code-skill rules-list [-d <dir>]
claude-code-skill rules-create <name> [--paths "*.py"] [--condition "Bash(git *)"]
```

### Agent Teams

```bash
claude-code-skill session-start team -d ~/project --enable-agent-teams
claude-code-skill session-team-list <name>
claude-code-skill session-team-send <name> <teammate> <message>
```

## Configuration

In `~/.openclaw/openclaw.json`:

```jsonc
{
  "plugins": {
    "entries": {
      "openclaw-claude-code": {
        "enabled": true,
        "config": {
          "claudeBin": "claude",
          "defaultModel": "claude-opus-4-6",
          "defaultPermissionMode": "acceptEdits",
          "defaultEffort": "auto",
          "maxConcurrentSessions": 5,
          "sessionTtlMinutes": 120,
          "proxy": {
            "enabled": false,
            "bigModel": "gemini-2.5-pro",
            "smallModel": "gemini-2.5-flash"
          }
        }
      }
    }
  }
}
```

## Design Philosophy

This project is an **agentic CLI bridge** — it makes coding CLIs programmable for AI agents. The scope is deliberate:

**What we track:**
- Every upstream feature that improves **programming capabilities** (new tools, models, context management, agent coordination)
- Session lifecycle, streaming, cost tracking, multi-model routing
- Anything that makes agent-driven coding more reliable and efficient

**What we don't track:**
- Voice interfaces, keyboard shortcuts, color themes, terminal UI
- Features designed for human-in-the-loop interactive use
- Anything that doesn't serve the headless, agentic use case

When Claude Code ships a new feature, we ask one question: *does this make agent-driven coding better?* If yes, we ship it. If it's a UX feature for human users, we skip it.

## Requirements

- **Node.js >= 22**
- **Claude Code CLI** — `npm install -g @anthropic-ai/claude-code`
- **OpenClaw >= 2026.3.0** — for plugin mode (optional)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, code style, and PR guidelines.

## License

MIT
