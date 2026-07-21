/**
 * Pentaguin — le manchot empereur. Portage FIDÈLE du character design validé
 * dans Claude Design (« Pentaguin : refonte graphique complète », section 02).
 *
 * Une seule géométrie de base : le corps, le ventre et les palmes ne changent
 * jamais — seuls le visage, la position des ailerons et l'accessoire varient.
 * C'est ce qui garantit un personnage constant sur toutes les expressions.
 *
 * Les fonctions renvoient du SVG brut (rendu par <SvgXml>), ce qui garde le
 * dessin identique au pixel près à la maquette.
 */

export type PenguinState = 'neutral' | 'correct' | 'wrong' | 'streak' | 'rankup' | 'focus';
export type PenguinAccessory = 'headset' | 'beanie' | 'hoodie' | 'terminal';
/** Finition retenue : « plat géométrique » (aplats purs, la plus légère à animer). */
export type PenguinFinish = 'flat' | 'shaded' | 'sticker';

const C = {
  back: '#2E3A54',
  belly: '#F2ECDD',
  bellyTop: '#F7E6BC',
  gold: '#FBBE4B',
  orange: '#EF9330',
  beak: '#39435A',
  coral: '#E8845C',
  foot: '#E89A4A',
} as const;

const EYE = '#1A2233';

type Outline = { b: string; e: string };

function face(state: PenguinState, ol: Outline): string {
  const eye = (cx: number, dx: number, dy: number) =>
    `<ellipse cx="${cx}" cy="82" rx="9" ry="10.5" fill="#fff"${ol.e}/>` +
    `<circle cx="${cx + dx}" cy="${82 + dy}" r="4.6" fill="${EYE}"/>` +
    `<circle cx="${cx + dx - 1.7}" cy="${79.5 + dy}" r="1.7" fill="#fff"/>`;
  const beak =
    `<path d="M90 94 L100 89 L110 94 L100 108 Z" fill="${C.beak}"/>` +
    `<path d="M95 101 L105 101 L100 108 Z" fill="${C.coral}"/>`;

  if (state === 'correct') {
    return (
      `<path d="M74 84 q8 -11 16 0" fill="none" stroke="${EYE}" stroke-width="4.5" stroke-linecap="round"/>` +
      `<path d="M110 84 q8 -11 16 0" fill="none" stroke="${EYE}" stroke-width="4.5" stroke-linecap="round"/>` +
      '<ellipse cx="74" cy="110" rx="7" ry="4" fill="rgba(232,132,92,.42)"/>' +
      '<ellipse cx="126" cy="110" rx="7" ry="4" fill="rgba(232,132,92,.42)"/>' +
      beak +
      `<path d="M90 114 q10 9 20 0" fill="none" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>`
    );
  }
  if (state === 'wrong') {
    return (
      `<path d="M74 68 l16 6" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>` +
      `<path d="M126 68 l-16 6" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>` +
      eye(82, 0, -2.5) +
      eye(118, 0, -2.5) +
      `<ellipse cx="100" cy="115" rx="5" ry="6" fill="${EYE}"/>` +
      '<path d="M141 70 q6 9 0 15 q-6 -6 0 -15 z" fill="#5AA7F5"/>'
    );
  }
  if (state === 'streak') {
    return (
      `<path d="M74 80 q8 9 16 0" fill="none" stroke="${EYE}" stroke-width="4.5" stroke-linecap="round"/>` +
      `<path d="M110 80 q8 9 16 0" fill="none" stroke="${EYE}" stroke-width="4.5" stroke-linecap="round"/>` +
      beak +
      `<path d="M92 114 q9 6 18 1" fill="none" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>` +
      '<g><path d="M172 168 q-15 -17 0 -40 q6 12 12 7 q10 15 -2 34 q-6 6 -10 -1 z" fill="#FFB23E"/>' +
      '<path d="M172 162 q-8 -10 0 -22 q8 10 0 22 z" fill="#FF6B6B"/></g>'
    );
  }
  if (state === 'rankup') {
    return (
      `<ellipse cx="82" cy="82" rx="10" ry="11.5" fill="#fff"${ol.e}/><circle cx="82" cy="83" r="5.4" fill="${EYE}"/><circle cx="79.8" cy="80" r="2" fill="#fff"/>` +
      `<ellipse cx="118" cy="82" rx="10" ry="11.5" fill="#fff"${ol.e}/><circle cx="118" cy="83" r="5.4" fill="${EYE}"/><circle cx="115.8" cy="80" r="2" fill="#fff"/>` +
      '<ellipse cx="74" cy="110" rx="7" ry="4" fill="rgba(232,132,92,.42)"/>' +
      '<ellipse cx="126" cy="110" rx="7" ry="4" fill="rgba(232,132,92,.42)"/>' +
      beak +
      `<path d="M88 113 q12 12 24 0" fill="none" stroke="${EYE}" stroke-width="4" stroke-linecap="round"/>`
    );
  }
  if (state === 'focus') {
    return (
      `<ellipse cx="82" cy="83" rx="9" ry="5.5" fill="#fff"${ol.e}/><circle cx="82" cy="85" r="3.6" fill="${EYE}"/>` +
      `<ellipse cx="118" cy="83" rx="9" ry="5.5" fill="#fff"${ol.e}/><circle cx="118" cy="85" r="3.6" fill="${EYE}"/>` +
      beak +
      `<line x1="92" y1="115" x2="108" y2="115" stroke="${EYE}" stroke-width="3.5" stroke-linecap="round"/>`
    );
  }
  return eye(82, 0, 1.5) + eye(118, 0, 1.5) + beak +
    `<path d="M93 114 q7 5 14 0" fill="none" stroke="${EYE}" stroke-width="3" stroke-linecap="round"/>`;
}

