---
applyTo: '**/*.md,**/*.bib,output/**'
description: 'Export final : génération du PDF (IEEE par défaut) et de la bibliographie filtrée dans output/.'
---

# Export PDF — pipeline final

L'export final produit trois artefacts dans `output/` :

| Fichier | Produit par | Contenu |
|---------|-------------|---------|
| `output/paper.md` | Writer (assemblage des drafts) | Document final en Markdown + citations pandoc `[@key]` |
| `output/bibliography.bib` | `papperpilot.js bibliography` | Uniquement les refs effectivement citées dans `paper.md` (filtré depuis `corpus/_merged.bib`) |
| `output/paper.pdf` | `papperpilot.js export` | PDF compilé via pandoc + pdflatex, citations formatées IEEE |

## Commandes

```bash
# Extraction de la bibliographie finale (debug ou étape isolée)
node papperpilot.js bibliography

# Export complet : bibliographie + PDF
node papperpilot.js export                       # défaut : style IEEE, classe LaTeX `article`
node papperpilot.js export --class IEEEtran      # IEEE 2-column (requiert `tlmgr install ieeetran`)
node papperpilot.js export --no-bib              # saute la regénération de la bibliographie
```

## Dépendances

### Requises (toujours)

- **pandoc** ≥ 2.14 — conversion Markdown → PDF
  ```bash
  brew install pandoc
  ```
- **pdflatex** (BasicTeX ou MacTeX) — moteur LaTeX
  ```bash
  brew install --cask basictex   # léger (~100 MB)
  # ou
  brew install --cask mactex     # complet (~5 GB)
  ```

### Optionnelles (selon la classe LaTeX utilisée)

- **IEEEtran.cls** — pour `--class IEEEtran` (rendu IEEE 2-colonnes officiel)
  ```bash
  sudo tlmgr install ieeetran collection-publishers
  ```
  Non installé dans BasicTeX par défaut. Sans IEEEtran, la commande bascule automatiquement sur la classe `article` avec citations IEEE (CSL) — résultat propre mais en une seule colonne.

## Contenu attendu dans `paper.md`

Le Writer doit produire `output/paper.md` en Markdown pandoc :

- Titres avec `#`, `##`, `###`
- Citations : `[@cle2024]`, `[@cle2024; @autre2023]`, `[-@cle2024]` (suppressed author)
- Citations inline : `@cle2024`
- **Pas de YAML frontmatter obligatoire** : les métadonnées (titre, auteurs, affiliations) sont injectées par `export` depuis `.planning/config.json`.

## Métadonnées auteur — `config.json`

Ajouter un bloc `project.authors` dans `.planning/config.json` :

```json
{
  "project": {
    "title": "My Survey of Techniques",
    "type": "survey",
    "authors": [
      { "name": "Alice Example", "affiliation": "ACME University",    "email": "alice@acme.edu" },
      { "name": "Bob Sample",    "affiliation": "Example Laboratory", "email": "bob@example.org" }
    ]
  }
}
```

Sans ce bloc, le PDF sort avec `Anonymous / Unknown Institution` et un warning est émis.

## Extraction de la bibliographie — logique

1. Lit `output/paper.md`
2. Extrait toutes les clés citées via regex pandoc (`@key`, `[@key]`, `[-@key]`, `[@a; @b]`)
3. Filtre `corpus/_merged.bib` pour ne garder que ces clés
4. Écrit `output/bibliography.bib` avec un en-tête auto-généré
5. Warning si des clés citées sont absentes de `_merged.bib` → elles n'apparaîtront pas dans le PDF

## Pipeline pandoc (défaut)

```bash
pandoc output/paper.md \
  -o output/paper.pdf \
  --pdf-engine=pdflatex \
  --citeproc \
  --bibliography=output/bibliography.bib \
  --csl=scripts/ieee.csl \
  -V documentclass=article \
  -M title="<from config.json>" \
  -V author="<composed from config.json.project.authors>"
```

En mode `--class IEEEtran`, ajoute `-V classoption=conference`.

## Ajouter un autre style de citation

Pour ACM, APA, Vancouver, etc., télécharger le CSL correspondant depuis le dépôt officiel :

```bash
# Exemple : ACM
curl -o scripts/acm.csl https://raw.githubusercontent.com/citation-style-language/styles/master/acm-sig-proceedings.csl

# Puis modifier manuellement l'invocation pandoc ou étendre gsdlite.js pour supporter --style acm
```

Le code actuel ne supporte que `--style ieee`. Extension possible : ajouter un mapping `style → csl_path` dans `exportPdf`.

## Règle agent (Writer)

À la fin de l'assemblage de `output/paper.md`, le Writer **doit** exécuter via `runCommands` :

```
node papperpilot.js export
```

Ne jamais demander confirmation à l'utilisateur — l'export est la dernière étape naturelle du pipeline.

Si pandoc ou pdflatex manquent, la commande affiche un message d'erreur explicite avec la commande d'installation — transmettre ce message à l'utilisateur sans relancer la commande.
