---
applyTo: "**/*.{md,json}"
description: Opérationnalisation du skill `systematic-mapping-study` (Petersen et al. 2015) pour le pipeline PapperPilot. Active uniquement quand `config.json.project.methodology == "sms"`.
---

# SMS — Operationalization for PapperPilot

> **Active condition** : `.planning/config.json` field `project.methodology` is `"sms"`. If the value is different (`slr`, `mlr`, `narrative`, etc.) **ignore this entire instruction file** and follow `literature-review-methodology.instructions.md` only.

> **Doctrine source** : `skills/systematic-mapping-study/SKILL.md` (Petersen, Vakkalanka & Kuzniarz, 2015 — *Guidelines for conducting systematic mapping studies in software engineering: An update*, IST 64). Cette instruction n'invente rien — elle mappe le skill sur les agents existants.

---

## Agent-by-agent mapping

The skill defines three phases — **Planning / Conducting / Reporting**. PapperPilot maps them onto its 6 agents as follows:

| Skill phase / step | PapperPilot agent | Output artefact |
|---|---|---|
| 1.1 Need ID + RQs | Collector (Phase 3 Elicit) | `CORPUS_MAP.md` (intro + RQs) |
| 1.2 Search (PICO) | Collector (Phase 2) | `SEARCH_QUERIES.md` |
| 1.2 Snowballing seeds | Collector (Phase 2bis) | `SEARCH_QUERIES.md` |
| 1.3 Inclusion/exclusion | Collector (Phase 1 invalidation) | `CORPUS_MAP.md` (Sources invalides) |
| 1.4 Data extraction | Analyze (Phase 2) | `evidence-matrix.json` |
| 1.5 Classification schemes (Wieringa) | Analyze (Phase 3) | `classification.json` |
| 1.6 Visualization | Outline | `outline.json.synthesis.visualization` |
| 1.7 Validity threats | Reviewer | `REVIEW_v1.md` §Validity |
| 3. Reporting structure | Writer | `paper.md` |
| Quality rubric (max 11) | Reviewer | `REVIEW_v1.md` §Quality rubric |

---

## Collector — SMS-specific obligations

### Search string construction (Step 1.2)

Apply **PICO restricted to P (Population) and I (Intervention)** — C and O over-restrict for mapping studies. Process:

1. Extract P/I keywords from each RQ logged in `CORPUS_MAP.md`.
2. Identify synonyms per keyword (consult SWEBOK / IEEE / ACM thesauri where available).
3. Group keywords into sets (one per dimension used).
4. Combine sets with `AND`; synonyms with `OR`.
5. Derive additional keywords from 3–5 known relevant papers (the test set, see below).

### Search log

In `SEARCH_QUERIES.md`, add a `## Search strings per database` section listing **the exact string used per source**, because API syntax differs:

```markdown
## Search strings per database

| Database | Search string | Date | Results | Notes |
|---|---|---|---|---|
| Semantic Scholar | "<term1>" AND ("<syn1>" OR "<syn2>") | 2024-XX-XX | N | — |
| ArXiv | all:term1 AND (all:syn1 OR all:syn2) | 2024-XX-XX | N | — |
| CrossRef | query=term1+syn1 | 2024-XX-XX | N | — |
```

### Test set of known papers (Step 1.2 — Evaluate the Search)

Before declaring Phase 2 done, the Collector MUST:

1. Ask the user (Phase 3 Elicit, single question) to list **3 to 10 papers that MUST be retrieved** if the search is correct. Provide the format `key — title — DOI/arXiv`.
2. Cross-check the test set against the retrieved corpus (`corpus/_merged.bib` post-collect). Log the result in `SEARCH_QUERIES.md`:

```markdown
## Test set validation

| Expected paper | Found in corpus? | Notes |
|---|---|---|
| vaswani2017attention | ✅ | Retrieved via Semantic Scholar |
| smith2020example | ❌ | Add to manual collection |
```

3. If **any** test-set paper is missing → expand the search string or add a snowball seed. Iterate until ≥ 80% of the test set is retrieved (or document why a paper is genuinely outside scope).

### Snowball seeds (Step 1.2 — Snowball Sampling)

If using snowball sampling in Phase 2bis, seed set must satisfy Wohlin (2014) criteria — explicitly log in `SEARCH_QUERIES.md`:

- ≥ 1 paper from **each research cluster** identified in `CORPUS_MAP.md`
- Different authors, years, publishers
- Minimum seed size : 5 (broader topics : 10+)

### Inclusion / exclusion criteria

For mapping studies, **do NOT exclude solution proposals** (the skill warns explicitly: they signal trends). Default exclusion criteria : editorials, summaries, non-peer-reviewed material, full text inaccessible, duplicates. Log these in `CORPUS_MAP.md` § "Sources invalides" with the reason category.

---

## Analyze — SMS-specific classification bootstrap

