import type { SnapSettings } from '../types';

export function snapAngle(angle: number, snap: SnapSettings): number {
  if (!snap.enabled) return angle;
  const snapRad = (snap.angle * Math.PI) / 180;
  return Math.round(angle / snapRad) * snapRad;
}

export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}
