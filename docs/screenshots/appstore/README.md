# Captures App Store

18 fichiers : 6 captures × 3 tailles, chacune **rendue nativement** à sa
résolution finale par `generate.py` (Pillow). Aucun redimensionnement n'est
appliqué après coup, donc aucun flou ; chaque carte est dimensionnée sur le
texte réellement mesuré, donc aucun débordement.

| Suffixe | Taille | Tranche Apple |
|---------|--------|---------------|
| *(aucun)* | 1290×2796 | 6,7" / 6,9" |
| `-69` | 1320×2868 | 6,9" |
| `-65` | 1242×2688 | 6,5" |

| # | Écran | Accroche |
|---|-------|----------|
| 1 | Accueil | Ta cybersécurité, 5 minutes par jour |
| 2 | Leçon interactive | Tu paries avant d'apprendre |
| 3 | Terminal à jetons | Un vrai terminal, sans le clavier |
| 4 | Fin de leçon | Chaque réponse est expliquée |
| 5 | S'entraîner (Pro) | Toute la pratique débloquée |
| 6 | Rang & classement | 15 rangs à gravir |

Couleurs, polices (Hanken Grotesk, JetBrains Mono) et mascotte proviennent du
design system réel. Les textes affichés sont le contenu réel du pack : leçon
« Authentification, sessions et cookies » (accroche Firesheep), question rapide
sur le C2, exercice `sys-term` (`sudo -l` sur `srv01`), missions et exercices
tels qu'ils existent dans `src/content/`.

Pseudo affiché : **Nova**. Les autres joueurs du classement sont fictifs.

Régénérer : `python3 generate.py` (Pillow requis), sortie dans `/tmp/shots/out`.

## Guideline 2.3.3

Les captures doivent refléter l'app. Elles reproduisent les écrans à partir du
code des composants et du contenu réel. À revérifier sur un build avant envoi,
et à remplacer par une vraie capture si un écran a bougé.