In **Phase 3 (Classification taxonomique transverse)**, when `methodology=sms`, the candidate criteria list MUST start with the three Wieringa-derived facets (Step 1.5 of the skill) **before** any topic-specific criteria the agent deduces:

```json
{
  "criteria": [
    {
      "id": "research_type",
      "label": "Research type (Wieringa)",
      "rationale": "Maturity facet — Evaluation/Validation/Solution proposal/Philosophical/Opinion/Experience",
      "values": ["evaluation_research","validation_research","solution_proposal","philosophical_paper","opinion_paper","experience_report"]
    },
    {
      "id": "research_method",
      "label": "Research method",
      "rationale": "How the work was conducted — survey, case study, experiment, etc.",
      "values": ["survey","case_study","controlled_experiment","action_research","ethnography","simulation","prototyping","mathematical_analysis","other"]
    },
    {
      "id": "venue_type",
      "label": "Venue type",
      "rationale": "Peer-review status and venue category (Finnish Ministry classification)",
      "values": ["journal","conference","workshop","book_chapter","thesis","trade_journal","other"]
    }
  ]
}
```

Then append 1 to 3 **topic-specific** criteria deduced from the corpus (cf. règle "au moins 2 valeurs distinctes"). Total still capped at 6.

The Elicit Phase 3 question presented to the user lists the 3 Wieringa facets as **pre-filled defaults** + the topic-specific candidates; user can remove or refine. If the user removes a Wieringa facet, log the decision in `classification.json` field `validatedBy: "user-override"` with a rationale.

### Wieringa disambiguation reminder

When extracting the `research_type` value per paper, apply the skill's disambiguation:

- **Evaluation** = real-world industrial context (deployed, used by practitioners)
- **Validation** = lab/academic context (controlled experiment, student case study, prototype)
- **Solution proposal** = novel solution, no empirical evaluation yet (regardless of framing)

---

## Outline — Visualization specification

When `methodology=sms`, extend `outline.json` with a `visualization` block inside `synthesis`:

```json
{
  "synthesis": {
    "consensus": ["..."],
    "contradictions": ["..."],
    "gaps": ["..."],
    "visualization": [
      {
        "kind": "bubble_plot",
        "x": "research_type",
        "y": "topic_area",
        "rationale": "Show research-type maturity per topic to spot gaps"
      },
      {
        "kind": "bar_plot",
        "axis": "year",
        "rationale": "Publication trend over time"
      }
    ]
  }
}
```

Visualization choice table from the skill:

| Goal | `kind` value |
|---|---|
| Count per single category | `bar_plot` or `pie_chart` |
| Two-dimensional distribution | `bubble_plot` or `heatmap` |
| Trends over time | `line_diagram` or `bar_plot` |
| Overlap between categories | `venn` |

At minimum produce **1 bubble plot or heatmap crossing two classification dimensions** + **1 trend over time** (the two charts most commonly required by SMS reviewers).

---

## Reviewer — Quality rubric and validity threats

When `methodology=sms`, append two sections to `REVIEW_v1.md`:

### Quality rubric (max 11) — self-assessment

| Dimension | Max | Score | Evidence |
|---|---|---|---|
| Need for review | 2 | X | RQs + motivation documented in `CORPUS_MAP.md`? Audience consulted? |
| Search strategy | 2 | X | Number of search types used (database / manual / snowball) |
| Search evaluation | 3 | X | Test set validation + inclusion/exclusion pilot + inter-rater agreement |
| Extraction & classification | 3 | X | Wieringa + research method + venue type applied? Second-reviewer check? |
| Validity discussion | 1 | X | All 5 threat types discussed in REVIEW |
| **Total** | **11** | **X** | **Quality ratio = X/11** |

Literature median ≈ 33%. Flag verdict as **MAJOR REVISION** if score < 4 (≈ 36%) ; **PRÊT À SOUMETTRE** requires ≥ 8.

### Validity threats — 5 types

For each, list mitigations applied and residual risk:

- **Descriptive validity** — extraction form design, recording accuracy
- **Theoretical validity** — sampling bias, missed studies, researcher bias in selection
- **Generalizability** — internal (sub-areas) + external (transfer to SLR)
- **Interpretive validity** — bias in drawing conclusions
- **Repeatability** — process documentation quality

If any threat is undocumented in the drafts, mark it as a **bloquant (❌)** finding.

---

## Run-time guards

- An agent reading this instruction MUST first check `.planning/config.json` field `project.methodology`. If absent or ≠ `"sms"`, **stop applying this file** and proceed with the default `literature-review-methodology.instructions.md` flow.
- Never rename existing artefacts (`evidence-matrix.json`, `outline.json`, `REVIEW_v1.md`). SMS-specific content is **added** to existing fields, not split into new files.
- The full conceptual reference (Petersen tables, snowball criteria details, decision matrix for two reviewers) is in `skills/systematic-mapping-study/SKILL.md` — agents can read it directly if a corner case is not covered here.
