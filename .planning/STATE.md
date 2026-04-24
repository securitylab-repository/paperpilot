---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: ready
last_updated: "2026-04-22T19:23:20.401Z"
---

# Pipeline State

## Current phase

```
phase: init
status: ready
```

## Progress

| Phase | Status | Artifacts |
|-------|--------|-----------|
| INIT | ✅ done | config.json, PROJECT.md |
| COLLECT | ⬜ pending | corpus/CORPUS_MAP.md, corpus/SEARCH_QUERIES.md |
| ANALYSE | ⬜ pending | plans/\<slug\>/evidence-matrix.* |
| OUTLINE | ⬜ pending | outline/OUTLINE.md, plans/\<slug\>/outline.* |
| STATE_OF_ART | ⬜ pending | state_of_art/SOA.md, state_of_art/SOA.bib |
| WRITE | ⬜ pending | drafts/section_*.md, output/paper.md |
| REVIEW | ⬜ pending | reviews/REVIEW_v1.md |

## Recommended next action

1. Fill in `.planning/config.json` with the project context
2. Drop the PDFs into `corpus/`
3. Launch the **Collector** agent or use `@workspace #file:.github/prompts/rpw-collect.prompt.md`
