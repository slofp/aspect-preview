import type { Guide } from '../types';
import type { HandleType } from '../interaction/types';
import { SELECTION_COLOR } from './constants';

export interface SelectionBoxParams {
  scale: number;
}

function getSelectionMetrics(w: number, h: number, scale: number) {
  return {
    lineWidth: Math.max(2, 3 / scale),
    dash: Math.max(10, 15 / scale),
    gap: Math.max(5, 8 / scale),
    inset: Math.max(15, 20 / scale),
    handleSize: Math.max(8, 12 / scale),
    rotateHandleDistance: Math.max(30, 40 / scale)
  };
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  guide: Guide,
  params: SelectionBoxParams
): void {
  const w = guide.guideWidth;
  const h = guide.guideHeight;
  const metrics = getSelectionMetrics(w, h, params.scale);

  ctx.strokeStyle = SELECTION_COLOR;
  ctx.lineWidth = metrics.lineWidth;
  ctx.setLineDash([metrics.dash, metrics.gap]);
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = SELECTION_COLOR;
  const handles = getHandlePositions(w, h, metrics.inset);

  for (const handle of handles) {
    ctx.beginPath();
    ctx.rect(
      handle.x - metrics.handleSize / 2,
      handle.y - metrics.handleSize / 2,
      metrics.handleSize,
      metrics.handleSize
    );
    ctx.fill();
  }

  const rotateHandleY = metrics.inset + metrics.rotateHandleDistance;
  ctx.beginPath();
  ctx.moveTo(w / 2, metrics.inset);
  ctx.lineTo(w / 2, rotateHandleY);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(w / 2, rotateHandleY, metrics.handleSize * 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function getHandlePositions(w: number, h: number, inset: number): { type: HandleType; x: number; y: number }[] {
  return [
    { type: 'nw', x: inset, y: inset },
    { type: 'n', x: w / 2, y: inset },
    { type: 'ne', x: w - inset, y: inset },
    { type: 'e', x: w - inset, y: h / 2 },
    { type: 'se', x: w - inset, y: h - inset },
    { type: 's', x: w / 2, y: h - inset },
    { type: 'sw', x: inset, y: h - inset },
    { type: 'w', x: inset, y: h / 2 }
  ];
}

export function getHandleAtPosition(
  x: number,
  y: number,
  guide: Guide,
  scale: number
): HandleType | null {
  const w = guide.guideWidth;
  const h = guide.guideHeight;
  const metrics = getSelectionMetrics(w, h, scale);
  const hitArea = metrics.handleSize * 1.5;

  const centerX = guide.offsetX + w / 2;
  const centerY = guide.offsetY + h / 2;
  const cos = Math.cos(-guide.rotation);
  const sin = Math.sin(-guide.rotation);
  const dx = x - centerX;
  const dy = y - centerY;
  const localX = dx * cos - dy * sin + w / 2;
  const localY = dx * sin + dy * cos + h / 2;

  const rotateHandleY = metrics.inset + metrics.rotateHandleDistance;
  if (
    Math.abs(localX - w / 2) < hitArea &&
    Math.abs(localY - rotateHandleY) < hitArea
  ) {
    return 'rotate';
  }

  const handles = getHandlePositions(w, h, metrics.inset);

  for (const handle of handles) {
    if (
      Math.abs(localX - handle.x) < hitArea &&
      Math.abs(localY - handle.y) < hitArea
    ) {
      return handle.type;
    }
  }

  return null;
}
