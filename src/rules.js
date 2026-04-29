export function hexDist(c1, r1, c2, r2) {
  const x1 = c1 - Math.floor(r1 / 2), z1 = r1, y1 = -x1 - z1;
  const x2 = c2 - Math.floor(r2 / 2), z2 = r2, y2 = -x2 - z2;
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2), Math.abs(z1 - z2));
}

export function getBonus(attackerType, defenderType) {
  const cycle = { infantry: 'shield', shield: 'cavalry', cavalry: 'archer', archer: 'infantry' };
  return cycle[attackerType] === defenderType ? 1 : 0;
}
