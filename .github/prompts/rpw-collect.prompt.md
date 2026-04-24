---
description: 'Lancer la phase de collecte — ingestion du corpus et questions Elicit.'
---

# Phase COLLECT

Lance l'agent Collector pour ingérer le corpus et identifier les gaps bibliographiques.

## Action

Utilise l'agent `Collector` :

```
@Collector Le corpus est dans corpus/. Ingère les sources, cartographie les thèmes, identifie les gaps et pose tes questions.
```

## Entrées attendues

- `corpus/` — PDFs, fichiers `.bib`, notes `.md`
- `.planning/config.json` — configuration du projet

## Sorties produites

- `.planning/corpus/CORPUS_MAP.md`
- `.planning/corpus/SEARCH_QUERIES.md`
- `.planning/STATE.md` mis à jour

## Après la collecte

Vérifier : `node papperpilot.js corpus` puis passer à l'analyse.
