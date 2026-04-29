import { AssetLoader } from './assets.js';
import { GameState } from './game.js';
import { Renderer } from './renderer.js';
import { UIController } from './ui.js';

const assets = new AssetLoader();
const canvas = document.getElementById('canvas');
let ui;
const game = new GameState();
const renderer = new Renderer(canvas, assets);
ui = new UIController(game, renderer);
game.onChange = () => ui.update(game);
ui.update(game);

assets.loadAll().then(() => ui.render());

window.hexWarriors = { game, renderer, ui };
