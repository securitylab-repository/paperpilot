# PapperPilot

Copilote multi-agents pour la rédaction scientifique dans VS Code. Produit des surveys, articles, thèses et rapports à partir d'un corpus de PDFs / BibTeX, avec bibliographie filtrée et export PDF IEEE en sortie.

Zéro dépendance npm. Runtime Node 18+ natif. Pas de clé API requise.

---

## Pipeline

```
[Collector] → [Analyze] → [Outline] → [StateOfArt] → [Writer] → [Reviewer]
                                                         |
                                                         └─→ output/paper.{md,pdf} + bibliography.bib
```

Chaque étape est un **agent VS Code Copilot** spécialisé. Les agents communiquent via des fichiers Markdown dans `.planning/`, pas entre eux directement — aucune session Copilot ne voit le contexte d'une autre.

---

## Prérequis

| Outil | Obligatoire | Installation macOS |
|-------|-------------|--------------------|
| **Node** ≥ 18 | Oui | `brew install node` |
| **VS Code** + extension Copilot | Oui | Extension officielle GitHub Copilot |
| **poppler** (`pdftotext`) | Pour les PDFs | `brew install poppler` |
| **pandoc** ≥ 2.14 | Pour l'export PDF | `brew install pandoc` |
| **pdflatex** (BasicTeX ou MacTeX) | Pour l'export PDF | `brew install --cask basictex` |
| **IEEEtran.cls** | Pour le rendu IEEE 2-colonnes | `sudo tlmgr install ieeetran collection-publishers` |

Linux / Windows : équivalents via `apt`, `scoop`, etc. (cf. section Troubleshooting).

---

## Installation

```bash
# 1. Cloner ou télécharger PapperPilot
git clone <url> papperpilot && cd papperpilot

# 2. Installer dans ton projet de rédaction cible
./install.sh /chemin/vers/mon-projet

# 3. Ouvrir le projet dans VS Code et recharger la fenêtre
#    (Cmd+Shift+P → "Developer: Reload Window")
```

Vérifie que Copilot Chat affiche les 6 agents dans le dropdown : **Collector, Analyze, Outline, StateOfArt, Writer, Reviewer**.

Si rien n'apparaît, vérifie `.vscode/settings.json` :

```json
{ "chat.agent.enabled": true }
```

---

## Quickstart — du corpus au PDF en 30 min

### 1. Initialiser le projet

Dans Copilot Chat :

```
/rpw-init
```

Réponds aux questions (titre, type de document, domaine, audience, style de citation). Le fichier `.planning/config.json` est créé.

Édite ensuite `.planning/config.json` pour renseigner les auteurs :

```json
{
  "project": {
    "authors": [
      { "name": "Alice Dupont",  "affiliation": "Université X", "email": "alice@ux.fr" },
      { "name": "Bob Martin",    "affiliation": "Laboratoire Y", "email": "bob@ly.fr" }
    ]
  }
}
```

### 2. Alimenter le corpus

Dépose tes sources dans les 3 sous-dossiers de `corpus/` :

- `corpus/pdfs/` — articles PDF téléchargés
- `corpus/bib/` — exports Zotero / Mendeley (`.bib`)
- `corpus/notes/` — fiches de lecture perso (Markdown, **non citables**)

Puis :

```bash
node papperpilot.js collect
```

`collect` convertit les PDFs (via `pdftotext`), parse les BibTeX, récupère les abstracts manquants (cascade CrossRef → arXiv → Semantic Scholar), et produit `corpus/_index.json` + `corpus/_merged.bib`.

### 3. Faire tourner le pipeline

Dans Copilot Chat, invoquer les agents un par un :

```
@Collector     → cartographie le corpus, comble les gaps bibliographiques via API
@Analyze       → extrait une matrice de preuves structurée par papier
@Outline       → clusterise les claims en plan narratif
@StateOfArt    → rédige la synthèse argumentative
@Writer        → rédige section par section + assemble output/paper.md + export PDF
@Reviewer      → audite le document et produit un rapport annoté
```

