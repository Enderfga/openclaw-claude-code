---
name: claude-code-skill
description: Control Claude Code via MCP protocol. Trigger with "plan" to write a precise execution plan then feed it to Claude Code. Also supports direct commands, persistent sessions, agent teams, and advanced tool control.
homepage: https://github.com/enderfga/openclaw-claude-code
metadata: {
  "clawdis": {
    "emoji": "🤖",
    "requires": {
      "bins": ["node"],
      "env": []
    },
    "install": [
      {
        "id": "local",
        "kind": "local",
        "path": "~/clawd/claude-code-skill",
        "label": "Use local installation"
      }
    ]
  }
}
---

# Claude Code Skill

Control Claude Code via MCP (Model Context Protocol). This skill unleashes the full power of Claude Code for openclaw agents, including persistent sessions, agent teams, and advanced tool control.


---

## ⚡ Quick Start

```bash
# Start a persistent Claude session for your project
claude-code-skill session-start myproject -d ~/project \
  --permission-mode acceptEdits \
  --allowed-tools "Bash,Read,Edit,Write,Glob,Grep"

# Send a plan (Claude will execute precisely)
claude-code-skill session-send myproject --stream 'Refactor the auth module to use JWT'

# Send with high effort for complex reasoning
claude-code-skill session-send myproject --stream --effort high 'Refactor the auth module'

# Enter plan mode — Claude creates a plan first, then executes
claude-code-skill session-send myproject --stream --plan 'Implement rate limiting'

# Check progress
claude-code-skill session-status myproject

# Compact session when context gets large
claude-code-skill session-compact myproject

# Start with auto permission mode
claude-code-skill session-start myproject -d ~/project \
  --permission-mode auto \
  --allowed-tools "Bash,Read,Edit,Write,Glob,Grep"
```

## 🎯 When to Use This Skill

### Use Persistent Sessions When:
- ✅ Multi-step tasks requiring multiple tool calls
- ✅ Iterative development (write code → test → fix → repeat)
- ✅ Long conversations needing full context
- ✅ Agent needs to work autonomously
- ✅ You want streaming real-time feedback

### Use Direct MCP Tools When:
- ✅ Single command execution
- ✅ Quick file read/write
- ✅ One-off searches
- ✅ No context needed between operations

## 📚 Command Reference

### Persistent Sessions

#### Starting Sessions

```bash
# Basic start
claude-code-skill session-start myproject -d ~/project

# With custom API endpoint (for Gemini/GPT proxy)
claude-code-skill session-start gemini-task -d ~/project \
  --base-url http://127.0.0.1:8082 \
  --model gemini-2.0-flash

# With permission mode (plan = preview changes before applying)
claude-code-skill session-start review -d ~/project --permission-mode plan

# With tool whitelist (auto-approve these tools)
claude-code-skill session-start safe -d ~/project \
  --allowed-tools "Bash(git:*),Read,Glob,Grep"

# With budget limit
claude-code-skill session-start limited -d ~/project --max-budget 1.50

# Full configuration
claude-code-skill session-start advanced -d ~/project \
  --permission-mode acceptEdits \
  --allowed-tools "Bash,Read,Edit,Write" \
  --disallowed-tools "Task" \
  --max-budget 5.00 \
  --model claude-opus-4-6 \
  --append-system-prompt "Always write tests" \
  --add-dir "/tmp,/var/log"

# Auto mode — safer than bypassPermissions, fewer prompts than acceptEdits
claude-code-skill session-start autonomous -d ~/project \
  --permission-mode auto \
  --allowed-tools "Bash,Read,Edit,Write,Glob,Grep" \
  --max-budget 3.00

# Named session for easy identification
claude-code-skill session-start review -d ~/project \
  -n "Auth Refactor Review" \
  --permission-mode plan
```

**Permission Modes:**
| Mode | Description |
|------|-------------|
| `acceptEdits` | Auto-accept file edits (default) |
| `auto` | Classifier-based safety checks, auto-approve safe actions |
| `plan` | Preview changes before applying |
| `default` | Ask for each operation |
| `bypassPermissions` | Skip all prompts (dangerous!) |
| `delegate` | Delegate decisions to parent |
| `dontAsk` | Never ask, reject by default |

