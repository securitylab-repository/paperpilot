---
name: systematic-mapping-study
description: Guides the user through planning, conducting, and reporting a systematic mapping study (scoping study) in software engineering, following the updated Petersen et al. (2015) guidelines. Use when the user asks to "conduct a systematic mapping study", "do a systematic map", "run a scoping study", "do a PICO study", "map the literature on [topic]", "identify research gaps in [area]", or "structure a research area using systematic methods". Also triggers when the user mentions systematic literature mapping, evidence-based software engineering overviews, or wants to classify and count research contributions in a topic area. Covers the full process: need identification, PICO-based search string formulation, database search, snowballing, inclusion/exclusion criteria, data extraction, classification schemes (research type, research method, venue), visualization, validity threats, and reporting structure.
---

# Systematic Mapping Study Guide

A systematic mapping study (also called a scoping study) structures a research area by classifying and counting contributions. Unlike a systematic literature review (SLR), the goal is **overview and trend identification**, not evidence synthesis.

> Based on: Petersen, Vakkalanka & Kuzniarz (2015). *Guidelines for conducting systematic mapping studies in software engineering: An update.* Information and Software Technology, 64, 1–18.

---

## Key Distinction: Mapping Study vs. Systematic Review

| Dimension | Systematic Mapping Study | Systematic Literature Review |
|---|---|---|
| Goal | Structure a research area | Synthesize and aggregate evidence |
| Research questions | Broad (what do we know about X?) | Specific (does intervention Y work?) |
| Search stringency | Less stringent; good sample | Exhaustive; find all studies |
| Quality assessment | Optional | Essential |
| Output | Classification + trend overview | Evidence synthesis with strength ratings |

---

## Process Overview

The mapping process has three phases: **(1) Planning → (2) Conducting → (3) Reporting**

---

## Phase 1: Planning

### Step 1.1 — Need Identification and Scoping

