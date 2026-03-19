# Claude Code Skill 🤖

Control Claude Code via MCP (Model Context Protocol). This CLI provides **agent-level** programmatic access to Claude Code — persistent sessions, effort control, context management, model switching, and agent teams.

Built for [OpenClaw](https://github.com/openclaw/openclaw) agents that need to drive Claude Code as a coding backend.

## What's New in v1.2 🚀

- **Cost Tracking** — `session-cost` with full token/price breakdown (Claude, Gemini, GPT pricing)
- **Session Branching** — `session-branch` to fork + change model/effort in one step
- **Hooks System** — `session-hooks` with webhook callbacks for tool errors, context high, stop events
- **Model Aliases** — built-in aliases (opus/sonnet/haiku/gemini-flash/gemini-pro) + custom `--model-overrides`
- **Config Files** — `--config agent.json` to load session presets from file
- **Cached Token Tracking** — separate pricing for prompt cache hits

### v1.1
- **Effort Control** — `--effort low/medium/high/max` at session and per-message level
- **Ultrathink** — `--ultrathink` flag for deep reasoning on complex tasks
- **Plan Mode** — `--plan` flag to have Claude create a plan before executing
- **Context Management** — `session-compact` to reclaim context, `session-context` to inspect usage
- **Model Switching** — `session-model` to switch models mid-session (with auto-resume)
- **Auto-Resume** — `--auto-resume` to restart stopped sessions transparently
- **NDJSON Streaming** — `--ndjson` for machine-readable streaming output
- **API Timeout Control** — configurable per-request timeouts with AbortController

## Features

- 🔌 **MCP Protocol** — Direct access to all Claude Code tools
- 💾 **Persistent Sessions** — Maintain context across multiple interactions
- 🧠 **Effort Control** — low/medium/high/max effort levels + ultrathink
- 📋 **Plan Mode** — Claude creates a plan before executing
- 🔄 **Context Management** — Compact sessions, inspect token usage
- 🤝 **Agent Teams** — Deploy multiple specialized agents
- 🔧 **Tool Control** — Fine-grained control over which tools are available
- 📊 **Budget Limits** — Set spending caps on API usage
- 🌐 **Multi-Model** — Use any model via proxy (Gemini, GPT, etc.)
- 📡 **Streaming** — Real-time SSE streaming with NDJSON support

## Installation

```bash
git clone https://github.com/Enderfga/openclaw-claude-code-skill.git
cd openclaw-claude-code-skill
npm install
npm run build
npm link  # optional: make CLI globally available
```

## Requirements

- Node.js 18+
- Backend API server running (see Configuration)
- Claude Code CLI installed

## Configuration

```bash
# Default: http://127.0.0.1:18795
export BACKEND_API_URL="http://your-server:port"
```

## Quick Start

```bash
# Start a session with high effort
claude-code-skill session-start myproject -d ~/project \
  --permission-mode acceptEdits \
  --allowed-tools "Bash,Read,Edit,Write,Glob,Grep" \
  --effort high

# Send a task with streaming
claude-code-skill session-send myproject "Refactor the auth module" --stream

# Need deep reasoning? Use ultrathink
claude-code-skill session-send myproject "Design a new caching layer" --stream --ultrathink

# Want a plan first?
claude-code-skill session-send myproject "Add rate limiting" --stream --plan

# Running low on context? Compact it
claude-code-skill session-compact myproject

# Check context usage
claude-code-skill session-context myproject

# Switch model mid-session
claude-code-skill session-model myproject sonnet

# Change effort level
claude-code-skill session-effort myproject max

# Done
claude-code-skill session-stop myproject
```

## Command Reference

### Connection & Tools

```bash
claude-code-skill connect          # Connect to MCP server
claude-code-skill disconnect       # Disconnect
claude-code-skill status           # Check connection status
claude-code-skill tools            # List available tools
```

### Direct Tool Calls

```bash
claude-code-skill bash "npm test"
claude-code-skill read /path/to/file.ts
claude-code-skill glob "**/*.ts" -p ~/project
claude-code-skill grep "TODO" -p ~/project -c
claude-code-skill call Write -a '{"file_path":"/tmp/test.txt","content":"Hello"}'
claude-code-skill batch-read "src/**/*.ts" "tests/**/*.test.ts" -p ~/project
```

### Persistent Sessions

#### Starting Sessions

```bash
# Basic
claude-code-skill session-start myproject -d ~/project

# With effort and model
claude-code-skill session-start myproject -d ~/project \
  --model claude-opus-4-5 \
  --effort high

# With proxy (multi-model support)
claude-code-skill session-start gemini-dev -d ~/project \
  --model gemini-2.0-flash \
  --base-url http://127.0.0.1:8082

# Full options
claude-code-skill session-start advanced -d ~/project \
  --permission-mode plan \
  --allowed-tools "Bash,Read,Edit,Write" \
  --disallowed-tools "Task" \
  --max-budget 5.00 \
  --effort high \
  --append-system-prompt "Always write tests" \
  --add-dir "/tmp,/var/log"
```

#### Sending Messages

```bash
# Basic (blocks until complete)
claude-code-skill session-send myproject "Write unit tests"

# Streaming
claude-code-skill session-send myproject "Refactor this" --stream

# With effort override (per-message)
claude-code-skill session-send myproject "Quick fix" --effort low
claude-code-skill session-send myproject "Complex redesign" --effort max

# Ultrathink (shorthand for --effort high)
claude-code-skill session-send myproject "Analyze this architecture" --ultrathink

# Plan mode
claude-code-skill session-send myproject "Add caching" --plan

# Auto-resume stopped sessions
claude-code-skill session-send myproject "Continue" --auto-resume

# NDJSON output (for programmatic consumption)
claude-code-skill session-send myproject "Run tests" --stream --ndjson

# Custom timeout
claude-code-skill session-send myproject "Long task" -t 900000
```

#### Effort & Model Control

```bash
# Set effort level (persists across messages)
claude-code-skill session-effort myproject low      # Minimal thinking
claude-code-skill session-effort myproject medium   # Balanced (Opus 4.6 default)
claude-code-skill session-effort myproject high     # Deep thinking
claude-code-skill session-effort myproject max      # Maximum, no token limit (Opus 4.6 only)
claude-code-skill session-effort myproject auto     # Reset to default

# Switch model mid-session
claude-code-skill session-model myproject opus
claude-code-skill session-model myproject sonnet
```

#### Context Management

```bash
# Compact session to reclaim context window
claude-code-skill session-compact myproject

# Compact with custom summary
claude-code-skill session-compact myproject --summary "Finished auth, now on tests"

# Check context usage
claude-code-skill session-context myproject
# → Tokens used: 45231, Usage: 22.6%, Suggestions: [...]
```

#### Session Management

```bash
claude-code-skill session-list                    # List active sessions
claude-code-skill session-status myproject        # Detailed status
claude-code-skill session-history myproject -n 50 # View history
claude-code-skill session-pause myproject         # Pause
claude-code-skill session-resume-paused myproject # Resume
claude-code-skill session-fork myproject exp      # Fork session
claude-code-skill session-restart myproject       # Restart failed session
claude-code-skill session-stop myproject          # Stop
```

### Session Search

```bash
claude-code-skill sessions -n 20              # List recent sessions
claude-code-skill session-search "bug fix"    # Search by query
claude-code-skill session-search --project ~/myapp
claude-code-skill session-search --since "2h"
claude-code-skill resume <session-id> "Continue" -d ~/project
```

### Permission Modes

| Mode | Description |
|------|-------------|
| `acceptEdits` | Auto-accept file edits (default) |
| `plan` | Preview changes before applying |
| `default` | Ask for each operation |
| `bypassPermissions` | Skip all prompts (dangerous!) |
| `delegate` | Delegate decisions to parent |
| `dontAsk` | Never ask, reject by default |

### Effort Levels

| Level | Symbol | Description | Best For |
|-------|--------|-------------|----------|
| `low` | ○ | Minimal thinking, fast | Simple fixes, lint, formatting |
| `medium` | ◐ | Balanced (Opus 4.6 default) | Most coding tasks |
| `high` | ● | Deep thinking | Architecture, complex refactors |
| `max` | ◉ | Maximum capability, no token limit | Opus 4.6 only. Hardest problems |
| `auto` | | Reset to model default | — |

## Multi-Model Support 🌐

Route requests through any OpenAI-compatible proxy:

```bash
# Gemini via proxy
claude-code-skill session-start gemini-task -d ~/project \
  --model gemini-2.0-flash \
  --base-url http://127.0.0.1:8082

# GPT via OpenAI endpoint
claude-code-skill session-start gpt-task -d ~/project \
  --model gpt-4o \
  --base-url https://api.openai.com/v1
```

This unlocks the full Claude Code agent loop with any model backend.

## Agent Teams

```bash
claude-code-skill session-start team -d ~/project \
  --agents '{
    "architect": {"prompt": "Design system architecture"},
    "developer": {"prompt": "Implement features"},
    "reviewer": {"prompt": "Review code quality"}
  }' \
  --agent architect

claude-code-skill session-send team "@developer implement the design"
claude-code-skill session-send team "@reviewer review the implementation"
```

## Cost Tracking

```bash
# Show cost breakdown
claude-code-skill session-cost myproject

# Output:
# Session 'myproject' cost breakdown:
#   Model: claude-opus-4-6
#   Tokens in:     12,345
#   Tokens out:    3,456
#   Cached tokens: 8,901
#
#   Pricing (per 1M tokens):
#     Input:  $15
#     Output: $75
#     Cached: $1.875
#
#   Breakdown:
#     Input:  $0.0517
#     Cached: $0.0167
#     Output: $0.2592
#
#   💰 Total: $0.3276
```

Built-in pricing for: Claude (Opus/Sonnet/Haiku), Gemini (Flash/Pro), GPT (4o/5.4). Falls back to Sonnet pricing for unknown models.

## Session Branching

```bash
# Branch from an existing session
claude-code-skill session-branch main experiment

# Branch with different model/effort
claude-code-skill session-branch main fast-test --model sonnet --effort low

# Both sessions share history but diverge from the branch point
```

## Hooks (Webhook Callbacks)

Register webhook URLs to get notified of session events:

```bash
# List available hooks
claude-code-skill session-hooks myproject

# Register webhooks
claude-code-skill session-hooks myproject \
  --on-tool-error http://localhost:8080/webhook \
  --on-context-high http://localhost:8080/webhook

# Available hooks:
# onToolError    — tool call failed
# onContextHigh  — context > 70% of max
# onStop         — session stopped (includes cost summary)
# onTurnComplete — turn finished (includes token usage)
# onStopFailure  — API error (rate limit, auth)
```

Webhook payload format:
```json
{
  "hook": "onToolError",
  "session": "myproject",
  "data": { "tool": "Bash", "error": "command not found" },
  "timestamp": "2026-03-19T09:51:38.195Z"
}
```

## Config Files

Load session settings from a JSON file:

```bash
claude-code-skill session-start myproject --config agent.json
```

Example `agent.json`:
```json
{
  "cwd": "~/project",
  "permissionMode": "acceptEdits",
  "allowedTools": ["Bash", "Read", "Edit", "Write", "Glob", "Grep"],
  "effort": "high",
  "maxBudget": "5.00",
  "modelOverrides": {
    "fast": "gemini-2.0-flash",
    "smart": "claude-opus-4-6"
  },
  "appendSystemPrompt": "Always write tests. Follow existing code style."
}
```

CLI flags override config file values.

## NDJSON Streaming Format

With `--stream --ndjson`, each line is a JSON object:

```jsonl
{"type":"text","text":"Let me "}
{"type":"text","text":"analyze this..."}
{"type":"tool_use","tool":"Bash","input":"npm test"}
{"type":"tool_result"}
{"type":"text","text":"All tests pass."}
{"type":"done","text":"All tests pass.","stop_reason":"end_turn"}
```

## Roadmap

### ✅ Completed (v1.1)
- [x] Effort control (low/medium/high/max/auto)
- [x] Ultrathink keyword support
- [x] Plan mode (`--plan`)
- [x] Session compaction (`session-compact`)
- [x] Context usage inspection (`session-context`)
- [x] Model switching mid-session (`session-model`)
- [x] Effort switching mid-session (`session-effort`)
- [x] Auto-resume stopped sessions (`--auto-resume`)
- [x] NDJSON streaming output
- [x] Configurable API timeouts with AbortController

### ✅ Completed (v1.2)
- [x] Session cost tracking with full breakdown (`session-cost`)
- [x] Model pricing database (Claude, Gemini, GPT)
- [x] Session branching (`session-branch`) — fork + model/effort change in one step
- [x] Hook system (`session-hooks`) — webhook callbacks for tool errors, context high, stop, turn complete
- [x] Model alias resolution (built-in: opus/sonnet/haiku/gemini-flash/gemini-pro)
- [x] Custom model overrides (`--model-overrides`)
- [x] Agent config files (`--config agent.json`)
- [x] Cached token tracking with separate pricing
- [x] Tool error tracking (`toolErrors` in stats)
- [x] onContextHigh auto-fire at 70% usage
- [x] onStopFailure hook for API errors

### 🔜 Future
- [ ] MCP elicitation support (needs human-in-the-loop, not useful for headless agents yet)
- [ ] Worktree support (session-fork sufficient for now)

### 🚫 Not Planned
- Voice mode (human-only, not useful for agents)
- Remote Control / browser bridging (agent doesn't need UI)
- `/loop` / cron (use OpenClaw's native cron instead)
- VS Code extension features (agent runs headless)
- Color/theme customization (CLI output only)

## Best Practices

1. **Use `--effort` wisely** — `low` for simple tasks, `high`/`max` for complex ones
2. **Compact regularly** — run `session-compact` when context gets large
3. **Set budget limits** — `--max-budget` prevents runaway costs
4. **Use plan mode** for critical changes — `--plan` shows what Claude will do first
5. **Stream everything** — `--stream` gives real-time feedback
6. **NDJSON for automation** — `--ndjson` when parsing output programmatically
7. **Fork before experiments** — `session-fork` preserves the original session

## License

MIT
