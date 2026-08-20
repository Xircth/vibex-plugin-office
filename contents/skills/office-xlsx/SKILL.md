---
name: office-xlsx
description: Analyze and generate XLSX files with VibeX's locked OfficeCLI Runtime. Use when the user wants a spreadsheet created, queried, or patched in the workspace.
---

# Office XLSX

Analyze or generate `.xlsx` files in the current workspace. Use this Skill when the user asks for a workbook, a table of numbers, a spreadsheet analysis, or an in-place edit of an existing XLSX.

## Runtime

Use the exact content-addressed `officecli` Runtime that VibeX locked for this plugin. Never install or resolve another copy from the user's shell PATH. If the locked binary is missing, stop and report that the Office Runtime is not ready.

## When to use

- New workbook: create a workspace-relative `.xlsx` with named sheets and real formulas where they belong.
- Existing workbook: inspect structure first, then change only the sheets, columns, or cells the user named.
- Analysis: read values and formulas, then report findings. Do not smash a working sheet into a static paste unless asked.

## Procedure

1. Resolve the target path relative to the workspace.
2. Inspect sheet names, headers, used ranges, and formulas before editing.
3. Preserve unrelated sheets, columns, number formats, and formulas.
4. Prefer formulas over precomputed values when the user will keep using the file.
5. Validate the workbook opens as XLSX. Spot-check the changed range.
6. Return the workspace-relative path. For analysis, cite sheet names and ranges, not screenshots.

## Do not

- Do not flatten formulas into hardcoded numbers unless the user asked for a snapshot.
- Do not delete or rename sheets as a side effect of filling one table.
- Do not invent hidden sheets or macros.
- Do not report success against a path that does not exist.
