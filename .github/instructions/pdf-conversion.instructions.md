---
applyTo: 'corpus/**/*.md,corpus/**/*.pdf'
description: 'Règles de conversion PDF → Markdown pour l''ingestion dans PapperPilot.'
---

# Conversion PDF → Markdown

## Outil recommandé : pdftotext (poppler)

```bash
# Installation
brew install poppler          # macOS
sudo apt install poppler-utils # Ubuntu/Debian

# Conversion
pdftotext -layout article.pdf article.txt
# Puis renommer en .md et ajuster le formatage
```

## Outil alternatif : marker (Python)

```bash
pip install marker-pdf
marker_single article.pdf article.md --langs fr,en
```

## Structure attendue après conversion

```markdown
---
key: auteur2024motcle
title: "Titre complet"
authors: ["Auteur, Prénom", "Autre, Nom"]
year: 2024
journal: "Nom de la revue"
doi: "10.xxxx/xxxxx"
source: pdf
---

# Titre de l'article

## Abstract

Texte de l'abstract...

## 1. Introduction

...

## Références

- [1] Auteur, P. (2024). Titre. Journal, 12(3), 100–120.
```

## Frontmatter obligatoire

Chaque fichier converti doit avoir un frontmatter YAML valide :

| Champ | Obligatoire | Description |
|-------|------------|-------------|
| `key` | ✅ | Clé BibTeX unique |
| `title` | ✅ | Titre complet |
| `authors` | ✅ | Liste des auteurs |
| `year` | ✅ | Année de publication |
| `source` | ✅ | `pdf`, `bib`, ou `note` |
| `journal` / `booktitle` | ⚠️ | Selon le type |
| `doi` | Recommandé | Pour vérification |
| `abstract` | Recommandé | Pour indexation |

## Nettoyage post-conversion

Après `pdftotext`, corriger :
1. **Coupures de mots** : `re-\ncherche` → `recherche`
2. **Numéros de pages** : supprimer les entêtes/pieds de page répétitifs
3. **Formules mathématiques** : noter `[FORMULE]` si non convertibles
4. **Tableaux** : reformater en Markdown ou noter `[TABLEAU — voir PDF original]`
5. **Figures** : noter `[FIGURE X — voir PDF original]`

## Validation après conversion

```bash
node papperpilot.js collect --no-fetch   # indexe sans appels réseau
node papperpilot.js corpus               # vérifie l'ingestion
node papperpilot.js coverage --missing   # sources sans abstract
```

## Cas particuliers

### PDF scanné (image)
`pdftotext` retournera un fichier vide. Utiliser un OCR :
```bash
tesseract article.pdf article pdf  # crée article.pdf OCR
# Puis reconvertir avec pdftotext
```

### PDF protégé
Vérifier les droits d'accès. Ne pas contourner les DRM.

### PDF multi-colonnes
`pdftotext -layout` préserve mieux la structure mais peut mélanger les colonnes sur les pages multi-colonnes. Vérifier et corriger manuellement.
