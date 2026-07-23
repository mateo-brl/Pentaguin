# ASO Pentaguin — métadonnées App Store (prêtes à coller)

Optimisation pour la recherche App Store. **Priorité au FR** (notre avantage :
le francophone est un désert, l'anglais un océan rouge). Constat vérifié : les
apps en tête sur l'App Store FR pour « cybersécurité » sont surtout des **apps
anglaises traduites** (HackerX « Apprendre le piratage éthique », « Cyber
Security For Beginners », « Cybersecurity Quiz ») — aucune app **française
native et gamifiée**. C'est notre créneau.

## Ce qu'Apple indexe (par ordre de poids)
1. **Nom de l'app** (30 car.) — le plus fort.
2. **Sous-titre** (30 car.) — fort.
3. **Champ mots-clés** (100 car., caché) — moyen.
4. Nom du développeur, noms des achats intégrés.
> La **description n'est PAS indexée** par Apple : elle sert à convaincre, pas à
> se classer. Les 1res lignes (avant « plus ») sont ce qui compte.

Règles : ne pas répéter dans les mots-clés un mot déjà dans le nom/sous-titre
(gaspillage) ; mots-clés séparés par des virgules **sans espaces** ; pas de
pluriels si le singulier est déjà là (Apple gère). Ne jamais citer un nom de
marque concurrent.

---

## 🇫🇷 Locale française (primaire)

**Nom (25/30)**
```
Pentaguin : Cybersécurité
```

**Sous-titre (29/30)**
```
Hacking éthique, quiz & rangs
```

**Mots-clés (93/100)**
```
sécurité,informatique,pentest,réseau,cryptographie,certification,réviser,malware,phishing,SOC
```
*(couvre « sécurité informatique », « réseau », « cryptographie », « pentest »,
« certification », « réviser », « malware », « phishing », « SOC » — Apple
combine les mots entre eux et avec le nom/sous-titre pour les requêtes multi-mots.)*

**Texte promotionnel (134/170)** — modifiable à tout moment, non indexé :
```
Le manchot qui t’apprend la cybersécurité, de zéro à expert. Test de niveau, 15 rangs, quiz et faux terminal. En français, hors-ligne.
```

**Description** (les 2 premières lignes sont les plus importantes) :
```
Apprends la cybersécurité comme un jeu — du grand débutant à l’expert.

Pentaguin te fait réviser la sécurité informatique sur ton téléphone : un test
de niveau adaptatif te place parmi 15 rangs, puis l’app t’oriente vers des
leçons et des exercices adaptés à TON niveau. Le tout en français, hors-ligne,
sans blabla.

CE QUI REND PENTAGUIN DIFFÉRENT
• Un vrai parcours, pas un dump de questions : leçons courtes, quiz avec
  explications détaillées, et de la pratique « en situation ».
• Pratique simulée : un faux terminal où tu mènes l’enquête, des logs où
  repérer l’attaque, des scénarios de décision. On apprend en faisant.
• 8 thèmes, du fondamental au pointu : hygiène, réseaux, cryptographie, web,
  systèmes & Active Directory, malwares, défense/SOC, offensive (éthique).
• Gamifié pour tenir dans la durée : séries, objectif du jour, boucliers de
  série, rangs à gravir, classement.

POUR QUI ?
Étudiants, curieux, personnes qui préparent une certification, passionnés — du
niveau zéro à l’expert. Contenu en français avec la terminologie technique
anglaise du métier.

RESPECTUEUX
Offline-first, pas de pub, pas de revente de données. La partie offensive reste
éducative et défensive, dans un cadre légal.

Rejoins la banquise. 🐧
```

---

## 🇬🇧 Locale anglaise (secondaire)

**Name (24/30)** — `Pentaguin: Cybersecurity`
**Subtitle (29/30)** — `Ethical hacking, quiz & ranks`
**Keywords (90/100)**
```
infosec,pentest,network,cryptography,certification,ethical,study,exam,malware,phishing,SOC
```
**Promotional text (139/170)**
```
The penguin that teaches you cybersecurity, from zero to expert. Placement test, 15 ranks, quizzes and a fake terminal. Bilingual, offline.
```
**Description** — même structure traduite (à demander si tu veux la version longue EN).

---

## 📸 Captures d'écran (stratégie)

6 captures, chacune avec une **accroche courte en surimpression** (le lecteur
scanne, il ne lit pas). Ordre = de l'accroche émotionnelle vers la preuve.

| # | Écran | Accroche FR |
|---|-------|-------------|
| 1 | Accueil (manchot + objectif) | **Apprends la cybersécurité en t’amusant** |
| 2 | Résultat du test (écusson de rang) | **Un test de niveau te place parmi 15 rangs** |
| 3 | Apprendre (leçons recommandées) | **Des cours adaptés à ton niveau** |
| 4 | Pratique — faux terminal | **Mets-toi en situation, comme un vrai analyste** |
| 5 | Quiz (feedback) | **Des quiz qui expliquent, pas qui piègent** |
| 6 | Accueil (série + récap semaine) | **Séries, objectifs, boucliers : garde le rythme** |

- Format iPhone 6,7" (1290×2796) requis + 6,5" ; les autres tailles sont
  dérivées par Apple.
- Fond sombre « encre » cohérent avec l'app ; accroche en Hanken, accent ambre.
- Les vrais écrans se capturent depuis un build ; les cadres + accroches se
  montent (Claude peut produire une maquette d'artefact pour valider le rendu
  avant montage final).

## 🎯 Après la publication
- Surveiller le classement sur « cybersécurité », « hacking éthique », « réviser
  cybersécurité » (App Store Connect → Analytics, et une recherche manuelle).
- Itérer le **sous-titre** et le **champ mots-clés** toutes les ~2-3 semaines
  selon ce qui ramène des impressions (ce sont les 2 leviers à tester).
- Le **texte promotionnel** se change sans nouvelle version : à réutiliser pour
  annoncer les nouveautés.
- Récolter des **avis** (un prompt doux après une belle série) : la note et le
  volume d'avis pèsent lourd dans le classement.
