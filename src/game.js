import { COLS, ROWS, SAVE_KEY, UNIT_TYPES } from './config.js';
import { getBonus, hexDist } from './rules.js';

export class GameState {
  constructor(onChange = () => {}) {
    this.onChange = onChange;
    this.unitIdCounter = 1;
    this.reset();
  }

  reset() {
    this.currentPlayer = 0;
    this.turn = 1;
    this.phase = 'play';
    this.players = [{ gold: 4, iron: 0, cities: 2 }, { gold: 4, iron: 0, cities: 2 }];
    this.selectedUnit = null;
    this.selectedTile = null;
    this.highlightedTiles = [];
    this.unitIdCounter = 1;
    this.grid = this.createMap();
    this.units = [];
    this.createUnit(1, 5, 'infantry', 0);
    this.createUnit(2, 5, 'archer', 0);
    this.createUnit(5, 1, 'infantry', 1);
    this.createUnit(4, 1, 'shield', 1);
    this.notify();
  }

  createMap() {
    this.castles = [
      { c: 1, r: 6, owner: 0 }, { c: 0, r: 4, owner: 0 },
      { c: 3, r: 3, owner: null },
      { c: 6, r: 2, owner: 1 }, { c: 5, r: 0, owner: 1 }
    ];
    const villages = [{ c: 2, r: 2, owner: null }, { c: 4, r: 4, owner: null }, { c: 1, r: 2, owner: null }, { c: 5, r: 5, owner: null }];
    const grid = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        let type = 'sand';
        if (r <= 1) type = 'bunker';
        if ((c + r) % 5 === 0) type = 'grass';
        if ((c === 3 && r === 1) || (c === 4 && r === 2)) type = 'smoke';
        row.push({ c, r, type, city: null, village: false, owner: null });
      }
      grid.push(row);
    }
    this.castles.forEach((castle, i) => Object.assign(grid[castle.r][castle.c], { city: i, owner: castle.owner }));
    villages.forEach(v => Object.assign(grid[v.r][v.c], { village: true, owner: v.owner }));
    return grid;
  }

  createUnit(c, r, type, owner) {
    const cfg = UNIT_TYPES[type];
    const unit = { id: this.unitIdCounter++, c, r, type, owner, hp: cfg.hp, maxHp: cfg.hp, atk: cfg.atk, def: cfg.def, mv: cfg.mv, maxMv: cfg.mv, moved: false, attacked: false };
    this.units.push(unit);
    return unit;
  }

  notify() { this.onChange(this); }

  selectUnit(unit) {
    if (this.selectedUnit === unit) return this.deselect();
    this.selectedUnit = unit;
    this.selectedTile = null;
    this.highlightedTiles = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const d = hexDist(unit.c, unit.r, c, r);
      const occ = this.units.find(x => x.c === c && x.r === r);
      if (!unit.moved && d > 0 && d <= unit.mv) {
        if (occ && occ.owner !== unit.owner && d <= this.attackRange(unit)) this.highlightedTiles.push({ c, r, action: 'attack', unit: occ });
        else if (!occ) this.highlightedTiles.push({ c, r, action: 'move' });
      } else if (!unit.attacked && d > 0 && d <= this.attackRange(unit)) {
        if (occ && occ.owner !== unit.owner) this.highlightedTiles.push({ c, r, action: 'attack', unit: occ });
      }
    }
    this.notify();
  }

  attackRange(unit) { return UNIT_TYPES[unit.type].ranged ? 2 : 1; }

  selectTile(hex) {
    this.selectedUnit = null;
    this.highlightedTiles = [];
    this.selectedTile = hex;
    this.notify();
  }

  deselect() {
    this.selectedUnit = null;
    this.selectedTile = null;
    this.highlightedTiles = [];
    this.notify();
  }

  moveUnit(unit, c, r) {
    unit.c = c; unit.r = r; unit.moved = true;
    const tile = this.grid[r][c];
    if (tile.village && tile.owner !== unit.owner) { tile.owner = unit.owner; this.players[unit.owner].iron++; }
    if (tile.city !== null && tile.owner !== unit.owner) {
      if (tile.owner !== null) this.players[tile.owner].cities--;
      tile.owner = unit.owner;
      this.players[unit.owner].cities++;
      unit.hp = Math.min(unit.maxHp, unit.hp + 2);
    }
    this.deselect(); this.save(); this.checkWin(); this.notify();
  }

  attackUnit(unit, target) {
    const targetTile = this.grid[target.r][target.c];
    let def = target.def;
    if (targetTile.type === 'grass') def++;
    if (targetTile.city !== null && targetTile.owner === target.owner) def += 2;
    const dmg = Math.max(1, unit.atk + getBonus(unit.type, target.type) - def);
    target.hp -= dmg;
    unit.attacked = true; unit.moved = true;
    if (target.hp > 0 && hexDist(unit.c, unit.r, target.c, target.r) <= 1) {
      const unitTile = this.grid[unit.r][unit.c];
      let unitDef = unit.def + (unitTile.type === 'grass' ? 1 : 0);
      unit.hp -= Math.max(1, target.atk + getBonus(target.type, unit.type) - unitDef);
    }
    this.units = this.units.filter(u => u.hp > 0);
    this.deselect(); this.save(); this.checkWin(); this.notify();
  }

  spawnUnit(c, r, type) {
    const cfg = UNIT_TYPES[type];
    if (this.currentPlayer !== 0 || this.phase !== 'play') return false;
    if (this.players[0].gold < cfg.cost) return false;
    if (this.units.some(u => u.c === c && u.r === r)) return false;
    this.players[0].gold -= cfg.cost;
    this.createUnit(c, r, type, 0);
    this.deselect(); this.save(); this.notify();
    return true;
  }

  giveResources(player) {
    this.players[player].gold += this.players[player].cities * 2;
    let depots = 0;
    for (const row of this.grid) for (const tile of row) if (tile.village && tile.owner === player) depots++;
    this.players[player].iron += depots;
  }

  endPlayerTurn() {
    if (this.currentPlayer !== 0 || this.phase !== 'play') return;
    this.deselect();
    this.phase = 'ai'; this.currentPlayer = 1;
    this.units.forEach(u => { u.moved = false; u.attacked = false; });
    this.giveResources(1); this.aiRecruit(); this.save(); this.notify();
    setTimeout(() => this.aiAct(), 360);
  }

  aiRecruit() {
    const enemyCities = this.castles.map(c => this.grid[c.r][c.c]).filter(t => t.owner === 1);
    for (const tile of enemyCities) {
      if (this.players[1].gold <= 0) break;
      if (this.units.some(u => u.c === tile.c && u.r === tile.r)) continue;
      const types = ['infantry', 'archer', 'cavalry', 'shield'];
      const affordable = types.filter(t => UNIT_TYPES[t].cost <= this.players[1].gold);
      if (!affordable.length) continue;
      const type = affordable[Math.floor(Math.random() * affordable.length)];
      this.players[1].gold -= UNIT_TYPES[type].cost;
      this.createUnit(tile.c, tile.r, type, 1);
    }
  }

  aiAct() {
    for (const unit of [...this.units.filter(u => u.owner === 1 && u.hp > 0)]) {
      if (!this.units.includes(unit)) continue;
      const target = this.findClosestTarget(unit);
      if (!target) continue;
      const inRange = this.units.find(u => u.owner === 0 && hexDist(unit.c, unit.r, u.c, u.r) <= this.attackRange(unit));
      if (inRange) { this.attackUnit(unit, inRange); continue; }
      let best = null, bestDist = 99;
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if (hexDist(unit.c, unit.r, c, r) !== 1) continue;
        if (this.units.some(u => u.c === c && u.r === r)) continue;
        const d = hexDist(c, r, target.c, target.r);
        if (d < bestDist) { bestDist = d; best = { c, r }; }
      }
      if (best) this.moveUnit(unit, best.c, best.r);
      const after = this.units.find(u => u.owner === 0 && hexDist(unit.c, unit.r, u.c, u.r) <= this.attackRange(unit));
      if (after && !unit.attacked) this.attackUnit(unit, after);
    }
    this.units = this.units.filter(u => u.hp > 0);
    this.currentPlayer = 0; this.phase = 'play'; this.turn++;
    this.giveResources(0);
    this.units.forEach(u => { u.moved = false; u.attacked = false; });
    this.save(); this.checkWin(); this.notify();
  }

  findClosestTarget(unit) {
    const units = this.units.filter(u => u.owner === 0);
    const goals = units.length ? units : this.castles.map(c => this.grid[c.r][c.c]).filter(t => t.owner !== 1);
    let best = null, bestDist = 99;
    for (const g of goals) { const d = hexDist(unit.c, unit.r, g.c, g.r); if (d < bestDist) { bestDist = d; best = g; } }
    return best;
  }

  checkWin() {
    if (this.players[0].cities >= 4) this.phase = 'won';
    if (this.players[1].cities >= 4) this.phase = 'lost';
    if (this.phase === 'won' || this.phase === 'lost') localStorage.removeItem(SAVE_KEY);
  }

  save() {
    const data = { currentPlayer: this.currentPlayer, turn: this.turn, phase: this.phase, players: this.players, grid: this.grid, units: this.units, unitIdCounter: this.unitIdCounter };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  load() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      Object.assign(this, data);
      this.selectedUnit = null; this.selectedTile = null; this.highlightedTiles = [];
      this.castles = [];
      for (const row of this.grid) for (const tile of row) if (tile.city !== null) this.castles[tile.city] = { c: tile.c, r: tile.r, owner: tile.owner };
      this.notify();
      return true;
    } catch {
      localStorage.removeItem(SAVE_KEY); return false;
    }
  }
}
