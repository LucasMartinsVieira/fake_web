# AGENTS.md

## Project Context
- Project name: `Fake Web`
- Goal: build a high-fidelity, web-based mockup generator for social platform screenshots.
- Product shape: a modular suite with multiple platform workspaces inside one app.
- Phase 1 scope: implement only the Discord workspace.
- Future scope: support additional modules such as X/Twitter and Instagram without coupling them to Discord-specific logic.

## Product Requirements
- Use React with Vite in a client-side-only architecture.
- Use Tailwind CSS for styling.
- Use `lucide-react` for icons.
- Use React Context or Redux for state management.
- Do not use a database.
- Persist state through LocalStorage auto-save and JSON import/export.

## Core UX
- Provide a module switcher with:
  - active Discord module
  - placeholder entries for X and Instagram
- Provide an editor/preview layout:
  - editor controls for accounts, messages, settings
  - live preview for the rendered mockup
- Provide global tools:
  - Page-style zoom control that behaves like browser zoom and scales the full mockup proportionally, including text, spacing, avatars, and media

## Discord Module Requirements
- Match Discord Web dark mode as closely as practical.
- Preserve Discord-like spacing, layout, and typography (`gg sans` if available).
- Support grouped messages so consecutive messages from the same user hide repeated avatar/name and use the tighter vertical spacing seen in Discord Web.
- Support an account registry with:
  - username
  - avatar stored locally as Base64 for in-app editing/preview
  - role color
- Support message types:
  - standard user message
  - system message
- Support timestamps:
  - auto-generated with randomized 1 to 5 minute increments
  - manual override per message
- Support content features:
  - markdown emphasis such as bold and italics
  - image and GIF attachments rendered with Discord-like rounded corners

## Persistence Rules
- Convert every uploaded image to Base64 via `FileReader`.
- Keep the full editable application state serializable to JSON.
- Export JSON must contain:
  - accounts
  - messages
  - module settings
  - no avatar Base64 payloads; avatars are re-added manually after import
- Import must restore the prior session structure and content, except avatars which are intentionally omitted from portable JSON.
- LocalStorage should auto-save frequently enough to prevent data loss without harming editing performance.

## Architecture Guardrails
- Keep Discord-specific code under `/modules/discord`.
- Treat zoom as true proportional canvas scaling of the rendered mockup, not as a layout-only resize that leaves text or message internals visually unchanged.
- Define a shared app shell that can host multiple modules without redesigning the state model later.
- Separate domain models from presentational components where possible.
- Prefer deterministic state updates and pure serialization logic to simplify import/export.

## Git Conventions
- Write commit messages using Conventional Commits format, for example `fix(discord): keep add-account actions inside the editor card`.

## Recommended Initial Structure
```text
src/
  app/
  components/
  modules/
    discord/
      components/
      state/
      utils/
      types/
  state/
  utils/
```

## Action Plan
1. Bootstrap the app shell with React, Vite, Tailwind, and `lucide-react`, then create the shared split-pane layout and module switcher.
2. Define the core data model for modules, accounts, messages, attachments, timestamps, and global UI state before building screens.
3. Implement shared state management and persistence primitives:
   - global store/context
   - LocalStorage auto-save and hydration
   - JSON export/import pipeline
4. Build global tools first:
   - page-style zoom that scales the entire preview like a browser viewport
   - reusable file-to-Base64 utility
5. Build the Discord domain layer under `/modules/discord`:
   - account registry state/actions
   - message list state/actions
   - timestamp generation and manual override logic
   - serialization adapters if needed
6. Build the Discord editor UI:
   - account management panel
   - message composer/editor
   - module settings controls
7. Build the Discord preview renderer with emphasis on fidelity:
   - dark theme layout
   - grouped messages
   - system messages
   - markdown emphasis
   - image/GIF attachment rendering
8. Wire editor actions to live preview updates and verify the zoom and preview layout remain faithful during editing.
9. Add import/export validation and resilience for malformed or partial JSON payloads.
10. Finalize with visual polish, responsive behavior, and manual QA against Discord Web references.

## Implementation Priorities
- Prioritize correct data modeling before UI depth.
- Prioritize import/export correctness because it defines the persistence contract.
- Treat visual fidelity as an explicit acceptance criterion, not a later enhancement.
- Treat Discord message rhythm, especially grouped-message spacing, as part of fidelity rather than a minor polish issue.
- Keep placeholders for future modules lightweight; do not build their business logic in Phase 1.

## Risks To Watch
- Discord fidelity can drift if layout tokens are improvised instead of standardized.
- Zoom behavior will feel wrong if only the container changes size instead of the full rendered interface scaling together.
- Unstructured state will make JSON portability and future modules harder.
- Base64-heavy payloads can make LocalStorage and exports large; keep portable JSON intentionally lightweight and omit avatar image payloads.

## Working Assumptions
- The first deliverable is a local-first frontend app, not a hosted service.
- Exact Discord asset parity is not required, but the result should be convincingly close.
- If `gg sans` cannot be bundled directly, use the closest legal fallback while keeping typography isolated for later replacement.
