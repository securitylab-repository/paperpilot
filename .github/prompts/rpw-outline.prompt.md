---
description: 'Lancer la phase de plan — structuration narrative des claims en sections.'
---

# Phase OUTLINE

Lance l'agent Outline pour construire le plan de rédaction structuré depuis la matrice de preuves.

## Prérequis

- `.plans/<slug>/evidence-matrix.json` doit exister (phase ANALYSE terminée)

## Action CLI

```bash
node papperpilot.js outline <slug> [--llm]
```

Ou via agent dans Copilot Chat :

```
@Outline Génère le plan de rédaction depuis .plans/<slug>/evidence-matrix.json. Propose 2-3 structures alternatives.
```

## Sorties produites

- `.plans/<slug>/outline.md`
- `.plans/<slug>/outline.json`
- `.planning/outline/OUTLINE.md` — plan validé copié ici après validation utilisateur

## Validation interactive

L'agent doit proposer 2-3 structures alternatives et attendre la validation de l'utilisateur avant de finaliser `OUTLINE.md`.

## Après le plan

Valider le plan puis lancer `rpw-soa.prompt.md` et/ou `rpw-write.prompt.md`.
