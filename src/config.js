export const COLS = 7;
export const ROWS = 7;

export const SAVE_KEY = 'hexWarriorsNormandySave';

export const THEME = {
  colors: {
    player: '#55e0bf',
    playerDark: '#1d8d75',
    enemy: '#ff657b',
    enemyDark: '#a73248',
    sand: '#c7a56d',
    wetSand: '#917752',
    sea: '#4e8cae',
    forest: '#46624b',
    bunker: '#62675e',
    mountain: '#6c604e',
    highlightMove: 'rgba(85,224,191,.42)',
    highlightAttack: 'rgba(255,101,123,.48)',
    selected: 'rgba(255,209,102,.36)'
  }
};

export const UNIT_TYPES = {
  infantry: { name: '步兵', role: '前线突击', icon: '🪖', atk: 2, hp: 3, def: 1, mv: 1, cost: 1, asset: 'assets/units/infantry.png' },
  archer: { name: '弓手', role: '远程神射', icon: '🎯', atk: 3, hp: 2, def: 0, mv: 1, cost: 2, ranged: true, asset: 'assets/units/archer.png' },
  cavalry: { name: '骑兵', role: '机动突击', icon: '🏍️', atk: 4, hp: 2, def: 1, mv: 2, cost: 3, asset: 'assets/units/cavalry.png' },
  shield: { name: '盾兵', role: '重装守护', icon: '🛡️', atk: 1, hp: 5, def: 2, mv: 1, cost: 3, asset: 'assets/units/shield.png' }
};

export const ASSETS = {
  background: 'assets/backgrounds/normandy-beach.png',
  cityPlayer: 'assets/buildings/city-player.png',
  cityEnemy: 'assets/buildings/city-enemy.png',
  cityNeutral: 'assets/buildings/city-enemy.png',
  village: 'assets/buildings/village.png',
  logo: 'assets/ui/logo.png'
};