#### Sending Messages

```bash
# Basic send (blocks until complete)
claude-code-skill session-send myproject "Write unit tests for auth.ts"

# Streaming (see progress in real-time)
claude-code-skill session-send myproject "Refactor this module" --stream

# With custom timeout
claude-code-skill session-send myproject "Run all tests" -t 300000

# With effort control
claude-code-skill session-send myproject "Quick lint fix" --effort low
claude-code-skill session-send myproject "Design new auth system" --effort high

# Plan mode — Claude creates a plan, then executes
claude-code-skill session-send myproject --plan "Add rate limiting to all API endpoints"

# Continue working on a task
claude-code-skill session-send myproject "Continue the migration"
```

#### Managing Sessions

```bash
# List active sessions
claude-code-skill session-list

# Get detailed status
claude-code-skill session-status myproject

# Stop
claude-code-skill session-stop myproject
```

#### Effort & Model Control

```bash
# Start session with effort preset
claude-code-skill session-start myproject -d ~/project --effort high

# Use effort control per-message via session-send
claude-code-skill session-send myproject "Analyze this code" --effort high

# Model aliases (built-in: opus, sonnet, haiku, gemini-flash, gemini-pro)
claude-code-skill session-start myproject -d ~/project --model opus
```

#### Context Management

```bash
# Compact session to reclaim context window
claude-code-skill session-compact myproject

# Compact with custom summary
claude-code-skill session-compact myproject --summary "Finished auth refactor, now on tests"

# Check context usage via session status
claude-code-skill session-status myproject
```

### Agents, Skills & Rules Management

```bash
# List agents
claude-code-skill agents-list -d ~/project

# Create an agent
claude-code-skill agents-create my-reviewer -d ~/project \
  --description "Code reviewer" \
  --prompt "You are a thorough code reviewer."

# List skills
claude-code-skill skills-list -d ~/project

# Create a skill
claude-code-skill skills-create my-skill -d ~/project \
  --description "Custom skill" \
  --prompt "You handle X" \
  --trigger "when X"

# List rules
claude-code-skill rules-list -d ~/project

# Create a rule
claude-code-skill rules-create my-rule -d ~/project \
  --description "Enforce Y" \
  --content "Always do Y" \
  --paths "src/**/*.ts"
```

## 🤝 Agent Team Features

Deploy multiple Claude agents working together on complex tasks.

### Basic Agent Team

```bash
# Define a team of agents
claude-code-skill session-start team-project -d ~/project \
  --agents '{
    "architect": {
      "description": "Designs system architecture",
      "prompt": "You are a senior software architect. Design scalable, maintainable systems."
    },
    "developer": {
      "description": "Implements features",
      "prompt": "You are a full-stack developer. Write clean, tested code."
    },
    "reviewer": {
      "description": "Reviews code quality",
      "prompt": "You are a code reviewer. Check for bugs, style issues, and improvements."
    }
  }' \
  --agent architect

# Switch between agents mid-conversation
claude-code-skill session-send team-project "Design the authentication system"
# (architect responds)

claude-code-skill session-send team-project "@developer implement the design"
# (developer agent takes over)

claude-code-skill session-send team-project "@reviewer review the implementation"
# (reviewer agent takes over)
```

### Pre-configured Team Templates

```bash
# Code review team
claude-code-skill session-start review -d ~/project \
  --agents '{
    "security": {"prompt": "Focus on security vulnerabilities"},
    "performance": {"prompt": "Focus on performance issues"},
    "quality": {"prompt": "Focus on code quality and maintainability"}
  }' \
  --agent security

# Full-stack team
claude-code-skill session-start fullstack -d ~/project \
  --agents '{
    "frontend": {"prompt": "React/TypeScript frontend specialist"},
    "backend": {"prompt": "Node.js/Express backend specialist"},
    "database": {"prompt": "PostgreSQL/Redis database specialist"}
  }' \
  --agent frontend
```

## 🔧 Advanced Features

### Tool Control

```bash
# Allow specific tools with patterns
claude-code-skill session-start task -d ~/project \
  --allowed-tools "Bash(git:*,npm:*),Read,Edit"

# Deny dangerous operations
claude-code-skill session-start task -d ~/project \
  --disallowed-tools "Bash(rm:*,sudo:*),Write(/etc/*)"
```