function accessory(acc: PenguinAccessory, ol: Outline): string {
  if (acc === 'headset') {
    return (
      '<path d="M40 80 C44 8 156 8 160 80" fill="none" stroke="#6B7A96" stroke-width="10" stroke-linecap="round"/>' +
      '<rect x="29" y="76" width="21" height="42" rx="10.5" fill="#5B6A85"/>' +
      '<rect x="150" y="76" width="21" height="42" rx="10.5" fill="#5B6A85"/>' +
      '<rect x="34" y="87" width="10" height="22" rx="5" fill="#2DE0A6"/>'
    );
  }
  if (acc === 'beanie') {
    return (
      '<path d="M45 60 C50 6 150 6 155 60 Z" fill="#4F7CC2"/>' +
      '<rect x="41" y="53" width="118" height="15" rx="7.5" fill="#3C63A0"/>' +
      '<path d="M100 16 v-7" stroke="#3C63A0" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="100" cy="8" r="7" fill="#F2ECDD"/>'
    );
  }
  if (acc === 'hoodie') {
    return (
      `<path d="M28 116 C24 30 176 30 172 116 C150 86 50 86 28 116 Z" fill="#39465F"${ol.b}/>` +
      '<path d="M86 148 l-4 40" stroke="#39465F" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M114 148 l4 40" stroke="#39465F" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="82" cy="190" r="4.5" fill="#39465F"/><circle cx="118" cy="190" r="4.5" fill="#39465F"/>'
    );
  }
  // terminal flottant
  return (
    '<g><rect x="140" y="66" width="66" height="50" rx="8" fill="#10161f" stroke="#2DE0A6" stroke-width="2.2"/>' +
    '<rect x="140" y="66" width="66" height="12" rx="6" fill="#1b2632"/>' +
    '<circle cx="149" cy="72" r="1.8" fill="#2DE0A6"/>' +
    '<text x="149" y="104" font-family="JetBrainsMono-Bold" font-size="20" fill="#2DE0A6">&gt;_</text></g>'
  );
}

