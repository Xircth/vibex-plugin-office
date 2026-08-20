---
name: office-docx
description: Create and modify DOCX files with VibeX's locked OfficeCLI Runtime. Use when the user wants a Word document created, rewritten, or patched in the workspace.
---

# Office DOCX

Create or modify `.docx` files in the current workspace. Use this Skill when the user asks for a Word document, a written report, a letter, or an in-place edit of an existing DOCX.

## Runtime

Use the exact content-addressed `officecli` Runtime that VibeX locked for this plugin. Never install, upgrade, or resolve another copy from the user's shell PATH. If the locked binary is missing, stop and report that the Office Runtime is not ready. Do not silently fall back.

## When to use

- New document: create a workspace-relative `.docx` and fill it.
- Existing document: open the named file, change only what the user asked, keep the rest.
- Prefer this Skill over inventing Markdown-to-DOCX conversion pipelines.

## Procedure

1. Resolve the target path relative to the workspace. Do not write onto the user's Desktop or an absolute path outside the workspace unless the user named that location as the workspace root.
2. Inspect the current document structure before editing. Preserve styles, headings, lists, tables, and sections the user did not mention.
3. Apply the requested changes with `officecli`. Keep language, tone, and formatting consistent with the existing file when patching.
4. Validate the file opens as DOCX. If validation fails, fix it before claiming completion.
5. Return the workspace-relative path. Mention what changed and what was left untouched.

## Do not

- Do not paste a binary or a base64 dump into the conversation.
- Do not convert the document to PDF, Markdown, or HTML unless the user asked for an export.
- Do not recreate the whole document when a section edit is enough.
- Do not report success with a path that does not exist.
