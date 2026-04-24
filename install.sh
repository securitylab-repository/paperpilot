#!/usr/bin/env bash
# install.sh — bootstrap PapperPilot dans un projet existant
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$(pwd)}"

if [ "$SCRIPT_DIR" = "$TARGET_DIR" ]; then
  echo "⚠️  Vous exécutez install.sh depuis le repo PapperPilot lui-même."
  echo "    Passez le chemin du projet cible en argument :"
  echo "    ./install.sh /path/to/your/project"
  exit 1
fi

echo "🚀 Installation PapperPilot"
echo "   Source : $SCRIPT_DIR"
echo "   Cible  : $TARGET_DIR"
cd "$TARGET_DIR"

# ── Dossiers
# .github/agents est le chemin PAR DÉFAUT détecté par VS Code
# pas besoin de le déclarer dans settings.json
mkdir -p \
  corpus/pdfs corpus/bib corpus/notes \
  .plans/_locks \
  .github/agents .github/hooks .github/prompts .github/instructions \
  .planning/corpus .planning/analysis .planning/outline \
  .planning/state_of_art .planning/drafts .planning/reviews \
  output

# ── README dans corpus/ pour expliquer l'usage
if [ ! -f corpus/README.md ]; then
cat > corpus/README.md <<'SOURCES_README'
# Sources bibliographiques

Tu peux alimenter ton corpus de **trois façons** :

```
corpus/
├── pdfs/      ← articles PDF téléchargés (convertis en .md par collect)
├── bib/       ← exports Zotero / Mendeley / JabRef (.bib)
├── notes/     ← fiches de lecture perso (.md, NON-citables)
│
├── _index.json           ← index consolidé (produit par collect)
├── _merged.bib           ← biblio unifiée (produit par collect)
└── _abstracts-cache.json ← cache des abstracts récupérés
```

## Les 3 voies d'entrée

### 1. PDFs (`pdfs/`)
Dépose ici les articles PDF téléchargés depuis arXiv, HAL, l'éditeur, etc.
`ingest` les convertit en `.md` pour que les agents puissent les lire.

### 2. BibTeX (`bib/`)
Dépose ici tes exports Zotero, Mendeley ou JabRef.
`ingest` parse les métadonnées (titre, auteurs, DOI, abstract) et les ajoute à l'index.

Utile pour :
- Déclarer des sources sans avoir le PDF sous la main
- Importer rapidement une biblio existante
- Référencer des livres, chapitres, actes de conférence

### 3. Notes personnelles (`notes/`)
Dépose ici tes fiches de lecture, synthèses perso, notes de cours.
Ces `.md` sont **lus** par les agents pour contextualiser, mais **non-citables**
en sortie finale — ils servent à nourrir ton raisonnement, pas comme référence.

Format recommandé (frontmatter YAML optionnel) :
```markdown
---
title: Notes cours Bengio Mila 2024
authors: [Moi]
year: 2024
scope: personal
---

# Notes cours Bengio Mila 2024
...
```

## Utilisation

```bash
# 1. Dépose tes sources dans les bons sous-dossiers

# 2. Indexe tout + récupère les abstracts manquants automatiquement
node papperpilot.js collect

# Variantes :
node papperpilot.js collect --no-fetch            # sans appels réseau (offline)
node papperpilot.js collect --refresh-abstracts   # force le re-fetch (cache ignoré)

# 3. Consulte l'état du corpus
node papperpilot.js corpus
node papperpilot.js coverage --missing

# Compatibilité :
# node gsdlite.js ingest/sources/abstracts reste supporté
```

## Récupération d'abstracts automatique

Pour chaque entrée `.bib` sans abstract, `ingest` tente la cascade :
1. **CrossRef** (si DOI présent)
2. **arXiv** (si arXiv ID / eprint)
3. **Semantic Scholar** (par DOI ou titre)

Les résultats sont mis en cache dans `_abstracts-cache.json`.

## Dépendances système

- **pdftotext** (pour les PDFs — optionnel si tu n'utilises que bib/notes) :
  - macOS : `brew install poppler`
  - Ubuntu/Debian : `sudo apt install poppler-utils`
  - Windows : `scoop install poppler`

- **Accès internet** (pour les abstracts — optionnel avec `--no-fetch`)

## Notes importantes

- `_index.json`, `_merged.bib`, `_abstracts-cache.json` sont **générés** — ne les édite pas à la main
- Les `.md` dans `pdfs/` ont un `_pdf_hash` qui évite de reconvertir inutilement
- Si un PDF est scanné (image), l'extraction sera vide → OCR préalable nécessaire
- Les notes dans `notes/` peuvent avoir un frontmatter YAML (title/authors/year) mais c'est optionnel
- **Les notes ne sont pas citables en sortie finale** : Writer peut s'en inspirer mais pas produire `[@key]`
SOURCES_README
  echo "📚 corpus/ créé avec un README d'explication"
fi

# ── Runtime principal + compatibilité historique
cp "$SCRIPT_DIR/papperpilot.js" ./papperpilot.js
chmod +x ./papperpilot.js
cp "$SCRIPT_DIR/gsdlite.js" ./gsdlite.js
chmod +x ./gsdlite.js
echo "📦 papperpilot.js copié (entrée principale)"
echo "📦 gsdlite.js copié (compatibilité historique)"

# ── Configuration VS Code
mkdir -p .vscode
if [ ! -f .vscode/settings.json ]; then
  cp "$SCRIPT_DIR/.vscode/settings.json" .vscode/settings.json
  echo "⚙️  .vscode/settings.json créé (chat.agent.enabled: true)"
else
  echo "⚙️  .vscode/settings.json déjà présent — non écrasé"
fi

# ── package.json si absent
if [ ! -f package.json ]; then
  cat > package.json <<'PKG_EOF'
{
  "name": "papperpilot-project",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "status": "node papperpilot.js status",
    "unlock": "node papperpilot.js unlock",
    "collect": "node papperpilot.js collect",
    "corpus": "node papperpilot.js corpus",
    "coverage": "node papperpilot.js coverage"
  }
}
PKG_EOF
  echo "📦 package.json créé"