Chaque agent lit l'état précédent dans `.planning/` et écrit le sien. Pas besoin de lui passer un contexte — il découvre tout seul.

À la fin de **Writer**, le PDF est automatiquement généré dans `output/`.

### 4. Récupérer les livrables

```
output/
├── paper.md              ← document Markdown assemblé
├── bibliography.bib      ← refs effectivement citées (filtré de _merged.bib)
└── paper.pdf             ← PDF compilé, citations IEEE
```

---

## Pipeline détaillé

### Collector

**Rôle** : cartographier le corpus existant, rechercher les gaps via API, poser des questions Elicit-style pour cadrer le projet.

**Phases** :
1. Cartographie du corpus (lecture de `corpus/_index.json`)
2. Recherche API automatique (Semantic Scholar + arXiv + CrossRef) pour les gaps détectés
3. Récupération des PDFs open access (optionnel, avec confirmation utilisateur)
4. Questions Elicit pour raffiner

**Sorties** : `.planning/corpus/CORPUS_MAP.md`, `.planning/corpus/SEARCH_QUERIES.md`, `corpus/bib/auto-collected.bib`

### Analyze

**Rôle** : extraire une matrice de preuves structurée (objectifs, méthodes, résultats, conclusions, limites, biais) pour chaque papier.

**CLI préalable** : `node papperpilot.js analyze <slug>` (génère `.plans/<slug>/evidence-matrix.{md,json}` heuristique)
**Agent** : `@Analyze` enrichit avec une extraction LLM et écrit `.planning/analysis/ANALYSIS_MATRIX.md` + `THEMES.md`

### Outline

**Rôle** : clusteriser les claims en sections thématiques avec consensus / contradictions / gaps.

**CLI préalable** : `node papperpilot.js outline <slug>`
**Agent** : `@Outline` écrit `.plans/<slug>/outline.json` + `.planning/outline/OUTLINE.md`

### StateOfArt

**Rôle** : produire une narration argumentée de l'état de l'art, traçable jusqu'aux sources.

**Sorties** : `.planning/state_of_art/SOA.md` + `SOA.bib`

### Writer

**Rôle** : rédiger le document section par section selon l'outline validé, citer systématiquement, assembler `output/paper.md`, lancer l'export PDF.

**Contraintes de densité** : 3-5 paragraphes substantiels par section, 4-6 sources distinctes, 2 sources confrontées par claim central, max 1 `[TODO: source needed]` par section. Cibles de longueur par type de document :
- survey : 1500-3000 mots / section
- thesis : 2000-4000 mots / section
- paper : 800-1500 mots / section
- report : 500-1200 mots / section

**Sortie finale** : `output/paper.md` + `output/bibliography.bib` + `output/paper.pdf`

### Reviewer

**Rôle** : auditer le document rédigé (citations, cohérence, style, complétude, langue) et produire un rapport annoté.

**Sortie** : `.planning/reviews/REVIEW_v1.md`

---

## Structure du projet

