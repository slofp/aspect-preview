import type { Guide } from '../types';
import type { HandleType, Point } from './types';

export function localToGlobal(localX: number, localY: number, guide: Guide): Point {
  const w = guide.guideWidth;
  const h = guide.guideHeight;
  const centerX = guide.offsetX + w / 2;
  const centerY = guide.offsetY + h / 2;
  const relX = localX - w / 2;
  const relY = localY - h / 2;
  const cos = Math.cos(guide.rotation);
  const sin = Math.sin(guide.rotation);
  return {
    x: centerX + relX * cos - relY * sin,
    y: centerY + relX * sin + relY * cos
  };
}

export function globalToLocal(globalX: number, globalY: number, guide: Guide): Point {
  const w = guide.guideWidth;
  const h = guide.guideHeight;
  const centerX = guide.offsetX + w / 2;
  const centerY = guide.offsetY + h / 2;
  const dx = globalX - centerX;
  const dy = globalY - centerY;
  const cos = Math.cos(-guide.rotation);
  const sin = Math.sin(-guide.rotation);
  return {
    x: dx * cos - dy * sin + w / 2,
    y: dx * sin + dy * cos + h / 2
  };
}

export function getAnchorLocalPosition(handle: HandleType, w: number, h: number): Point {
  switch (handle) {
    case 'e': return { x: 0, y: h / 2 };
    case 'w': return { x: w, y: h / 2 };
    case 'n': return { x: w / 2, y: h };
    case 's': return { x: w / 2, y: 0 };
    case 'se': return { x: 0, y: 0 };
    case 'sw': return { x: w, y: 0 };
    case 'ne': return { x: 0, y: h };
    case 'nw': return { x: w, y: h };
    default: return { x: w / 2, y: h / 2 };
  }
}

export function rotatePoint(point: Point, angle: number, center: Point = { x: 0, y: 0 }): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}
