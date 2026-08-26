import { filterBlocked } from '../moderation';

describe('filterBlocked', () => {
  const entries = [
    { pseudo: 'Kernel_Fox' },
    { pseudo: 'Nova' },
    { pseudo: 'packet_lily' },
  ];

  it('rend la liste intacte quand rien n’est masqué', () => {
    expect(filterBlocked(entries, [])).toHaveLength(3);
  });

  it('retire le joueur masqué', () => {
    expect(filterBlocked(entries, ['Nova']).map((e) => e.pseudo)).toEqual([
      'Kernel_Fox',
      'packet_lily',
    ]);
  });

  it('ignore la casse et les espaces : « nova » masque « Nova »', () => {
    expect(filterBlocked(entries, ['  nOvA '])).toHaveLength(2);
  });

  it('masque plusieurs joueurs à la fois', () => {
    expect(filterBlocked(entries, ['Nova', 'Kernel_Fox'])).toHaveLength(1);
  });
});
