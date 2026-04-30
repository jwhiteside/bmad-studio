/**
 * v6.5 Hook templates barrel.
 * Importing this module triggers each template's `registerTemplate(...)` call
 * so the HOOK_TEMPLATES singleton is populated. Always import this once at
 * server boot before any code consults the registry.
 */
import './raw-shell.js'
import './slack-post.js'
import './git-tag.js'
import './run-tests.js'
import './llm-agent-ingest.js'
