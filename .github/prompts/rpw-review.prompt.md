---
description: 'Lancer la révision — contrôle qualité du document rédigé.'
---

# Phase REVIEW

Lance l'agent Reviewer pour auditer le document rédigé.

## Prérequis

- `.planning/drafts/section_*.md` doivent exister (phase WRITE terminée)
- `.planning/outline/OUTLINE.md` doit exister

## Action via agent Copilot Chat

⚠️ **Ne pas tenter `node papperpilot.js review`** — cette commande n'existe pas. La révision est produite par l'agent `@Reviewer` dans Copilot Chat.

```
@Reviewer Révise toutes les sections dans .planning/drafts/. Vérifie citations, cohérence, style et longueur. Produis REVIEW_v1.md.
```

## Pour réviser une version spécifique

```
@Reviewer Révise la version 2 du document. Produis .planning/reviews/REVIEW_v2.md.
```

## Sorties produites

- `.planning/reviews/REVIEW_v1.md` — rapport annoté avec verdict

## Après la révision

- Si **PRÊT À SOUMETTRE** : récupérer `output/paper.md`
- Si **CORRECTIONS REQUISES** : corriger les points signalés, puis relancer `rpw-review.prompt.md`
- Si **RÉVISION MAJEURE** : retourner à `rpw-write.prompt.md`
