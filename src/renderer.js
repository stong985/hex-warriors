import { COLS, ROWS, THEME, UNIT_TYPES } from './config.js';

export class Renderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.HEX_R = 30;
    this.gridOx = 0;
    this.gridOy = 0;
  }

  cssSize() {
    const rect = this.canvas.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const { w, h } = this.cssSize();
    const nextW = Math.round(w * dpr), nextH = Math.round(h * dpr);
    if (this.canvas.width !== nextW || this.canvas.height !== nextH) {
      this.canvas.width = nextW; this.canvas.height = nextH;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.layout(w, h);
  }

  layout(w, h) {
    const pad = Math.min(w, h) * 0.08;
    const rFromW = (w - pad * 2) / (COLS * Math.sqrt(3) + 0.9);
    const rFromH = (h - pad * 2) / (ROWS * 1.25 + 0.8);
    this.HEX_R = Math.max(18, Math.floor(Math.min(rFromW, rFromH)));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const p = this.rawHexCenter(c, r);
      minX = Math.min(minX, p.x - this.HEX_R); maxX = Math.max(maxX, p.x + this.HEX_R);
      minY = Math.min(minY, p.y - this.HEX_R); maxY = Math.max(maxY, p.y + this.HEX_R);
    }
    this.gridOx = (w - (maxX - minX)) / 2 - minX;
    this.gridOy = (h - (maxY - minY)) / 2 - minY;
  }

  rawHexCenter(c, r) { return { x: this.HEX_R * Math.sqrt(3) * (c + 0.5 * (r & 1)), y: this.HEX_R * 1.5 * r }; }
  hexCenter(c, r) { const p = this.rawHexCenter(c, r); return { x: p.x + this.gridOx, y: p.y + this.gridOy }; }

  hexPoints(x, y) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 180 * (60 * i - 30);
      pts.push({ x: x + this.HEX_R * Math.cos(a), y: y + this.HEX_R * Math.sin(a) });
    }
    return pts;
  }

  pxToHex(x, y) {
    let best = null, bestD = Infinity;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const hc = this.hexCenter(c, r); const d = Math.hypot(x - hc.x, y - hc.y);
      if (d < bestD) { bestD = d; best = { c, r }; }
    }
    return bestD <= this.HEX_R * 1.05 ? best : null;
  }

  render(game) {
    this.resize();
    const ctx = this.ctx; const { w, h } = this.cssSize();
    ctx.clearRect(0, 0, w, h);
    this.drawBackground(w, h);
    this.drawGrid(game);
    this.drawUnits(game);
  }

  drawBackground(w, h) {
    const bg = this.assets.get('background');
    if (bg) {
      const scale = Math.max(w / bg.width, h / bg.height);
      const sw = bg.width * scale, sh = bg.height * scale;
      this.ctx.drawImage(bg, (w - sw) / 2, (h - sh) / 2, sw, sh);
      this.ctx.fillStyle = 'rgba(5,8,12,.42)'; this.ctx.fillRect(0, 0, w, h);
    } else {
      const g = this.ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, THEME.colors.sea); g.addColorStop(.45, '#8a9d8f'); g.addColorStop(1, THEME.colors.sand);
      this.ctx.fillStyle = g; this.ctx.fillRect(0, 0, w, h);
    }
  }

  drawGrid(game) {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const tile = game.grid[r][c]; const hc = this.hexCenter(c, r); const pts = this.hexPoints(hc.x, hc.y);
      let fill = this.tileColor(tile);
      const hl = game.highlightedTiles.find(x => x.c === c && x.r === r);
      if (hl) fill = hl.action === 'attack' ? THEME.colors.highlightAttack : THEME.colors.highlightMove;
      if (game.selectedTile?.c === c && game.selectedTile?.r === r) fill = THEME.colors.selected;
      this.ctx.beginPath(); this.ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < 6; i++) this.ctx.lineTo(pts[i].x, pts[i].y); this.ctx.closePath();
      this.ctx.fillStyle = fill; this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255,255,255,.18)'; this.ctx.lineWidth = 1.1; this.ctx.stroke();
      this.drawTerrainDetail(tile, hc);
    }
  }

  tileColor(tile) {
    if (tile.city !== null) return tile.owner === 0 ? 'rgba(42,107,100,.72)' : tile.owner === 1 ? 'rgba(111,45,55,.72)' : 'rgba(92,96,92,.7)';
    if (tile.village) return 'rgba(154,125,72,.72)';
    if (tile.type === 'bunker') return 'rgba(83,89,84,.62)';
    if (tile.type === 'grass') return 'rgba(67,92,70,.58)';
    if (tile.type === 'smoke') return 'rgba(150,153,145,.55)';
    return 'rgba(198,165,109,.52)';
  }

  drawTerrainDetail(tile, hc) {
    const r = this.HEX_R;
    if (tile.city !== null) {
      const key = tile.owner === 0 ? 'cityPlayer' : 'cityEnemy';
      const img = this.assets.get(key);
      if (img) this.drawImageContain(img, hc.x, hc.y, r * 1.5, r * 1.5);
      else this.drawEmoji(tile.owner === 0 ? '🏰' : '🧱', hc.x, hc.y, r * .74);
    } else if (tile.village) {
      const img = this.assets.get('village');
      if (img) this.drawImageContain(img, hc.x, hc.y, r * 1.2, r * 1.2);
      else this.drawEmoji('📦', hc.x, hc.y, r * .52);
    } else if (tile.type === 'smoke') {
      this.drawEmoji('💨', hc.x, hc.y, r * .42);
    } else if (tile.type === 'bunker') {
      this.drawEmoji('▰', hc.x, hc.y, r * .38);
    }
  }

  drawUnits(game) {
    for (const unit of game.units) {
      const hc = this.hexCenter(unit.c, unit.r); const cfg = UNIT_TYPES[unit.type]; const isPlayer = unit.owner === 0;
      const radius = Math.max(12, this.HEX_R * .42);
      this.ctx.beginPath(); this.ctx.arc(hc.x, hc.y + radius * .25, radius * 1.08, 0, Math.PI * 2);
      this.ctx.fillStyle = isPlayer ? 'rgba(85,224,191,.32)' : 'rgba(255,101,123,.34)'; this.ctx.fill();
      this.ctx.strokeStyle = isPlayer ? THEME.colors.player : THEME.colors.enemy; this.ctx.lineWidth = 2; this.ctx.stroke();
      const img = this.assets.get(`unit:${unit.type}`);
      if (img) this.drawImageContain(img, hc.x, hc.y - radius * .18, radius * 2.25, radius * 2.55);
      else this.drawEmoji(cfg.icon, hc.x, hc.y, radius * 1.1);
      this.drawHealth(unit, hc.x, hc.y + radius * 1.25, radius * 1.9);
      if (game.selectedUnit?.id === unit.id) {
        this.ctx.beginPath(); this.ctx.arc(hc.x, hc.y, radius * 1.38, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#ffd166'; this.ctx.lineWidth = 2.5; this.ctx.setLineDash([5, 4]); this.ctx.stroke(); this.ctx.setLineDash([]);
      }
    }
  }

  drawHealth(unit, x, y, w) {
    const h = 4;
    this.ctx.fillStyle = 'rgba(0,0,0,.62)'; this.roundRect(x - w / 2, y, w, h, 3); this.ctx.fill();
    this.ctx.fillStyle = unit.hp / unit.maxHp > .5 ? '#55e0bf' : unit.hp / unit.maxHp > .25 ? '#ffd166' : '#ff657b';
    this.roundRect(x - w / 2, y, w * (unit.hp / unit.maxHp), h, 3); this.ctx.fill();
  }

  drawImageContain(img, x, y, w, h) {
    const scale = Math.min(w / img.width, h / img.height);
    const iw = img.width * scale, ih = img.height * scale;
    this.ctx.drawImage(img, x - iw / 2, y - ih / 2, iw, ih);
  }

  drawEmoji(text, x, y, size) { this.ctx.font = `${size}px system-ui, Apple Color Emoji`; this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'middle'; this.ctx.fillText(text, x, y); }

  roundRect(x, y, w, h, r) {
    this.ctx.beginPath(); this.ctx.moveTo(x + r, y); this.ctx.arcTo(x + w, y, x + w, y + h, r); this.ctx.arcTo(x + w, y + h, x, y + h, r); this.ctx.arcTo(x, y + h, x, y, r); this.ctx.arcTo(x, y, x + w, y, r); this.ctx.closePath();
  }
}
