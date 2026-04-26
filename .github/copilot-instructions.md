# Instructions globales Copilot — PapperPilot

PapperPilot est un copilote de rédaction scientifique.
Le binaire recommandé est `papperpilot.js` (compatibilité `gsdlite.js` conservée).

## Objectif produit

Transformer un corpus de sources en livrables de rédaction scientifique traçables :

```
[COLLECT] → [ANALYSE] → [OUTLINE] → [STATE_OF_ART] → [WRITER] → [REVIEWER]
```

1. `collect` → ingestion du corpus, questions Elicit, gaps bibliographiques
2. `analyze` → matrice de preuves (evidence-matrix)
3. `outline` → plan narratif structuré
4. `stateofart` → synthèse argumentative de la littérature
5. `write` → rédaction section par section
6. `review` → contrôle qualité et annotations

## Architecture de travail (agent-driven)

- `papperpilot.js` est l'orchestrateur des commandes CLI.
- Les agents `.github/agents/` fournissent la couche IA via prompts spécialisés.
- Les prompts `.github/prompts/` permettent de lancer chaque phase depuis Copilot Chat.
- Les instructions `.github/instructions/` s'appliquent automatiquement selon le contexte.
- L'état du pipeline est dans `.planning/` (ne jamais modifier manuellement).

## Agents actifs

| Agent | Fichier | Rôle |
|-------|---------|------|
| **Collector** | `collector.agent.md` | Ingestion corpus, questions Elicit, recherche de références |
| **Analyze** | `analyze.agent.md` | Extraction structurée JSON (evidence-matrix) |
| **Outline** | `outline.agent.md` | Clustering claims en plan narratif JSON |
| **StateOfArt** | `stateofart.agent.md` | Synthèse narrative argumentée |
| **Writer** | `writer.agent.md` | Rédaction section par section |
| **Reviewer** | `reviewer.agent.md` | Contrôle qualité et annotations |

## Mode d'exécution par phase

| Phase | Comment lancer la phase |
|-------|--------------------------|
| COLLECT | `node papperpilot.js collect` puis `@Collector` |
| ANALYZE | `node papperpilot.js analyze <slug>` puis `@Analyze` |
| OUTLINE | `node papperpilot.js outline <slug>` puis `@Outline` |
| **STATE_OF_ART** | `@StateOfArt` directement |
| **WRITE** | `@Writer` directement (déclenche `export` en fin de rédaction) |
| **REVIEW** | `@Reviewer` directement |
| **EXPORT** | `node papperpilot.js export [--class IEEEtran]` (auto à la fin de Write) |

⚠️ **Commandes inexistantes — ne jamais tenter** :
- `node papperpilot.js stateofart`
- `node papperpilot.js write`
- `node papperpilot.js review`

Ces phases passent directement par l'agent Copilot correspondant.

## Prompt files disponibles

| Prompt | Usage |
|--------|-------|
| `rpw-init.prompt.md` | Initialiser un projet |
| `rpw-collect.prompt.md` | Lancer la collecte |
| `rpw-analyse.prompt.md` | Lancer l'analyse |
| `rpw-outline.prompt.md` | Générer le plan |
| `rpw-soa.prompt.md` | Lancer l'état de l'art |
| `rpw-write.prompt.md` | Rédiger les sections |
| `rpw-review.prompt.md` | Lancer la révision |
| `rpw-status.prompt.md` | Afficher l'état du pipeline |
| `rpw-reset.prompt.md` | Remettre le projet à l'état post-install |

## Sources bibliographiques (`corpus/`)

- `corpus/pdfs/` : PDF + markdown converti
- `corpus/bib/` : exports BibTeX
- `corpus/notes/` : notes personnelles **non-citables**
- `corpus/_index.json` : index consolidé
- `corpus/_merged.bib` : bibliographie unifiée

Règle critique : les notes peuvent guider la compréhension, mais ne doivent jamais être citées comme références finales.

## Artefacts attendus

### Pipeline CLI (`.plans/<slug>/`)
- `evidence-matrix.md` / `evidence-matrix.json`
- `outline.md` / `outline.json`

### Pipeline agents (`.planning/`)
- `corpus/CORPUS_MAP.md` + `SEARCH_QUERIES.md`
- `analysis/ANALYSIS_MATRIX.md` + `THEMES.md`
- `outline/OUTLINE.md`
- `state_of_art/SOA.md` + `SOA.bib`
- `drafts/section_XX_nom.md`
- `reviews/REVIEW_vN.md`

### Livrables finaux (`output/`)
- `output/paper.md` — document Markdown assemblé par Writer
- `output/bibliography.bib` — refs effectivement citées (filtré depuis `corpus/_merged.bib`)
- `output/paper.pdf` — PDF compilé via pandoc + pdflatex (style IEEE par défaut)

Détails et dépendances : `.github/instructions/pdf-export.instructions.md`.

## Précheck

Le hook session démarre `node gsdlite.js precheck --hook` via `.github/hooks/precheck.json`.
Cette commande reste valide via compatibilité runtime ; préférer `papperpilot.js` pour toute nouvelle documentation et commande utilisateur.

## Règles opérationnelles Copilot

- Minimiser le contexte lu : uniquement les fichiers utiles à la tâche.
- Préférer des changements ciblés et vérifiables.
- Conserver une traçabilité claire entre claims, sections et sources.
- Le modèle est sélectionné par l'utilisateur via le dropdown VS Code.
- **Langue des livrables = anglais uniquement** — tous les fichiers produits par les agents (CORPUS_MAP, SEARCH_QUERIES, ANALYSIS_MATRIX, THEMES, OUTLINE, SOA, drafts, REVIEW, paper.md) sont en anglais. Le champ `config.json.project.language` n'est pas consulté. Détails : `.github/instructions/output-language.instructions.md`.

## Anti-patterns interdits

- Citer des notes personnelles comme sources académiques.
- Ajouter des commandes non implémentées dans le CLI courant.
- Mélanger artefacts de rédaction et journaux techniques sans besoin explicite.
- Inventer des références ou des citations non vérifiées.
