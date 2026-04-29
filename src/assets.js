import { ASSETS, UNIT_TYPES } from './config.js';

export class AssetLoader {
  constructor() {
    this.images = new Map();
  }

  async loadAll() {
    const entries = [
      ['background', ASSETS.background],
      ['cityPlayer', ASSETS.cityPlayer],
      ['cityEnemy', ASSETS.cityEnemy],
      ['cityNeutral', ASSETS.cityNeutral],
      ['village', ASSETS.village],
      ...Object.entries(UNIT_TYPES).map(([key, u]) => [`unit:${key}`, u.asset])
    ];
    await Promise.all(entries.map(([key, src]) => this.load(key, src)));
    return this;
  }

  load(key, src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this.images.set(key, img); resolve(img); };
      img.onerror = () => { this.images.set(key, null); resolve(null); };
      img.src = src;
    });
  }

  get(key) {
    return this.images.get(key) || null;
  }
}
