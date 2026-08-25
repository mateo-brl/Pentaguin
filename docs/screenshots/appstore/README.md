# Captures App Store

6 captures en 6,7" (1290×2796) + leur dérivé 6,5" (1242×2688), générées par
`generate.py` (Pillow, polices et couleurs réelles de l'app, mascotte réelle).

| # | Écran | Accroche | État montré |
|---|-------|----------|-------------|
| 1 | Accueil | Ta cybersécurité, 5 minutes par jour | Pro, série 12 j, Or III |
| 2 | S'entraîner | Toute la pratique débloquée | Pro, aucun cadenas |
| 3 | Terminal à jetons | Un vrai terminal, sans le clavier | exercice `defense-term` |
| 4 | Mission | Des missions comme au SOC | `m-defense`, étape 3/4 |
| 5 | Leçon | Tu paries avant d'apprendre | bloc « à ton avis ? » |
| 6 | Rang & classement | 15 rangs à gravir | Or III, ligue Or |

Le pseudo affiché est **Nova** (anonyme) ; les autres joueurs du classement sont
fictifs. Aucune donnée réelle n'apparaît.

Régénérer : `python3 generate.py` (nécessite Pillow). Sortie dans `/tmp/store/out`.

## Guideline 2.3.3

Les captures doivent refléter l'app. L'écran 1 est calqué sur une capture réelle
de l'appareil. Les écrans 2 à 6 sont reconstruits à partir du code des
composants et du contenu JSON réel : à revérifier sur un build avant envoi, et à
remplacer par une vraie capture si un écran a bougé.
