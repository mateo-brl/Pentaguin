# Design system Pentaguin

Source unique de vérité : **`src/theme/`**. Rien d'autre ne définit une couleur,
un espacement ou un rayon.

## Les trois niveaux

| Niveau | Fichier | Rôle | Qui l'importe |
|---|---|---|---|
| 1. Primitives | `theme/primitives.ts` | Valeurs brutes (`palette`, `space`, `radius`, `stroke`, `duration`) | **Personne** hors du thème |
| 2. Sémantique | `theme/semantic.ts` | Rôles : `background`, `accent`, `success`… + `Hues` | Via `useTheme()` |
| 3. Composant | `theme/components.ts` | Décisions récurrentes : `button`, `row`, `card`, `chip`, `terminal` | Les composants |

```ts
import { Radius, Spacing, Stroke } from '@/theme';
import { useTheme } from '@/hooks/use-theme';
```

## Règles dures

1. **Aucune couleur hex dans un composant.** Tout passe par `useTheme()`.
   *Unique exception documentée* : `features/telemetry/error-boundary.tsx`
   (l'écran de crash peut s'afficher sans fournisseur de thème — il lit la
   palette brute pour rester toujours visible).
2. **Échelle d'espacement fixe** : `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`
   (`Spacing.xs / sm / md / base / lg / xl / xxl / xxxl`). Aucune valeur hors
   échelle. `half: 2` a été supprimé.
3. **Quatre rayons, pas un de plus** : `Radius.sm 8`, `md 16`, `lg 20`,
   `pill 999`.
4. **Bordures d'abord, ombres rares.** Une surface se distingue par son trait.
   Une seule ombre dans l'app (le toast), via le token `shadow`.
5. **Jamais d'emoji comme icône.** Pour la marque, on utilise le manchot
   vectoriel ; pour les langues, le code ISO en mono (pas de drapeau : une
   langue n'est pas un pays).

## Palette

**Base « encre »** — un presque-noir légèrement désaturé, jamais `#000` :
`ink800 #0A0F1C` (fond) · `ink700 #121A2E` (surface) · `ink600 #1A2440`
(sélection) · `ink500 #29344F` (bordure) · `ink900 #05080F` (terminal).
**Neutres « glacier »** froids : `#EAF0FB` → `#8695AE` → `#6E7C94`.

### Ambre = marque et action

`accent #FBBE4B`, tiré **littéralement de la tache orangée du cou de notre
manchot empereur**. Décliné : `accentDark #E0A22F` (pressé, tranche du bouton),
`accentSoft #33270D` (fond teinté), `onAccent #1E1503` (texte posé dessus).

### Menthe = succès, et rien d'autre

`success #2DE0A6` ne sert plus **jamais** d'accent : uniquement bonne réponse et
confirmation. **Règle de cohabitation** : l'ambre parle d'*action*, la menthe de
*réussite*. Comme les deux n'occupent jamais le même rôle, elles ne se
concurrencent pas visuellement.

### Feedback et série

`danger #E4655F` (rouge désaturé, jamais flashy) · `streak #EF9330` (orange
brûlé du manchot, volontairement distinct de l'ambre d'action).

### Ambiance : sombre par défaut

Le thème par défaut est **sombre** (`theme-mode.ts`). C'est l'identité « encre »
de Pentaguin. Le clair reste un simple basculement de tokens sémantiques si
l'utilisateur le choisit dans Réglages — rien n'est codé en dur par mode.

### Teintes des 8 domaines : `domainColor(index)`

**Une seule famille froide** (bleu → acier glacier), dégradé maîtrisé sur 8
pas — jamais un arc-en-ciel. Le fond de pastille est la même teinte à ~13 %
(`base + '22'`) : les badges se lisent comme un système. Aucune de ces teintes
n'entre en concurrence avec l'accent ambre (action) ni la menthe (succès).
On n'utilise **pas** `Hues` pour les domaines — uniquement `domainColor`.

`Hues` ne sert plus qu'aux **avatars** (variété d'identité personnelle assumée).

### Icônes de listes : neutres

Les icônes des liens (Profil) sont **monochromes** (`textSecondary` sur
`backgroundSelected`), pas une icône colorée par ligne. Le seul élément coloré
d'une liste est l'accent ambre, réservé aux actions.

### Avatars

Set : **manchot** (défaut, rendu par le vecteur de la mascotte), initiales,
terminal, bug, fingerprint, flash, rocket, shield. Le **cadenas a été retiré**
(cliché cyber + choix bizarre pour un avatar). Liste en miroir côté serveur
(`backend/server.mjs : AVATAR_ICONS`).

## Rampe des 15 rangs

Sans violet. Lecture : on part de la terre, on traverse le froid, on bascule
dans le chaud — **l'Empereur porte l'or du manchot**.

| Ligue | Couleur | Intention |
|---|---|---|
| Bronze III→I | `#A9713F` | Terre |
| Argent III→I | `#8E9AAB` | Acier glacier |
| Or III→I | `#C9962A` | Or **ancien**, volontairement plus sourd que l'ambre d'action — un rang ne doit pas se lire comme un bouton |
| Platine III→I | `#5E9FB5` | Bleu acier |
| Diamant | `#7FC8E8` | Glacier clair — le point le plus froid |
| Maître | `#E08A3C` | Orange brûlé — la bascule |
| Empereur | `#F0B429` | L'or du manchot — le sommet |

## Typographie

Deux familles, **aucune Inter / Poppins / Roboto** :

- **Space Grotesk** — UI et titres. Grotesque géométrique avec du caractère.
  Faces : Regular, Medium, SemiBold, Bold.
- **JetBrains Mono** — réservée à la **donnée** : codes, XP, chrono, rangs,
  commandes, et les étiquettes de section en capitales espacées (signature).

**Chargement runtime** (`useFonts` dans `src/app/_layout.tsx`) : les `.ttf`
voyagent comme assets d'EAS Update, donc **modifiables en OTA sans rebuild
natif**. Licence OFL incluse dans `assets/fonts/LICENSE.md`.

⚠️ Les styles nomment la **face exacte** (`FontFamily.semibold`), jamais
`fontWeight` : avec une police personnalisée, iOS l'ignore et fabriquerait un
faux gras.

## Motion

`Duration.micro 120ms` (appui) · `ui 220ms` (transitions) · `celebration 480ms`
(rang, série, XP). Courbe standard `cubic-bezier(.2,.8,.2,1)` ; léger
dépassement pour les récompenses ; linéaire **uniquement** pour les boucles
(flamme). Sobre par défaut, généreux aux moments qui comptent.

## Mise en page

Hiérarchie plutôt que symétrie : on évite les grilles de cartes clonées. Sur
l'accueil, le rang **domine** (grande tuile ambrée) et XP/série l'accompagnent en
tuiles secondaires — pas trois cellules identiques.

Le registre cyber reste **au second degré** : pas de Matrix, pas de cadenas
décoratifs, pas de circuits. La technicité passe par le mono et le faux terminal
des exercices, qui sont fonctionnels.
