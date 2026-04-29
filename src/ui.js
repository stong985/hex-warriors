import { SAVE_KEY, UNIT_TYPES } from './config.js';

export class UIController {
  constructor(game, renderer) {
    this.game = game;
    this.renderer = renderer;
    this.$ = id => document.getElementById(id);
    this.menu = this.$('menuScreen');
    this.gameUI = this.$('gameUI');
    this.briefing = this.$('briefingScreen');
    this.result = this.$('resultModal');
    this.context = this.$('contextPanel');
    this.bind();
    this.updateContinue();
  }

  bind() {
    this.$('btnNewGame').addEventListener('click', () => this.start(false));
    this.$('btnContinue').addEventListener('click', () => this.start(true));
    this.$('btnBriefing').addEventListener('click', () => this.briefing.classList.remove('hidden'));
    this.$('briefingClose').addEventListener('click', () => this.briefing.classList.add('hidden'));
    this.$('backToMenu').addEventListener('click', () => { if (confirm('返回主菜单？当前战役会自动保存。')) this.backToMenu(); });
    this.$('endTurnBtn').addEventListener('click', () => this.game.endPlayerTurn());
    this.$('resultBack').addEventListener('click', () => this.backToMenu());
    document.querySelectorAll('.unit-card').forEach(card => card.addEventListener('click', () => {
      if (!this.game.selectedTile || card.classList.contains('disabled')) return;
      this.game.spawnUnit(this.game.selectedTile.c, this.game.selectedTile.r, card.dataset.type);
    }));
    const handleCanvas = event => {
      if (this.game.phase !== 'play' || this.game.currentPlayer !== 0) return;
      event.preventDefault();
      const p = this.pointer(event);
      const hex = this.renderer.pxToHex(p.x, p.y);
      if (!hex) return this.game.deselect();
      const ownUnit = this.game.units.find(u => u.owner === 0 && u.c === hex.c && u.r === hex.r);
      if (ownUnit) return this.game.selectUnit(ownUnit);
      const hl = this.game.highlightedTiles.find(h => h.c === hex.c && h.r === hex.r);
      if (hl && this.game.selectedUnit) {
        if (hl.action === 'move') return this.game.moveUnit(this.game.selectedUnit, hex.c, hex.r);
        if (hl.action === 'attack') return this.game.attackUnit(this.game.selectedUnit, hl.unit);
      }
      const tile = this.game.grid[hex.r][hex.c];
      if (tile.city !== null && tile.owner === 0) return this.game.selectTile(hex);
      this.game.deselect();
    };
    this.renderer.canvas.addEventListener('click', handleCanvas);
    this.renderer.canvas.addEventListener('touchstart', handleCanvas, { passive: false });
    window.addEventListener('resize', () => this.render());
  }

  pointer(event) {
    const rect = this.renderer.canvas.getBoundingClientRect();
    const e = event.touches ? event.touches[0] : event;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  start(load) {
    this.menu.classList.add('hidden');
    this.gameUI.classList.remove('hidden');
    this.briefing.classList.add('hidden');
    this.result.classList.add('hidden');
    if (load && !this.game.load()) this.game.reset();
    if (!load) this.game.reset();
    requestAnimationFrame(() => this.render());
  }

  backToMenu() {
    this.gameUI.classList.add('hidden');
    this.result.classList.add('hidden');
    this.menu.classList.remove('hidden');
    this.updateContinue();
  }

  update(game = this.game) {
    this.$('goldDisplay').textContent = game.players[0].gold;
    this.$('ironDisplay').textContent = game.players[0].iron;
    this.$('citiesDisplay').textContent = game.players[0].cities;
    this.$('unitsDisplay').textContent = game.units.filter(u => u.owner === 0).length;
    this.$('turnDisplay').textContent = game.turn;
    this.$('phaseDisplay').textContent = this.phaseText(game.phase);
    this.updateContext(game);
    this.updateCards(game);
    if (game.phase === 'won' || game.phase === 'lost') this.showResult(game.phase);
    this.updateContinue();
    this.render();
  }

  render() { this.renderer.render(this.game); }

  phaseText(phase) {
    return { play: '你的回合', ai: '敌方行动', won: '胜利', lost: '失败' }[phase] || '准备';
  }

  updateContext(game) {
    if (game.selectedUnit) {
      const u = game.selectedUnit, cfg = UNIT_TYPES[u.type];
      this.context.innerHTML = `<h3>${cfg.icon} ${cfg.name} · ${cfg.role}</h3><div class="row"><span>❤️ <b>${u.hp}/${u.maxHp}</b></span><span>⚔️ <b>${u.atk}</b></span><span>🛡️ <b>${u.def}</b></span><span>👟 <b>${u.moved ? 0 : u.mv}</b></span></div>`;
      this.context.classList.remove('hidden'); return;
    }
    if (game.selectedTile) {
      this.context.innerHTML = '<h3>🏰 己方据点</h3><div class="row"><span>选择下方兵种投入战场。</span></div>';
      this.context.classList.remove('hidden'); return;
    }
    this.context.classList.add('hidden');
  }

  updateCards(game) {
    document.querySelectorAll('.unit-card').forEach(card => {
      const cfg = UNIT_TYPES[card.dataset.type];
      const enabled = game.phase === 'play' && game.currentPlayer === 0 && game.selectedTile && game.players[0].gold >= cfg.cost;
      card.classList.toggle('enabled', !!enabled);
      card.classList.toggle('disabled', !enabled);
    });
  }

  updateContinue() {
    const btn = this.$('btnContinue');
    btn.disabled = !localStorage.getItem(SAVE_KEY);
    btn.style.opacity = btn.disabled ? '.45' : '1';
  }

  showResult(phase) {
    this.$('resultTitle').textContent = phase === 'won' ? '🏆 登陆成功' : '💀 阵线失守';
    this.$('resultText').textContent = phase === 'won' ? '你占领了 4 座关键据点，海岸战役胜利。' : '敌方控制了 4 座据点，需要重新组织登陆。';
    this.result.classList.remove('hidden');
  }
}
