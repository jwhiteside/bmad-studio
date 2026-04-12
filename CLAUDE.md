# BMAD Studio — Claude Code Instructions

## Project Context

Read `_bmad-output/project-context.md` for full project rules, conventions, and planning artifact locations. That file is the BMAD-native source of truth for all agents working on this project.

## Key Rules (from project-context.md)

- **Documentation discipline is mandatory** — PRD, architecture docs, and epic docs must be updated after every epic. An epic with outdated docs is not done.
- **Planning artifacts live in `_bmad-output/planning-artifacts/`** — never in `docs/`
- **Epic numbering is unified and sequential** — currently at 28, continue from 29+
- **Branch-per-feature with PRs** — no direct commits to main

## Tech Stack Quick Reference

- Monorepo: `packages/client`, `packages/server`, `packages/shared`
- Backend: Fastify 5 + TypeScript
- Frontend: React 18 + Vite + Tailwind + shadcn/ui
- No database — file system only
