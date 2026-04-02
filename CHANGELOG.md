# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2026-04-03

### Added
- Council post-processing lifecycle: `council_review`, `council_accept`, `council_reject` tools — completes the council workflow with structured review, cleanup, and rejection-with-feedback
- `CouncilReviewResult`, `CouncilAcceptResult`, `CouncilRejectResult` types for structured post-processing responses
- Council `accepted` and `rejected` status states

### Changed
- Translated `configs/council-system-prompt.md` from Chinese to English for project-wide consistency
- Translated all Chinese strings in `council.ts` agent prompts and CLAUDE.md worktree templates to English
- `openclaw.plugin.json` contracts.tools updated from 24 → 27

## [2.4.0] - 2026-04-01

### Added
- Gemini CLI engine (`engine: 'gemini'`) — third engine alongside Claude Code and Codex. Per-message spawning with `--output-format stream-json` for real token usage tracking. Permission mapping: `bypassPermissions` → `--yolo`, `default` → `--sandbox` (#29)
- 88 new unit tests: SessionManager (74 tests, #28) and Gemini session (14 tests, #29). Total: 162 tests
- CLAUDE.md project context file for contributors
- README architecture diagram (mermaid), test badge, "Why not Claude API" callout

### Fixed
- Test files no longer compiled to `dist/` or shipped in npm package (tsconfig exclude)
- `openclaw.plugin.json` contracts.tools updated from 10 → 24 to match actual registered tools
- `SessionManagerLike` interface in council.ts uses real types instead of `Record<string, unknown>`
- CI switched from `npm install` to `npm ci` with committed lockfile for reproducible builds
- docs/cli.md: added SDK-only tools reference table (14 tools without CLI wrappers)

## [2.3.1] - 2026-04-01

### Fixed
- Plugin installation blocked on OpenClaw 2026.3.31 — resolved security scanner false positive for "credential harvesting" in CLI by deferring env var access (#24)
- Added `openclaw.hooks` declaration to prevent hook pack validation error
- Added `capabilities.childProcess` and `capabilities.networkAccess` to plugin manifest for scanner whitelisting

## [2.3.0] - 2026-03-31

### Added
- Session Inbox — cross-session messaging with `claude_session_send_to`, `claude_session_inbox`, `claude_session_deliver_inbox`. Idle sessions receive immediately; busy sessions queue for later delivery. Broadcast via `"*"` (#22)
- Ultraplan — dedicated Opus planning session (up to 30 min) with `ultraplan_start`, `ultraplan_status` (#22)
- Ultrareview — fleet of 5-20 specialized reviewer agents in parallel via council system with `ultrareview_start`, `ultrareview_status`. 20 review angles: security, logic, performance, types, concurrency, etc. (#22)
- Tool count: 17 → 24

### Fixed
- Session creation race condition — concurrent `startSession()` calls no longer create duplicates (#23)
- File persistence error handling — proper error callbacks, orphan `.tmp` cleanup on rename failure (#23)
- HTTP stream reader leak — `try/finally { reader.cancel() }` on all streaming paths (#23)
- CORS restricted to localhost origins only (#23)
- Agent name validation prevents git branch injection (#23)
- CWD path normalization via `path.resolve()` (#23)
- Session resume logic uses `??` instead of `||` for explicit null handling (#23)
- Stderr API key sanitization masks `sk-ant-*`, `*_API_KEY=*`, `Bearer *` patterns (#23)
- Council git errors now logged instead of silently swallowed (#23)
- SKILL.md cleaned up: removed 8 references to unimplemented CLI commands (#23)
- README tool count and CLI version accuracy (#23)

## [2.2.0] - 2026-03-31

### Added
- Stream output support — `onChunk` callback and `stream` param for `claude_session_send` (#9)
- Session persistence — registry saved to `~/.openclaw/claude-sessions.json` with 7-day disk TTL, atomic writes, debounced saves (#11)
- Dynamic tool/model switching — `claude_session_update_tools` and `claude_session_switch_model` with rollback on failure (#12)
- Session health overview — `claude_sessions_overview` tool for plugin-wide stats (#10)
- Premature CLI exit detection — startup crash no longer leaves sessions stuck in busy state (#13)

### Fixed
- Stale close listener on fallback ready path (follow-up to #13)
- Truncated code comments in startup flow

### Improved
- Project governance: CONTRIBUTING.md, CHANGELOG.md, issue/PR templates, CI workflows, npm publish automation

## [2.1.0] - 2026-03-31

### Added
- Cross-platform PATH inheritance from `process.env.PATH`
- `CLAUDE_BIN` env var override for custom binary locations
- `resumeSessionId` exposed in tool schema
- Lazy initialization — zero memory when unused

### Fixed
- `contextPercent` calculation (was hardcoded 0)
- Process blocking on detached child (`proc.unref()`)
- Ready event now listens for CLI init signal instead of blind 2s timeout

## [2.0.0] - 2026-03-31

### Added
- Complete rewrite as native OpenClaw plugin
- 10 native tools (`claude_session_start/send/stop/list/status/grep/compact`, `claude_agents_list`, `claude_team_list/send`)
- Plugin hooks: `before_prompt_build`, `registerHttpRoute`
- Embedded HTTP server for backward-compatible CLI access

### Breaking Changes
- Requires OpenClaw >= 2026.3.0 with plugin SDK
- Standalone Express backend deprecated
- FastAPI proxy now optional

## [1.2.0] - 2026-03-27

### Added
- Cost tracking per session
- Git branch awareness
- Hook system for pre/post execution
- Model aliases support

## [1.1.0] - 2026-03-25

### Added
- Effort levels (low/medium/high/max)
- Plan mode (`--plan` flag)
- Compact command for context reclamation
- Context percentage tracking
- Model switching within sessions

## [1.0.0] - 2026-03-23

### Added
- Initial release
- Persistent Claude Code sessions via MCP
- Multi-model proxy support
- Agent teams support
- SKILL.md for ClawHub discovery
