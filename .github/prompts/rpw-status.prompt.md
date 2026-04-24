---
description: 'Afficher l''état du pipeline — phase courante, progression et prochaine action.'
---

# Statut du pipeline PapperPilot

Lis `.planning/STATE.md` et affiche un résumé de l'avancement du projet.

## Informations à afficher

1. **Phase courante** : quelle étape du pipeline est active
2. **Progression** : quelles phases sont terminées / en cours / à faire
3. **Derniers artefacts produits** : liste les fichiers récemment créés dans `.planning/`
4. **Prochaine action recommandée** : quel prompt file lancer ensuite

## Pipeline de référence

```
[COLLECT] → [ANALYSE] → [OUTLINE] → [STATE_OF_ART] → [WRITER] → [REVIEWER]
```

## Format de sortie

```
📍 Phase courante : <phase>

✅ Terminé :
- COLLECT : corpus/<fichiers>
- ANALYSE : plans/<slug>/evidence-matrix.*

⏳ En cours :
- OUTLINE : ...

⬜ À faire :
- STATE_OF_ART
- WRITE
- REVIEW

🔜 Prochaine action :
  Utiliser @Outline ou lancer rpw-outline.prompt.md
```

## Vérification CLI complémentaire

```bash
node papperpilot.js status
node papperpilot.js corpus
node papperpilot.js precheck
```