```
mon-projet/
├── papperpilot.js                   Entrée CLI
├── gsdlite.js                       Runtime Node (~1300 lignes, zéro dépendance)
├── install.sh
│
├── .vscode/
│   └── settings.json                chat.agent.enabled: true
│
├── .github/
│   ├── copilot-instructions.md      Instructions globales always-on
│   ├── agents/                      Les 6 agents du pipeline
│   │   ├── collector.agent.md
│   │   ├── analyze.agent.md
│   │   ├── outline.agent.md
│   │   ├── stateofart.agent.md
│   │   ├── writer.agent.md
│   │   └── reviewer.agent.md
│   ├── prompts/                     Slash commands Copilot
│   │   ├── rpw-init.prompt.md
│   │   ├── rpw-collect.prompt.md
│   │   ├── rpw-analyse.prompt.md
│   │   ├── rpw-outline.prompt.md
│   │   ├── rpw-soa.prompt.md
│   │   ├── rpw-write.prompt.md
│   │   ├── rpw-review.prompt.md
│   │   └── rpw-status.prompt.md
│   ├── instructions/                Règles transverses attachées aux agents
│   │   ├── academic-style.instructions.md
│   │   ├── bibtex-format.instructions.md
│   │   ├── pdf-conversion.instructions.md
│   │   ├── literature-review-methodology.instructions.md
│   │   ├── output-language.instructions.md
│   │   └── pdf-export.instructions.md
│   └── hooks/
│       └── precheck.json            Hook SessionStart automatique
│
├── .planning/                       État du pipeline agents
│   ├── config.json                  Titre, type, auteurs, style de citation
│   ├── STATE.md
│   ├── PROJECT.md
│   ├── corpus/                      CORPUS_MAP.md, SEARCH_QUERIES.md
│   ├── analysis/                    ANALYSIS_MATRIX.md, THEMES.md
│   ├── outline/                     OUTLINE.md
│   ├── state_of_art/                SOA.md, SOA.bib
│   ├── drafts/                      section_XX_nom.md
│   └── reviews/                     REVIEW_vN.md
│
├── .plans/<slug>/                   Sortie CLI (analyze, outline)
│   ├── evidence-matrix.{md,json}
│   └── outline.{md,json}
│
├── corpus/                          Corpus bibliographique
│   ├── pdfs/                        PDFs + .md convertis
│   ├── bib/                         Exports BibTeX + auto-collected.bib
│   ├── notes/                       Fiches perso non-citables
│   ├── _index.json                  Index unifié (auto)
│   ├── _merged.bib                  Biblio consolidée (auto)
│   └── _abstracts-cache.json        Cache fetch abstracts (auto)
│
├── scripts/
│   └── ieee.csl                     Style citation IEEE (Citation Style Language)
│
└── output/                          Livrables finaux
    ├── paper.md
    ├── bibliography.bib
    └── paper.pdf
```

---

## Commandes CLI

Toutes les commandes ci-dessous s'exécutent à la racine de ton projet.

```bash
node papperpilot.js init                           # (re)crée les dossiers
node papperpilot.js collect [--no-fetch]           # ingère PDFs + BibTeX + notes, fetch abstracts
                     [--refresh-abstracts]
node papperpilot.js corpus [--json]                # état du corpus
node papperpilot.js coverage [--missing|--failed]  # diagnostic des abstracts
node papperpilot.js analyze <slug>                 # evidence-matrix heuristique
node papperpilot.js outline <slug>                 # plan narratif heuristique
node papperpilot.js bibliography                   # extrait les refs citées dans paper.md
node papperpilot.js export [--class article|IEEEtran]  # PDF final (bibliography + pandoc + pdflatex)
                    [--no-bib]
node papperpilot.js precheck [--hook]              # vérifie l'état du corpus
```

**À noter** : les phases StateOfArt, Writer, Reviewer n'ont pas de commande CLI — elles passent uniquement par les agents Copilot `@StateOfArt`, `@Writer`, `@Reviewer`.

---

## Agents VS Code — invocation

Dans Copilot Chat, trois manières d'invoquer un agent :

### 1. Mention directe

```
@Collector
```

L'agent démarre et suit son workflow. Il peut exécuter lui-même les commandes CLI nécessaires via son outil `runCommands` (ex. `node papperpilot.js collect`).

### 2. Slash command (prompt file)

```
/rpw-init
/rpw-collect
/rpw-analyse
/rpw-outline
/rpw-soa
/rpw-write
/rpw-review
/rpw-status
```

Pratique pour lancer une phase avec un prompt préformulé.

### 3. Mention avec contexte explicite

```
@Writer #file:.planning/outline/OUTLINE.md Rédige la section 3.
```

---

## Configuration — `.planning/config.json`

```json
{
  "project": {
    "title": "A Survey of Transformer-based Models in Healthcare",
    "type": "survey",
    "domain": "Machine Learning, Healthcare",
    "target_audience": "ML researchers, clinicians",
    "language": "en",
    "citation_style": "IEEE",
    "methodology": "slr",
    "authors": [
      { "name": "Alice Dupont", "affiliation": "Université X", "email": "alice@ux.fr" }
    ]
  },
  "workflow": {
    "auto_search_papers": true,
    "max_papers_to_find": 20,
    "interactive_questions": true,
    "parallel_soa_agents": 3
  }
}
```