Define why the mapping study is needed. Typical goals (Arksey & O'Malley):
- Examine the extent, range, and nature of research activity
- Determine whether a full systematic review is warranted
- Summarize and disseminate research findings
- Identify research gaps

**Formulate Research Questions.** Mapping RQs are broad. Standard set to include:
- *What research exists on [topic]?* (coverage)
- *Where and when has it been published?* (venues, trends)
- *What research methods and types are used?* (maturity)
- *What research gaps exist?* (future directions)

Break high-level questions into sub-questions to drive data extraction. Example:
- High-level: "What do we know about software product management?"
- Sub-questions: What topics are addressed? What evidence exists? What gaps remain?

---

### Step 1.2 — Study Identification (Search)

#### Choose a Search Strategy
Select one or more of:
1. **Database search** (most common) — IEEE Xplore, ACM DL, Scopus, Inspec/Compendex
2. **Manual search** — hand-search key journals and conference proceedings
3. **Snowball sampling** — forward/backward citation chasing from a seed set

> Combining strategies improves coverage. Database search alone is the minimum; adding snowballing significantly reduces missed studies.

**Recommended databases** (Dyba et al.): IEEE Xplore + ACM + two indexing databases (Scopus and/or Inspec/Compendex).

#### Develop the Search String using PICO

Use **PICO** to identify keywords — focus on **P** (Population) and **I** (Intervention) for mapping studies. C and O often over-restrict.

| PICO Element | Definition for SE Mapping | Use? |
|---|---|---|
| **P** — Population | SE role, application area, or topic domain | ✅ Yes |
| **I** — Intervention | Method, tool, technique, or technology studied | ✅ Yes |
| **C** — Comparison | Alternative approaches | ⚠️ Often omits relevant studies |
| **O** — Outcome | Measurable result | ⚠️ Often omits relevant studies |

**Search string construction:**
1. Extract keywords from each RQ
2. Identify synonyms for each keyword
3. Group keywords into sets (one per PICO dimension used)
4. Combine sets with AND; synonyms within sets with OR
5. Consult experts or librarians to validate
6. Derive additional keywords from 3–5 known relevant papers
7. Use standards/thesauri (SWEBOK, IEEE, ACM) to find additional terms

**Precision vs. noise:** If results are very large and noisy, tighten the population term. Log all search strings used per database (they differ by syntax).

#### Evaluate the Search
Before running inclusion/exclusion, validate the search:
- **Test set of known papers**: Ask a domain expert for ~10 papers that must be found. Verify all are retrieved.
- **Expert review**: Have an expert assess the result set for obvious gaps.
- **Stoppage criterion** (Petticrew & Roberts): Stop additional searches when a complementary strategy (e.g., snowballing) adds fewer than N new papers.

#### Snowball Sampling (if used)
Start set requirements (Wohlin 2014):
- Include papers from different research clusters (communities unlikely to cite each other)
- Cover different authors, years, and publishers
- Minimum size depends on area breadth — err larger
- Keywords from RQ should inform the initial seed

---

### Step 1.3 — Inclusion and Exclusion Criteria

Define objective criteria before running selection. Criteria categories:
- **Topic relevance** — is the paper on the target subject?
- **Venue type** — peer-reviewed only? Journals + conferences?
- **Time period** — publication year range
- **Language** — typically English only
- **Evaluation requirement** — ⚠️ Do NOT exclude solution proposals; mapping studies need them to spot trends

**Example inclusion criteria:**
- English-language peer-reviewed articles (journals, conferences, workshops)
- Published in the defined time frame
- Addresses the target topic

**Example exclusion criteria:**
- Editorials, summaries, guidelines/templates for conducting reviews
- Non-peer-reviewed material
- Not accessible in full text
- Duplicates

**Process for reliable inclusion/exclusion** (Ali & Petersen):

```
1. Specify criteria in review protocol
2. Review criteria with all team members
3. Think-aloud pilot: one reviewer applies criteria aloud to 1 paper
4. Pilot on a subset → calculate inter-rater agreement
5. Update criteria if needed
6. Perform full selection (title + abstract first, then full text)
7. Apply decision rules for borderline cases
8. Calculate final inter-rater agreement
```

**Decision rules for two reviewers (R1, R2):**

| | R2: Include | R2: Uncertain | R2: Exclude |
|---|---|---|---|
| **R1: Include** | A — Include | B — Include | D — Discuss |
| **R1: Uncertain** | B — Include | C — Discuss | E — Exclude |
| **R1: Exclude** | D — Discuss | E — Exclude | F — Exclude |

Most inclusive strategy (A+B+C+D+E): finds ~100% of relevant studies, 25% overhead. Practical strategy (A+B+C+D): finds ~94%, less overhead.

**Quality assessment** (optional for mapping): Use minimal checks — is the mapping process documented? Are results presented? Exclude only if minimum information is missing.

---

### Step 1.4 — Data Extraction

Design a **data extraction form** before extracting. Standard fields:

| Field | Description |
|---|---|
| Study ID | Unique integer identifier |
| Title | Full paper title |
| Authors | Author names |
| Year | Publication year |
| Venue | Journal/conference name |
| Venue type | Journal / Conference / Workshop |
| Topic area | Based on SWEBOK or emerging scheme |
| Research type | See classification below |
| Research method | See classification below |
| [Topic-specific fields] | Defined by your RQs |

**Reliability:** Have one author extract; a second author review and check against source. Calculate agreement where possible.

---

### Step 1.5 — Classification Schemes

#### Topic-Independent Classification (use consistently across studies)

**Research Type** (Wieringa et al. decision table):

| Research Type | Criteria |
|---|---|
| Evaluation research | Novel or existing solution used **in practice**; empirically evaluated in real-world industrial context |
| Validation research | Solution evaluated **in the lab** (not yet in practice); controlled experiments, academic case studies, prototypes |
| Solution proposal | New solution proposed; no empirical evaluation yet |
| Philosophical paper | New conceptual framework; no empirical evaluation |
| Opinion paper | Personal view or argument; no empirical basis |
| Experience report | Authors' practical experience; no formal empirical evaluation |

> Key disambiguation: Validation = lab/academic context. Evaluation = real-world industrial context. A novel solution with no evaluation = solution proposal regardless of how it is framed.

**Research Method** (Easterbrook; Wohlin et al.):
- Survey, Case study, Controlled experiment, Action research, Ethnography, Simulation, Prototyping, Mathematical analysis

Map methods to types:
- *Evaluation research*: industrial case study, practitioner survey, action research
- *Validation research*: laboratory experiment, academic case study (e.g., with students), prototyping, mathematical proof

**Venue Type** (Finnish Ministry of Education classification):
- Peer-reviewed: Journal article, Conference proceedings, Book chapter
- Non-refereed: Trade journal, Professional proceedings
- Thesis: B.Sc., M.Sc., Doctoral dissertation

#### Topic-Specific Classification

Two approaches:
1. **Emerging classification** (most common): keywording from abstracts → open coding → group into themes → build scheme
2. **Existing scheme**: use SWEBOK, IEEE/ISO standards, or prior mapping studies

**Keywording process** (Petersen et al.):
1. Read each paper's abstract
2. Identify keywords and concepts
3. Group related concepts → assign theme labels
4. Merge or rename overlapping codes
5. Finalize scheme → classify all papers
6. If abstracts are insufficient, use introduction + conclusion

Consult domain experts to validate the scheme before full classification.

---

### Step 1.6 — Visualization

Match visualization to what you want to show:

| Goal | Recommended Visualization |
|---|---|
| Count per single category | Bar plot, Pie chart |
| Two-dimensional distribution (e.g., topic × research type) | Bubble plot, Heatmap |
| Trends over time | Line diagram, Bar plot by year |
| Overlap between categories | Venn diagram |

Bubble plots and heatmaps are especially effective for showing relative publication density across two classification dimensions simultaneously.

---

### Step 1.7 — Validity Threats

Always discuss the following threat types (Petersen & Gencel):

| Threat Type | Examples in Mapping Studies |
|---|---|
| **Descriptive validity** | Poorly designed extraction forms; inaccurate recording |
| **Theoretical validity** | Missed studies (sampling bias); researcher bias in selection/extraction; classification of mapping studies as reviews |
| **Generalizability** | Internal: results may not apply to all sub-areas. External: findings don't transfer to SLRs |
| **Interpretive validity** | Researcher bias in drawing conclusions from data |
| **Repeatability** | Insufficient documentation of the process |

Mitigation strategies:
- Complement database search with snowballing
- Use a reference set to evaluate search completeness
- Have a second reviewer check all exclusions and extractions
- Reflect on the sample against known sub-areas of the field

---

## Phase 2: Conducting

- Implement the protocol defined in Phase 1
- Record information at every stage (use spreadsheets + reference management tools like Zotero/EndNote)
- The process is **iterative** — revise criteria and schemes as needed, and document all revisions
- Track: search results per database, articles excluded at each stage (with reasons), inter-rater agreement scores

---

## Phase 3: Reporting

Use this standard structure:

1. **Introduction** — background, motivation, usefulness of the map
2. **Related work** — existing secondary/tertiary studies in the area
3. **Research method** — present in subsections:
   - Research questions
   - Search (strategy, string, databases)
   - Study selection (inclusion/exclusion criteria + process)
   - Data extraction (+ quality assessment if conducted)
   - Analysis and classification
   - Validity evaluation
4. **Results** — structured by research question
5. **Discussion / Conclusions**
6. **Appendix** — full list of included papers; excluded borderline papers with reasons

---

## Quality Evaluation Rubric

Use this rubric to self-assess or assess another mapping study:

### Need for review (max 2)
- 0 — No motivation or goal stated
- 1 — Motivations and RQs provided
- 2 — Motivations and RQs defined with target audience input

### Search strategy (max 2)
- 0 — Only one search type used
- 1 — Two search types used
- 2 — All three (database + manual + snowballing) used

### Search evaluation (max 3)
- 0 — No reliability actions reported
- 1 — At least one action for search OR inclusion/exclusion reliability
- 2 — At least one action for each (search AND inclusion/exclusion)
- 3 — All identified actions applied

### Extraction and classification (max 3)
- 0 — No reliability actions; no standard classification used
- 1 — At least one extraction reliability action
- 2 — Extraction reliability action + research type and method classified
- 3 — All identified actions applied

### Validity discussion (max 1)
- 0 — No threats or limitations described
- 1 — Threats and limitations described

**Quality ratio** = (score achieved) / (max score = 11). Median in literature ≈ 33%.

---

## Quick Reference Checklist

### Before Starting
- [ ] 2–3 concrete research questions defined
- [ ] Goal of mapping clearly stated (gap identification? trend analysis? pre-SLR scoping?)
- [ ] Search strategy selected (database / manual / snowball)
- [ ] Databases selected

### Search
- [ ] PICO applied to P and I dimensions
- [ ] Synonyms identified for all key terms
- [ ] Search strings written per database
- [ ] Keywords validated against 3–5 known papers
- [ ] Test set of known papers created for search validation

### Selection
- [ ] Inclusion criteria defined
- [ ] Exclusion criteria defined
- [ ] Pilot run with inter-rater agreement calculated
- [ ] Decision rules defined for uncertain cases

### Extraction & Classification
- [ ] Data extraction form designed
- [ ] Research type scheme applied (Wieringa)
- [ ] Research method classified
- [ ] Venue type classified
- [ ] Topic-specific scheme created or selected

### Reporting
- [ ] Validity threats discussed (all 5 types)
- [ ] Visualizations chosen for each classification dimension
- [ ] Included and excluded borderline papers listed in appendix
- [ ] Quality rubric self-assessment completed