else
  # Vérifie que "type": "module" est présent (nécessaire pour ESM)
  if ! grep -q '"type"[[:space:]]*:[[:space:]]*"module"' package.json; then
    echo "⚠️  ton package.json n'a pas \"type\": \"module\"."
    echo "   papperpilot.js / gsdlite.js utilisent des imports ESM. Ajoute-le manuellement pour éviter un warning Node."
  fi
fi

# ── .plans/_backlog.md
if [ ! -f .plans/_backlog.md ]; then
cat > .plans/_backlog.md <<'BACKLOG_EOF'
# Backlog

| Feature | Statut | Date |
|---|---|---|
BACKLOG_EOF
fi

# ── .github/copilot-instructions.md
cp "$SCRIPT_DIR/.github/copilot-instructions.md" .github/copilot-instructions.md

# ── Copie les agents actifs depuis le repo source
cp "$SCRIPT_DIR/.github/agents/"*.agent.md .github/agents/
echo "🤖 6 agents copiés (collector, analyze, outline, stateofart, writer, reviewer)"

# ── Copie les prompt files
cp "$SCRIPT_DIR/.github/prompts/"*.prompt.md .github/prompts/
echo "📝 8 prompts copiés (.github/prompts/)"

# ── Copie les instructions
cp "$SCRIPT_DIR/.github/instructions/"*.instructions.md .github/instructions/
echo "📋 4 instructions copiées (.github/instructions/)"

# ── Copie les hooks
cp "$SCRIPT_DIR/.github/hooks/"*.json .github/hooks/
echo "🪝 Hook SessionStart copié (.github/hooks/precheck.json)"

# ── Initialise .planning/ si vierge
if [ ! -f .planning/config.json ]; then
  cp "$SCRIPT_DIR/.planning/config.json" .planning/config.json
  cp "$SCRIPT_DIR/.planning/STATE.md"    .planning/STATE.md
  cp "$SCRIPT_DIR/.planning/PROJECT.md"  .planning/PROJECT.md
  for f in corpus/CORPUS_MAP.md corpus/SEARCH_QUERIES.md \
            analysis/ANALYSIS_MATRIX.md analysis/THEMES.md \
            outline/OUTLINE.md \
            state_of_art/SOA.md state_of_art/SOA.bib \
            reviews/REVIEW_v1.md; do
    cp "$SCRIPT_DIR/.planning/$f" ".planning/$f"
  done
  echo "🗂️  .planning/ initialisé"
fi

# ── .gitignore
if [ -f .gitignore ]; then
  if ! grep -q ".plans/_locks" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# PapperPilot" >> .gitignore
    echo ".plans/_locks/" >> .gitignore
  fi
else
cat > .gitignore <<'GITIGNORE_EOF'
node_modules/
.plans/_locks/
GITIGNORE_EOF
fi

echo ""
echo "✅ PapperPilot installé (zéro credential requis)"
echo ""

# ── Détection pdftotext (optionnel, pour ingest PDF)
if command -v pdftotext >/dev/null 2>&1; then
  echo "📄 pdftotext détecté : tu peux déposer des PDF dans corpus/pdfs/"
else
  echo "📄 pdftotext non détecté (optionnel, pour ingérer des PDF) :"
  echo "   • macOS    : brew install poppler"
  echo "   • Ubuntu   : sudo apt install poppler-utils"
  echo "   • Windows  : scoop install poppler"
fi

echo ""
echo "Prochaines étapes :"
echo "  1. Ferme et relance VS Code (nécessaire pour charger les agents)"
echo "  2. Ouvre la Chat view (Ctrl+Alt+I ou ⌃⌘I)"
echo "  3. Dans le DROPDOWN d'agent en bas du chat, tu dois voir :"
echo "     Collector, Analyze, Outline, StateOfArt, Writer, Reviewer"
echo "  4. Dépose tes PDFs dans corpus/ puis lance l'agent Collector"
echo "     ou : @workspace #file:.github/prompts/rpw-init.prompt.md"
echo "  5. Runtime principal : node papperpilot.js <commande>"
echo "     Compatibilité :     node gsdlite.js <commande>"
echo ""
echo "⚠️  Les custom agents se sélectionnent dans le DROPDOWN, PAS avec @"
echo "   (@ est réservé aux chat participants comme @workspace)"
echo ""
echo "Si les agents n'apparaissent pas :"
echo "  • Vérifie chat.agent.enabled=true dans les settings VS Code"
echo "  • Vérifie que les fichiers existent : ls -la .github/agents/"
echo "  • Reload window : Ctrl+Shift+P → 'Developer: Reload Window'"
echo "  • Ton organisation GitHub a peut-être désactivé les custom agents"
