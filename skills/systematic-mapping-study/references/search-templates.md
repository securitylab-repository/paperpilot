# Search String Examples and PICO Templates

## PICO Worksheet Template

Fill in this template before writing any search strings.

```
Topic: [Your topic]

P — Population (who/what is being studied):
  Main term: 
  Synonyms: 

I — Intervention (method, tool, technique, technology):
  Main term: 
  Synonyms: 

C — Comparison (usually omit for mapping studies):
  N/A or: 

O — Outcome (usually omit for mapping studies):
  N/A or: 

Combined keywords for Set 1 (Population):
Combined keywords for Set 2 (Intervention):
```

---

## Example: Search Strings from Petersen et al. (2015)

**Topic:** Systematic mapping studies in software engineering

| Database | Search String |
|---|---|
| IEEE Xplore | `(("Systematic mapping" OR "systematic map" OR "systematic mapping study" OR "systematic mapping studies" OR "systematic maps") AND (("Methods" OR "framework" OR "model" OR "practice") OR ("tools" OR "tool" OR "techniques") OR ("categorization" OR "classification" OR "grouping") OR ("guidelines" OR "rules")) AND "software engineering")` |
| ACM DL | `(("Systematic mapping" OR "systematic map" OR "systematic mapping study" OR "systematic mapping studies") AND software engineering)` |
| Scopus | `("Systematic mapping" OR "systematic map" OR "systematic mapping study" OR "systematic mapping studies" OR "systematic maps") AND ("software engineering") OR (model OR method OR approach OR tools OR technique OR framework OR practice OR classification OR categorization OR process OR guidelines OR rules OR strategy)` |
| Inspec/Compendex | `(((Systematic mapping OR systematic map OR systematic mapping study OR systematic mapping studies OR systematic maps) WN All fields) AND (((Methods OR framework OR model OR practice) OR (tools OR tool OR techniques) OR (categorization OR classification OR grouping) OR (guidelines OR rules)) WN All fields)) AND ((software engineering) WN All fields)` |

---

## Database Search Syntax Notes

| Database | Boolean | Phrase search | Field restriction |
|---|---|---|---|
| IEEE Xplore | AND, OR, NOT | `"phrase"` | All Metadata (default) |
| ACM DL | AND, OR, NOT | `"phrase"` | All fields |
| Scopus | AND, OR, AND NOT | `"phrase"` | TITLE-ABS-KEY or ALL |
| Inspec/Compendex | AND, OR, NOT, WN | `phrase` | `WN All fields` |

---

## Data Extraction Form Template

```
Study ID: ___
Title: ___
Authors: ___
Year: ___
Venue name: ___
Venue type: [ ] Journal  [ ] Conference  [ ] Workshop  [ ] Other: ___

Topic area (SWEBOK category or custom): ___

Research type (select one):
  [ ] Evaluation research (industrial empirical study)
  [ ] Validation research (lab/academic empirical study)
  [ ] Solution proposal (new solution, no evaluation)
  [ ] Philosophical paper (conceptual framework)
  [ ] Opinion paper (personal view)
  [ ] Experience report (practitioner experience)

Research method (select all that apply):
  [ ] Survey  [ ] Case study  [ ] Controlled experiment
  [ ] Action research  [ ] Ethnography  [ ] Simulation
  [ ] Prototyping  [ ] Mathematical analysis  [ ] Other: ___

[Topic-specific fields — add based on your RQs]
Field 1: ___
Field 2: ___
Field 3: ___

Notes / comments: ___
```

---

## Research Type Decision Table

Use this table to classify research type unambiguously.

| Condition | Eval. Research | Valid. Research | Solution Proposal | Philosophical | Opinion | Experience |
|---|---|---|---|---|---|---|
| Used in real practice | ✅ | | | | | |
| Novel solution proposed | | ✅ | ✅ | | | |
| Empirical evaluation present | ✅ | ✅ | | | | |
| Conceptual framework only | | | | ✅ | | |
| Opinion about something | | | | | ✅ | |
| Authors' own experience | | | | | | ✅ |

**Key rule:** Validation ≠ Evaluation. Validation = lab/academic (not real practice). Evaluation = real-world industrial context.

---

## Recommended Databases

From Dyba et al. — use at minimum:
1. **IEEE Xplore** — https://ieeexplore.ieee.org
2. **ACM Digital Library** — https://dl.acm.org
3. **Scopus** — https://www.scopus.com
4. **Inspec / Compendex (Engineering Village)** — https://www.engineeringvillage.com

Optional additions:
- **Web of Science**
- **SpringerLink**
- **Google Scholar** (useful for snowballing, not primary search due to noise)

---

## Reference Management Tools

- **Zotero** (free, open source) — zotero.org
- **EndNote** — clarivate.com/endnote
- **Mendeley** — mendeley.com

Use these to: deduplicate results across databases, manage full-text PDFs, and export citation lists.

---

## Snowballing Checklist (Wohlin 2014)

Before starting snowball sampling, verify your seed set:

- [ ] Covers papers from different research clusters (communities unlikely to cite each other)
- [ ] Includes different authors (not all from same group)
- [ ] Spans different years of publication
- [ ] Covers different publishers
- [ ] Keywords from RQ used to find initial seeds
- [ ] Seed set not too small (aim for 10+ papers for most topics)

**Backward snowballing:** Check the reference lists of seed papers for additional relevant studies.  
**Forward snowballing:** Search for papers that cite the seed papers (use Google Scholar, Scopus, or Web of Science for forward citations).