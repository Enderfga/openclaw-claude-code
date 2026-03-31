# Sessions

Sessions are the core abstraction — persistent, multi-turn coding conversations backed by a CLI subprocess.

## Lifecycle

```
start() → send() → send() → ... → stop()
           ↑                          |
           └── resume (7-day TTL) ────┘
```

### Starting a Session

```typescript
const info = await manager.startSession({
  name: 'my-task',
  cwd: '/path/to/project',
  model: 'opus',                    // alias or full name
  permissionMode: 'acceptEdits',
  effort: 'high',
  allowedTools: ['Bash', 'Read', 'Edit', 'Write'],
  maxTurns: 50,
  maxBudgetUsd: 5.0,
});
```

Key options:

| Option | Description |
|--------|-------------|
| `engine` | `'claude'` (default) or `'codex'` — see [Multi-Engine](./multi-engine.md) |
| `model` | Model alias (`opus`, `sonnet`, `haiku`, `gemini-pro`) or full name |
| `permissionMode` | `acceptEdits`, `bypassPermissions`, `plan`, `auto`, `default` |
| `effort` | `low`, `medium`, `high`, `max`, `auto` |
| `bare` | Skip hooks, LSP, auto-memory, CLAUDE.md |
| `worktree` | Run in isolated git worktree |
| `appendSystemPrompt` | Append custom instructions to the system prompt |

### Sending Messages

```typescript
const result = await manager.sendMessage('my-task', 'Fix the auth bug', {
  effort: 'high',       // override effort for this message
  plan: true,           // enter plan mode
  timeout: 600_000,     // 10 min timeout
  onChunk: (text) => process.stdout.write(text),  // streaming
});

console.log(result.output);
```

### Session Persistence

Sessions automatically persist to `~/.openclaw/claude-sessions.json`:

- **Memory TTL**: configurable (default 120 min) — idle sessions unloaded
- **Disk TTL**: 7 days — sessions can be resumed after gateway restart
- **Auto-resume**: `startSession` with the same name auto-resumes if a persisted session exists

### Session Resume & Fork

```typescript
// Resume a specific Claude Code session
await manager.startSession({
  name: 'continued',
  resumeSessionId: 'abc123-session-id',
});

// Fork for experiments (preserves history, new branch)
await manager.startSession({
  name: 'experiment',
  resumeSessionId: 'abc123',
  forkSession: true,
});
```

## Runtime Operations

### Model Switching

Switch models mid-conversation. The session restarts with `--resume` to preserve history:

```typescript
await manager.switchModel('my-task', 'haiku');  // fast model for simple tasks
await manager.switchModel('my-task', 'opus');   // back to powerful model
```

### Tool Management

Add/remove tool permissions at runtime:

```typescript
await manager.updateTools('my-task', {
  allowedTools: ['Bash', 'Read'],
  merge: true,                    // add to existing list
});

await manager.updateTools('my-task', {
  removeTools: ['Bash'],          // revoke Bash access
});
```

### Context Management

```typescript
// Compact to reclaim context window
await manager.compactSession('my-task', 'We fixed the auth bug, now working on tests');

// Check context usage
const status = manager.getStatus('my-task');
console.log(`Context: ${status.stats.contextPercent}%`);
```

### Cost Tracking

```typescript
const cost = manager.getCost('my-task');
console.log(`Model: ${cost.model}`);
console.log(`Input: $${cost.breakdown.inputCost.toFixed(4)}`);
console.log(`Output: $${cost.breakdown.outputCost.toFixed(4)}`);
console.log(`Total: $${cost.totalUsd.toFixed(4)}`);
```

## Multi-Model Proxy

Built-in format translation lets Claude Code CLI talk to non-Anthropic models:

- **Anthropic ↔ OpenAI** bidirectional message/tool conversion
- **Streaming SSE** format conversion
- **Gemini** schema cleaning (removes unsupported JSON Schema keys)
- **Gemini** thought signature caching (round-trip thinking)
- Auto-detect provider from model name patterns

See `src/proxy/` for implementation details.
