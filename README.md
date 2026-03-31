# openclaw-claude-code

Programmable bridge that turns coding CLIs into headless, agentic engines — persistent sessions, multi-engine orchestration, multi-agent council, and dynamic runtime control.

[![npm version](https://img.shields.io/npm/v/@enderfga/openclaw-claude-code.svg)](https://www.npmjs.com/package/@enderfga/openclaw-claude-code)
[![CI](https://github.com/Enderfga/openclaw-claude-code/actions/workflows/ci.yml/badge.svg)](https://github.com/Enderfga/openclaw-claude-code/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why This Exists

Claude Code and Codex are powerful coding CLIs, but they're designed for interactive use. If you want AI agents to **programmatically** drive coding sessions — start them, send tasks, manage context, coordinate teams, switch models mid-conversation — you need a control layer.

This project wraps coding CLIs and exposes their capabilities as a clean, tool-based API. Your agents get persistent sessions, real-time streaming, multi-model routing, multi-engine support, and multi-agent council orchestration.

## Quick Start

```bash
# As OpenClaw plugin
openclaw plugins install @enderfga/openclaw-claude-code

# Or standalone
npm install -g @enderfga/openclaw-claude-code
claude-code-skill serve
```

```typescript
import { SessionManager } from '@enderfga/openclaw-claude-code';

const manager = new SessionManager();
await manager.startSession({ name: 'task', cwd: '/project' });
const result = await manager.sendMessage('task', 'Fix the failing tests');
```

See [Getting Started](./docs/getting-started.md) for full setup guide.

## Features

### Multi-Engine Sessions

Drive Claude Code and OpenAI Codex through a unified `ISession` interface. Each engine manages its own subprocess, events, and cost tracking.

```typescript
// Claude Code engine (default)
await manager.startSession({ name: 'claude-task', engine: 'claude', model: 'opus' });

// Codex engine
await manager.startSession({ name: 'codex-task', engine: 'codex', model: 'o4-mini' });
```

See [Multi-Engine](./docs/multi-engine.md) for architecture and adding new engines.

### Multi-Agent Council

Multiple agents collaborate in parallel on the same codebase with git worktree isolation, consensus voting, and a two-phase protocol (plan then execute).

```typescript
const session = manager.councilStart('Build a REST API with auth', {
  agents: [
    { name: 'Architect', emoji: '🏗️', persona: 'System design', engine: 'claude', model: 'opus' },
    { name: 'Engineer', emoji: '⚙️', persona: 'Implementation', engine: 'codex', model: 'o4-mini' },
    { name: 'Reviewer', emoji: '🔍', persona: 'Code review', engine: 'claude', model: 'sonnet' },
  ],
  maxRounds: 10,
  projectDir: '/tmp/api-project',
});
```

See [Council](./docs/council.md) for the full collaboration protocol.

### 18 Tools

| Category | Tools |
|----------|-------|
| Session Lifecycle | `claude_session_start`, `send`, `stop`, `list`, `overview` |
| Session Operations | `status`, `grep`, `compact`, `update_tools`, `switch_model` |
| Agent Teams | `agents_list`, `team_list`, `team_send` |
| Council | `council_start`, `council_status`, `council_abort`, `council_inject` |

See [Tools Reference](./docs/tools.md) for complete API.

### And More

- **Session Persistence** — 7-day disk TTL, auto-resume across restarts
- **Multi-Model Proxy** — Anthropic ↔ OpenAI format translation for Gemini/GPT
- **Cost Tracking** — per-model pricing with real-time token accounting
- **Effort Control** — `low` to `max` thinking depth per message
- **Runtime Model/Tool Switching** — hot-swap via `--resume`

## Architecture

```
src/
├── index.ts                    # Plugin entry — 18 tools + proxy route
├── types.ts                    # Shared types, ISession interface, model pricing
├── persistent-session.ts       # Claude Code engine (ISession)
├── persistent-codex-session.ts # Codex engine (ISession)
├── session-manager.ts          # Multi-session orchestration + council management
├── council.ts                  # Multi-agent council orchestration
├── consensus.ts                # Consensus vote parsing
├── embedded-server.ts          # HTTP server for standalone mode
├── hooks/
│   └── prompt-bypass.ts
└── proxy/
    ├── handler.ts              # Provider detection + routing
    ├── anthropic-adapter.ts    # Anthropic ↔ OpenAI conversion
    ├── schema-cleaner.ts       # Gemini schema compatibility
    └── thought-cache.ts        # Gemini thought caching
```

## Documentation

| Doc | Description |
|-----|-------------|
| [Getting Started](./docs/getting-started.md) | Installation, configuration, first session |
| [Sessions](./docs/sessions.md) | Persistent sessions, resume, model switching, cost tracking |
| [Multi-Engine](./docs/multi-engine.md) | Claude + Codex engines, ISession interface, adding engines |
| [Council](./docs/council.md) | Multi-agent collaboration, worktree isolation, consensus voting |
| [Tools Reference](./docs/tools.md) | Complete tool API with all parameters |
| [CLI Reference](./docs/cli.md) | Command-line interface |
| [Contributing](./CONTRIBUTING.md) | Dev setup, code style, PR guidelines |

## Requirements

- **Node.js >= 22**
- **Claude Code CLI** — `npm install -g @anthropic-ai/claude-code`
- **OpenClaw >= 2026.3.0** (optional, for plugin mode)
- **Codex CLI** (optional) — `npm install -g @openai/codex`

## License

MIT