/** Corps complet du manchot (sans l'enveloppe <svg>). */
export function penguinInner(
  state: PenguinState = 'neutral',
  opts: { finish?: PenguinFinish; accessory?: PenguinAccessory | null } = {},
): string {
  const finish = opts.finish ?? 'flat';
  const acc = opts.accessory ?? null;
  const ol: Outline =
    finish === 'sticker'
      ? { b: ' stroke="#1A2233" stroke-width="5.5" stroke-linejoin="round"', e: ' stroke="#1A2233" stroke-width="3"' }
      : { b: '', e: '' };

  // Ailerons : ouverts quand il célèbre, tombants quand il se trompe.
  let flL: string;
  let flR: string;
  if (state === 'correct' || state === 'rankup') {
    flL = `<ellipse cx="32" cy="108" rx="12" ry="33" fill="${C.back}"${ol.b} transform="rotate(36 32 108)"/>`;
    flR = `<ellipse cx="168" cy="108" rx="12" ry="33" fill="${C.back}"${ol.b} transform="rotate(-36 168 108)"/>`;
  } else if (state === 'wrong') {
    flL = `<ellipse cx="38" cy="150" rx="11" ry="34" fill="${C.back}"${ol.b} transform="rotate(10 38 150)"/>`;
    flR = `<ellipse cx="168" cy="110" rx="12" ry="33" fill="${C.back}"${ol.b} transform="rotate(-34 168 110)"/>`;
  } else {
    flL = `<ellipse cx="36" cy="150" rx="11" ry="35" fill="${C.back}"${ol.b} transform="rotate(11 36 150)"/>`;
    flR = `<ellipse cx="164" cy="150" rx="11" ry="35" fill="${C.back}"${ol.b} transform="rotate(-11 164 150)"/>`;
  }

  const feet =
    `<ellipse cx="85" cy="223" rx="15" ry="7.5" fill="${C.foot}"${ol.e}/>` +
    `<ellipse cx="115" cy="223" rx="15" ry="7.5" fill="${C.foot}"${ol.e}/>`;
  const body = `<path d="M100 22 C60 22 42 58 40 104 C36 150 46 198 72 216 C86 226 114 226 128 216 C154 198 164 150 160 104 C158 58 140 22 100 22 Z" fill="${C.back}"${ol.b}/>`;
  const belly = `<path d="M100 78 C74 78 62 104 60 140 C58 178 74 208 100 210 C126 208 142 178 140 140 C138 104 126 78 100 78 Z" fill="${C.belly}"/>`;
  const bellyTop = `<path d="M100 80 C80 80 68 98 66 118 C82 110 118 110 134 118 C132 98 120 80 100 80 Z" fill="${C.bellyTop}"/>`;
  const shade =
    finish === 'shaded'
      ? '<path d="M100 78 C126 78 138 104 140 140 C142 178 126 208 100 210 C116 205 126 180 126 148 C126 116 116 92 100 80 Z" fill="rgba(26,34,51,.06)"/>'
      : '';

  const accBack = acc === 'hoodie' ? accessory(acc, ol) : '';
  const accFront = acc && acc !== 'hoodie' ? accessory(acc, ol) : '';

  return accBack + flL + flR + feet + body + belly + bellyTop + shade + face(state, ol) + accFront;
}

/** SVG complet, prêt pour <SvgXml>. */
export function penguinSvg(
  state: PenguinState = 'neutral',
  opts: { finish?: PenguinFinish; accessory?: PenguinAccessory | null } = {},
): string {
  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">${penguinInner(state, opts)}</svg>`;
}

/** Flamme de série (seule) — animée en boucle linéaire côté composant. */
export const flameSvg =
  '<svg viewBox="0 0 70 92" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M35 84 q-22 -24 0 -56 q9 16 17 9 q15 22 -3 50 q-9 8 -14 -2 z" fill="#FFB23E"/>' +
  '<path d="M35 76 q-11 -14 0 -32 q11 15 0 32 z" fill="#FF6B6B"/></svg>';

/**
 * Buste du manchot pour les AVATARS : cadré pour remplir un cercle (viewBox
 * serré, pas de marge morte comme l'ancienne « tête »).
 */
export const penguinAvatarSvg =
  '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M50 9 C29 9 21 30 21 53 C21 79 34 93 50 93 C66 93 79 79 79 53 C79 30 71 9 50 9 Z" fill="#2E3A54"/>' +
  '<ellipse cx="50" cy="61" rx="20" ry="27" fill="#F2ECDD"/>' +
  '<path d="M50 35 C39 35 32 46 31 57 C42 51 58 51 69 57 C68 46 61 35 50 35 Z" fill="#F7E6BC"/>' +
  '<ellipse cx="41" cy="41" rx="6" ry="7.6" fill="#fff"/><circle cx="42" cy="42" r="3.3" fill="#1A2233"/><circle cx="40.6" cy="39.5" r="1.3" fill="#fff"/>' +
  '<ellipse cx="59" cy="41" rx="6" ry="7.6" fill="#fff"/><circle cx="58" cy="42" r="3.3" fill="#1A2233"/><circle cx="56.6" cy="39.5" r="1.3" fill="#fff"/>' +
  '<path d="M44 48 L50 45 L56 48 L50 56 Z" fill="#39435A"/><path d="M47 52 L53 52 L50 56 Z" fill="#E8845C"/>' +
  '</svg>';

/** Tête stylisée pour l'écusson hexagonal des rangs (habillage 3b). */
export const penguinHeadSvg =
  '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><g transform="translate(60,66)">' +
  '<ellipse cx="0" cy="0" rx="15" ry="19" fill="#12100a"/>' +
  '<ellipse cx="0" cy="4" rx="9" ry="12" fill="#fff"/>' +
  '<circle cx="-4" cy="-5" r="2.4" fill="#12100a"/><circle cx="4" cy="-5" r="2.4" fill="#12100a"/>' +
  '<path d="M0 -2 l2.6 2 -2.6 2.6 -2.6 -2.6 z" fill="#F6B23C"/></g></svg>';
