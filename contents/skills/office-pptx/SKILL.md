---
name: office-pptx
description: Create and modify PPTX files with VibeX's locked OfficeCLI Runtime. Use when the user wants a slide deck created or updated in the workspace.
---

# Office PPTX

Create or modify `.pptx` files in the current workspace. Use this Skill when the user asks for a presentation, slides, a pitch deck, or an in-place edit of an existing PPTX.

## Runtime

Use the exact content-addressed `officecli` Runtime that VibeX locked for this plugin. Never install or resolve another copy from the user's shell PATH. If the locked binary is missing, stop and report that the Office Runtime is not ready.

## When to use

- New deck: create a workspace-relative `.pptx` with a clear slide sequence.
- Existing deck: change only the slides or elements the user named.
- Prefer this Skill over generating images of slides or dumping outline Markdown as a substitute for a real PPTX.

## Procedure

1. Resolve the target path relative to the workspace.
2. Inspect slide count, titles, and layout before editing. Leave unnamed slides, speaker notes, and master layouts alone.
3. Keep one idea per slide unless the user asked for a dense appendix. Titles should say the point, not the category.
4. Apply changes with `officecli`. Reuse existing theme colors and fonts when patching a deck.
5. Validate the file opens as PPTX, then return the workspace-relative path. State which slides changed.

## Do not

- Do not rebuild the whole deck to change one slide.
- Do not drop speaker notes or speaker-only content unless asked.
- Do not export to PDF or images unless the user asked for that deliverable.
- Do not report a missing path as complete.
