---
description: 'Lancer la phase d''analyse — extraction structurée de la matrice de preuves.'
---

# Phase ANALYSE

Lance l'agent Analyze pour construire la matrice de preuves et identifier consensus, controverses et zones inexplorées.

## Prérequis

- `.planning/corpus/CORPUS_MAP.md` doit exister (phase COLLECT terminée)
- `corpus/_index.json` doit être à jour

## Action CLI

```bash
node papperpilot.js analyze <slug> [--llm]
```

Ou via agent dans Copilot Chat :

```
@Analyze Analyse le corpus indexé dans corpus/_index.json et produit la matrice de preuves pour le slug <slug>.
```

## Sorties produites

- `.plans/<slug>/evidence-matrix.md`
- `.plans/<slug>/evidence-matrix.json`

## Après l'analyse

Vérifier la matrice puis lancer `rpw-outline.prompt.md`.