| Champ | Valeurs | Usage |
|-------|---------|-------|
| `project.type` | `survey`, `paper`, `thesis`, `report`, `bibliography` | Détermine la cible de longueur par section (Writer) |
| `project.methodology` | `slr`, `sms`, `mlr`, `sok`, `rapid`, `narrative` | Méthodologie de revue de littérature (voir `literature-review-methodology.instructions.md`) |
| `project.language` | — | **Ignoré** : tous les livrables sont en anglais (voir `output-language.instructions.md`) |
| `project.citation_style` | `APA`, `IEEE`, `Vancouver`, `Chicago` | Style de citation dans le texte (géré par pandoc + CSL pour l'export) |
| `project.authors` | tableau `{name, affiliation, email}` | Bloc auteur dans le PDF final |

---

## Sources bibliographiques

### Trois voies d'entrée

| Voie | Dossier | Usage | Citable |
|------|---------|-------|---------|
| **PDF** | `corpus/pdfs/` | Articles complets | Oui (fulltext) |
| **BibTeX** | `corpus/bib/` | Exports Zotero / Mendeley | Oui (métadonnées + abstract fetch) |
| **Notes** | `corpus/notes/` | Fiches de lecture perso | **Non** — contexte uniquement |

### Ingestion `collect`

1. Convertit les `.pdf` en `.md` via `pdftotext` (cache par hash MD5)
2. Parse les `.bib` (parseur regex natif)
3. Scanne les notes `.md`, extrait les métadonnées du frontmatter YAML
4. Récupère les abstracts manquants (cascade CrossRef → arXiv → Semantic Scholar)
5. Produit `_index.json` (corpus consolidé) + `_merged.bib` (biblio unifiée)

### Cascade de récupération d'abstracts

| Priorité | API | Couverture | Contrainte |
|----------|-----|------------|------------|
| 1 | CrossRef | ~130M refs, DOI-centric | Abstracts parfois absents (éditeur-dépendant) |
| 2 | arXiv | ML / physique / maths | Nécessite un arXiv ID |
| 3 | Semantic Scholar | ~200M papers, multidisciplinaire | Rate-limit sans clé API |

Toutes gratuites, sans clé requise. Appels HTTPS natifs Node. Cache dans `corpus/_abstracts-cache.json`.

### Pourquoi les notes sont non-citables

Les notes contextualisent le projet (état de tes connaissances, synthèses perso). Les citer comme sources académiques poserait un problème d'intégrité — Writer ne peut pas produire `[@ma-note]`. Elles restent lues par StateOfArt et Writer pour inspiration.

---

## Export PDF — dépendances et styles

L'export final passe par **pandoc + pdflatex** avec le style IEEE par défaut.

```bash
node papperpilot.js export                      # article + citations IEEE (BasicTeX suffit)
node papperpilot.js export --class IEEEtran     # IEEE 2-colonnes officiel (nécessite tlmgr install ieeetran)
node papperpilot.js export --no-bib             # saute la regénération de bibliography.bib
```

Pour ajouter un autre style (ACM, APA, Vancouver), télécharger le CSL correspondant :

```bash
curl -o scripts/acm.csl https://raw.githubusercontent.com/citation-style-language/styles/master/acm-sig-proceedings.csl
```

Puis adapter `gsdlite.js` pour mapper `--style acm → scripts/acm.csl`.

Détails dans `.github/instructions/pdf-export.instructions.md`.

---

## Règles importantes

- **Langue des livrables = anglais uniquement**, quelle que soit la valeur de `config.json.project.language`. Règle centralisée dans `.github/instructions/output-language.instructions.md`.
- **Agents isolés** : un agent ne voit pas la session d'un autre. Toute communication passe par les fichiers `.planning/`.
- **Ne jamais modifier manuellement** `corpus/_index.json`, `corpus/_merged.bib`, `corpus/_abstracts-cache.json` — régénérés par `collect`.
- **Notes non citables** : Writer ne peut pas citer `corpus/notes/` comme sources.
- **Le modèle Copilot est choisi par l'utilisateur** via le dropdown VS Code. Aucun routing dans le code.

---

## Hook SessionStart — `precheck`

Au démarrage de chaque session Copilot, VS Code exécute `node papperpilot.js precheck --hook` via `.github/hooks/precheck.json`. Il vérifie :

1. PDFs non convertis en `.md`
2. BibTeX sans abstract récupéré
3. Cohérence `_index.json` ↔ fichiers sur disque

Blocker → la session Copilot démarre avec un message d'alerte. Warning → contexte injecté. Info → silencieux.

---

## Troubleshooting

### Les agents n'apparaissent pas dans VS Code

- Vérifier `chat.agent.enabled: true` dans `.vscode/settings.json`
- Reload : `Cmd+Shift+P` → *Developer: Reload Window*
- Vérifier que `ls .github/agents/` renvoie bien les 6 fichiers `.agent.md`

### `pdftotext introuvable` lors de `collect`

Installer poppler :
- macOS : `brew install poppler`
- Linux : `sudo apt install poppler-utils`
- Windows : `scoop install poppler`

Sans poppler, tu peux utiliser uniquement des `.bib` et des notes (pas de PDFs).

### `pandoc introuvable` lors de `export`

```bash
brew install pandoc                    # macOS
sudo apt install pandoc                # Linux
```

### `pdflatex introuvable` lors de `export`

```bash
brew install --cask basictex           # macOS, léger ~100 MB
brew install --cask mactex             # macOS, complet ~5 GB
sudo apt install texlive-latex-base    # Linux
```

### `IEEEtran.cls introuvable` avec `--class IEEEtran`

```bash
sudo tlmgr install ieeetran collection-publishers
```

BasicTeX n'inclut pas IEEEtran par défaut. Alternative : lance `export` sans `--class IEEEtran` (rendu article générique avec citations IEEE).

### `HTTP 429` sur Semantic Scholar

Rate-limit atteint. Relance `collect --no-fetch` puis une deuxième passe plus tard (le cache protège).

### PDF converti mais fulltext vide

Le PDF est scanné (image). `pdftotext` ne fait pas d'OCR — utiliser Tesseract ou Adobe Acrobat en amont.

### Collision de clés BibTeX

Deux fichiers `.bib` définissent la même clé → `collect` affiche un warning. Renommer l'une des deux dans tes sources.

### Les agents écrasent mes corrections manuelles

Connu : les agents écrasent silencieusement leurs sorties à chaque run. Pour préserver une édition manuelle, ne pas relancer l'agent correspondant. Seul le Reviewer gère un versioning (`REVIEW_vN.md`).

### Mode offline complet

```bash
node papperpilot.js collect --no-fetch
```

`analyze`, `outline`, `bibliography`, `export` n'ont jamais besoin du réseau (une fois les dépendances installées).

### Mon organisation GitHub a désactivé les custom agents

Il faut `chat.agent.enabled` + `chat.hooks.enabled` côté organisation. Sans cela, les agents ne s'affichent pas dans Copilot Chat — PapperPilot n'est pas utilisable.

---

## Architecture

- **`gsdlite.js`** : runtime Node pur, ~1300 lignes, zéro dépendance npm. Gère l'ingestion, l'analyse heuristique, l'export.
- **Agents Copilot** : 6 fichiers Markdown qui pilotent la partie LLM (rédaction, synthèse). Chacun déclare ses outils, ses entrées et ses sorties dans son frontmatter.
- **Instructions partagées** (`.github/instructions/`) : 6 fichiers attachés aux agents via le champ `instructions:` de leur frontmatter (style académique, format BibTeX, conversion PDF, méthodologie, langue de sortie, export PDF).
- **`.planning/`** : état du pipeline inter-agents. Source de vérité pour la reprise de session.
- **`.plans/<slug>/`** : sortie CLI de `analyze` et `outline`. Consommé par Outline / StateOfArt / Writer.

Communication inter-agents **exclusivement par fichiers**. Aucune session Copilot ne voit le contexte d'une autre.

---

## Licence

MIT
