---
applyTo: '**/*.md'
description: 'Style et conventions académiques pour la rédaction scientifique.'
---

# Style académique

## Principes généraux

- Rédiger à la **troisième personne** ou en **voix passive** (sauf dans les rapports personnels)
- Éviter les formulations trop familières ou journalistiques
- Préférer la précision à la fluidité stylistique
- Chaque affirmation doit être **sourcée** ou clairement présentée comme hypothèse

## Structure des paragraphes

1. **Topic sentence** — thèse du paragraphe en première phrase
2. **Développement** — arguments et preuves avec citations
3. **Closing sentence** — synthèse ou transition

## Profondeur d'argumentation

Chaque claim central doit être développé selon une structure en 4 temps — **Contexte → Preuve → Contre-point → Implication** :

1. **Contexte** — situer le claim dans la littérature ou le problème : pourquoi cette question se pose, ce que les travaux antérieurs ont établi, la dimension du phénomène observé.
2. **Preuve** — présenter les résultats, méthodes et données qui appuient le claim, avec citations précises depuis `evidence-matrix.json` (nombres, pourcentages, méthodes expérimentales, conditions d'évaluation).
3. **Contre-point** — exposer explicitement les limites, les travaux divergents, les conditions dans lesquelles le claim ne tient plus, ou les critiques méthodologiques identifiées (voir `synthesis.contradictions` dans `outline.json`).
4. **Implication** — tirer les conséquences : ce que ce claim signifie pour le domaine, quel gap il révèle, quelle direction de recherche il ouvre, comment il se relie au claim ou à la section suivante.

**Règle pratique** : un paragraphe qui ne couvre que 1 ou 2 de ces 4 temps est trop plat — l'étoffer ou le fusionner avec un paragraphe adjacent. Cette structure garantit une densité argumentative suffisante et évite les listes de citations juxtaposées sans synthèse.

## Hedging académique (formulations nuancées)

Utiliser des formulations nuancées pour les affirmations non certaines :
- "Il semblerait que..." / "The evidence suggests that..."
- "Plusieurs études indiquent..." / "Multiple studies indicate..."
- "Des recherches récentes ont montré..." / "Recent research has shown..."

## Transitions entre sections

- "Dans cette section, nous examinons..."
- "Comme illustré précédemment..."
- "En complément de ces résultats..."

## Niveaux de titres

```
# Titre principal (H1) — une seule occurrence
## Section (H2)
### Sous-section (H3)
#### Sous-sous-section (H4) — à éviter si possible
```

## Tableaux et figures

- Tout tableau/figure doit avoir une légende descriptive
- Référencer dans le texte avant l'apparition : "Voir Tableau 1"
- Numérotation séquentielle : Tableau 1, Tableau 2 / Figure 1, Figure 2

## Termes à éviter

| À éviter | Préférer |
|---------|---------|
| "beaucoup" | "de nombreux" / "une majorité" |
| "très important" | "significatif" / "substantiel" |
| "etc." | Lister exhaustivement ou expliciter le critère |
| "évidemment" | Développer ou sourcer l'évidence |
| "je pense que" | "les données suggèrent que" |
