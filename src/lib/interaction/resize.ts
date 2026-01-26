import type { Guide } from '../types';
import type { HandleType, Point } from './types';
import { getAnchorLocalPosition } from './transform';

export interface ResizeResult {
  guideWidth: number;
  guideHeight: number;
  offsetX: number;
  offsetY: number;
}

export interface ResizeParams {
  handle: HandleType;
  localDelta: Point;
  initialSize: { width: number; height: number };
  anchor: Point;
  rotation: number;
  minSize?: number;
}

export function calculateResize(params: ResizeParams): ResizeResult {
  const { handle, localDelta, initialSize, anchor, rotation, minSize = 100 } = params;

  let newGuideWidth = initialSize.width;
  let newGuideHeight = initialSize.height;

  switch (handle) {
    case 'e':
      newGuideWidth = Math.max(minSize, initialSize.width + localDelta.x);
      break;
    case 'w':
      newGuideWidth = Math.max(minSize, initialSize.width - localDelta.x);
      break;
    case 's':
      newGuideHeight = Math.max(minSize, initialSize.height + localDelta.y);
      break;
    case 'n':
      newGuideHeight = Math.max(minSize, initialSize.height - localDelta.y);
      break;
    case 'se':
      newGuideWidth = Math.max(minSize, initialSize.width + localDelta.x);
      newGuideHeight = Math.max(minSize, initialSize.height + localDelta.y);
      break;
    case 'sw':
      newGuideWidth = Math.max(minSize, initialSize.width - localDelta.x);
      newGuideHeight = Math.max(minSize, initialSize.height + localDelta.y);
      break;
    case 'ne':
      newGuideWidth = Math.max(minSize, initialSize.width + localDelta.x);
      newGuideHeight = Math.max(minSize, initialSize.height - localDelta.y);
      break;
    case 'nw':
      newGuideWidth = Math.max(minSize, initialSize.width - localDelta.x);
      newGuideHeight = Math.max(minSize, initialSize.height - localDelta.y);
      break;
  }

  const newAnchorLocal = getAnchorLocalPosition(handle, newGuideWidth, newGuideHeight);
  const relX = newAnchorLocal.x - newGuideWidth / 2;
  const relY = newAnchorLocal.y - newGuideHeight / 2;
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const rotatedRelX = relX * cosR - relY * sinR;
  const rotatedRelY = relX * sinR + relY * cosR;
  const newCenterX = anchor.x - rotatedRelX;
  const newCenterY = anchor.y - rotatedRelY;

  return {
    guideWidth: newGuideWidth,
    guideHeight: newGuideHeight,
    offsetX: newCenterX - newGuideWidth / 2,
    offsetY: newCenterY - newGuideHeight / 2
  };
}

export function calculateLocalDelta(
  globalDelta: Point,
  rotation: number
): Point {
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  return {
    x: globalDelta.x * cos - globalDelta.y * sin,
    y: globalDelta.x * sin + globalDelta.y * cos
  };
}