### System Prompts

```bash
# Replace system prompt completely
claude-code-skill session-start task -d ~/project \
  --system-prompt "You are a Python expert. Always use type hints."

# Append to existing prompt
claude-code-skill session-start task -d ~/project \
  --append-system-prompt "Always run tests after changes."
```

### Multi-Model Support (Proxy)

Use `--base-url` to route requests through the built-in proxy, enabling other models (Gemini, GPT) to power Claude Code sessions:

```bash
# Use Gemini via built-in proxy
claude-code-skill session-start gemini-task -d ~/project \
  --engine gemini --model gemini-pro

# Use Codex
claude-code-skill session-start codex-task -d ~/project \
  --engine codex --model o4-mini

# Or route through a custom API endpoint
claude-code-skill session-start custom -d ~/project \
  --base-url http://127.0.0.1:8082 \
  --model gemini-2.5-flash
```

## 🎓 Best Practices

### For OpenClaw Agents

1. **Always use persistent sessions for multi-step tasks**
   ```bash
   # ❌ Bad: Multiple disconnect/reconnect cycles
   claude-code-skill bash "step1"
   claude-code-skill bash "step2"

   # ✅ Good: Single persistent session
   claude-code-skill session-start task -d ~/project
   claude-code-skill session-send task "Do step1 then step2"
   ```

2. **Use `--stream` for long-running tasks**
   ```bash
   claude-code-skill session-send task "Run full test suite" --stream
   ```

3. **Set budget limits for safety**
   ```bash
   --max-budget 2.00  # Stop after $2 of API usage
   ```

4. **Use plan mode for critical changes**
   ```bash
   --permission-mode plan  # Preview before applying
   ```

### Error Recovery

```bash
# If session fails:
claude-code-skill session-status myproject  # Check what happened
claude-code-skill session-grep myproject "error" # Search for errors in session history

# If you need to start over:
claude-code-skill session-stop myproject
claude-code-skill session-start myproject -d ~/project --resume-session-id <old-session-id>
```

## 🏗️ Architecture

```
openclaw agent / CLI
    ↓ Plugin tools (27) or HTTP API
SessionManager (in-process)
    ↓ child_process.spawn
Claude Code CLI / Codex CLI / Gemini CLI
    ↓
Your files & tools
```

## 📊 Examples

### Example 1: Code Review

```bash
claude-code-skill session-start review -d ~/myapp \
  --permission-mode plan \
  --agents '{"security":{"prompt":"Focus on security"},"quality":{"prompt":"Focus on quality"}}' \
  --agent security

claude-code-skill session-send review \
  "Review all TypeScript files in src/, check for security issues and code quality problems" \
  --stream
```

### Example 2: Automated Testing

```bash
claude-code-skill session-start test -d ~/myapp \
  --allowed-tools "Bash(npm:*,git:*),Read,Write" \
  --max-budget 1.00

claude-code-skill session-send test \
  "Find all untested functions, write unit tests, run tests, fix failures"
```

### Example 3: Multi-Agent Debugging

```bash
claude-code-skill session-start debug -d ~/myapp \
  --agents '{
    "detective": {"prompt": "Find the root cause of bugs"},
    "fixer": {"prompt": "Implement fixes"},
    "tester": {"prompt": "Verify fixes work"}
  }' \
  --agent detective

claude-code-skill session-send debug "We have a memory leak in the API server" --stream
# Detective investigates, then hands off to fixer, then to tester
```

## 🔗 Integration with OpenClaw

When installed as an OpenClaw plugin, all 27 tools are available directly to agents. For standalone usage:

```bash
# Start standalone server (no OpenClaw needed)
claude-code-skill serve

# Then use the CLI commands against the server
claude-code-skill session-start task -d ~/project
claude-code-skill session-send task "Implement feature X" --stream
claude-code-skill session-status task
```

## 📖 See Also

- [Tools Reference](../docs/tools.md) — complete 27-tool API reference
- [Council](../docs/council.md) — multi-agent collaboration protocol
- [Multi-Engine](../docs/multi-engine.md) — Claude Code, Codex, and Gemini engines
- [Getting Started](../docs/getting-started.md) — setup and installation
