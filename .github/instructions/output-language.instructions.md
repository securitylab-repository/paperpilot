---
applyTo: '**/*.md,**/*.json,**/*.bib'
description: 'Langue des livrables du pipeline PapperPilot — toujours anglais.'
---

# Langue des livrables — anglais obligatoire

**Tous les fichiers produits par les agents du pipeline doivent être rédigés en anglais**, sans exception et sans dépendre d'un paramètre de configuration.

## Portée

Cette règle s'applique à tous les livrables générés par les agents :

- `.planning/corpus/CORPUS_MAP.md`
- `.planning/corpus/SEARCH_QUERIES.md`
- `.planning/analysis/ANALYSIS_MATRIX.md`
- `.planning/analysis/THEMES.md`
- `.planning/outline/OUTLINE.md`
- `.plans/<slug>/evidence-matrix.md` (prose, pas les valeurs JSON qui restent factuelles)
- `.plans/<slug>/outline.md`
- `.planning/state_of_art/SOA.md`
- `.planning/drafts/section_*.md`
- `.planning/reviews/REVIEW_v*.md`
- `output/paper.md`
- Tout nouveau fichier BibTeX généré par les agents (les champs `abstract`/`note` en anglais quand ils sont générés ou reformulés)

## Exceptions

- **Contenu source préservé** : si une source du corpus (`corpus/pdfs/*.md`, `corpus/bib/*.bib`) est en français ou dans une autre langue, le champ `abstract` original reste tel quel dans l'index. Seules les synthèses, reformulations et annotations produites par les agents sont en anglais.
- **Citations littérales** : un extrait cité entre guillemets conserve la langue de la source (conventions académiques), suivi d'une traduction ou paraphrase anglaise si nécessaire pour la lisibilité.
- **Messages CLI développeur** (logs de `gsdlite.js`, sorties de `node papperpilot.js *`) : hors scope — ce ne sont pas des livrables.

## Ignorer `config.json.project.language`

Le champ `project.language` dans `.planning/config.json` **n'affecte pas** la langue des livrables. Il reste présent pour compatibilité et pour d'éventuels usages d'interface, mais les agents doivent l'ignorer pour la langue de rédaction.

## Style

- Anglais académique standard (US ou UK cohérent sur tout le document — par défaut, US).
- Ton : descriptif, précis, impersonnel — voir `academic-style.instructions.md`.
- Titres de sections, légendes de tableaux, en-têtes Markdown : également en anglais.
