# Claude Code CLI Feature Tracking

This document tracks which Claude Code CLI version the openclaw-claude-code plugin is currently synced to, and which features have been integrated.

## Currently tracked: **Claude Code CLI 2.1.111** (as of 2026-04-16, plugin v2.13.0)

## Sync history

| Plugin Version | Claude CLI Version | Date | Notable integrations |
|---|---|---|---|
| v2.13.0 | 2.1.111 | 2026-04-16 | Hook events, permission delegation, prompt cache optimization (exclude-dynamic-sections + 1H cache), debug control, `--from-pr`, MCP channels, `system/api_retry` event tracking |
| v2.12.2 and earlier | 2.1.91 | — | Bare mode, worktree, json-schema, mcp-config, betas, fallback-model, effort, agent teams |

## How to update this

When syncing to a new Claude Code CLI version:

1. Run `claude --version` to confirm target version
2. Check Claude Code changelog / release notes for new flags, events, env vars since the last tracked version
3. Decide which features are valuable for programmatic/agent use (vs human-interactive only) — see the Tier 1/2/3 framework in `docs/superpowers/specs/`
4. Implement worthwhile features (add to `SessionConfig` → wire into `persistent-session.ts` → expose in tool schema → document)
5. Update this file with the new version + notable integrations
6. Update `CLAUDE.md` and `README.md` engine compatibility tables
