export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';

export interface Point {
  x: number;
  y: number;
}

export interface InteractionState {
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  resizeHandle: HandleType | null;
  dragStart: Point;
  initialOffset: Point;
  initialSize: { width: number; height: number };
  initialRotation: number;
  anchor: Point;
}

export function createInitialInteractionState(): InteractionState {
  return {
    isDragging: false,
    isResizing: false,
    isRotating: false,
    resizeHandle: null,
    dragStart: { x: 0, y: 0 },
    initialOffset: { x: 0, y: 0 },
    initialSize: { width: 0, height: 0 },
    initialRotation: 0,
    anchor: { x: 0, y: 0 }
  };
}
