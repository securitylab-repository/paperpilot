---
applyTo: '**/*.bib,**/*.md'
description: 'Format des citations BibTeX et conventions bibliographiques.'
---

# Format des citations et bibliographie

## Format BibTeX standard

```bibtex
@article{auteur2024motcle,
  author  = {Auteur, Prénom and Autre, Nom},
  title   = {Titre complet de l'article},
  journal = {Nom de la revue},
  year    = {2024},
  volume  = {12},
  number  = {3},
  pages   = {100--120},
  doi     = {10.xxxx/xxxxx},
  url     = {https://...},
  abstract = {Résumé de l'article...}
}
```

## Conventions de clés BibTeX

Format : `<premier_auteur><année><motcle>`

```
vaswani2017attention
lecun2015deep
bengio2013representation
```

Règles :
- Tout en minuscules, sans accents
- Pas d'espace, pas de tiret — utiliser la concaténation directe
- Mot-clé = premier mot significatif du titre

## Types d'entrées courants

| Type | Usage |
|------|-------|
| `@article` | Article de revue à comité de lecture |
| `@inproceedings` | Article de conférence |
| `@book` | Ouvrage complet |
| `@incollection` | Chapitre dans un livre édité |
| `@techreport` | Rapport technique |
| `@misc` | Prépublication arXiv, site web |
| `@phdthesis` | Thèse de doctorat |

## Citations dans le texte

| Style | Format inline | Format parenthèse |
|-------|--------------|-------------------|
| APA | Auteur (2024) | (Auteur, 2024) |
| IEEE | [1] | [1] |
| Vancouver | (1) | (1) |
| Chicago | Auteur 2024 | (Auteur 2024) |

En Markdown avec Pandoc : `[@cle2024]` ou `@cle2024`

## Champs obligatoires par type

### @article
`author`, `title`, `journal`, `year`

### @inproceedings
`author`, `title`, `booktitle`, `year`

### @book
`author` ou `editor`, `title`, `publisher`, `year`

## Validation

Avant de citer une entrée :
1. Vérifier que la clé existe dans `CORPUS_MAP.md` ou `SOA.bib`
2. Vérifier que `author`, `title`, `year` sont renseignés
3. Vérifier le DOI si disponible via `https://doi.org/<doi>`
