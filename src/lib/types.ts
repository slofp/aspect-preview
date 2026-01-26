export type GuideType =
  | 'thirds'
  | 'golden-ratio'
  | 'diagonal'
  | 'center'
  | 'golden-spiral'
  | 'grid'
  | 'triangle'
  | 'rabatment'
  | 'harmonic';

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface Guide {
  id: string;
  type: GuideType;
  enabled: boolean;
  color: HSLColor;
  lineWidth: number;
  opacity: number;
  gridColumns?: number;
  gridRows?: number;
  spiralFlip?: 'none' | 'horizontal' | 'vertical' | 'both';
  spiralShowSquares?: boolean;
  offsetX: number;
  offsetY: number;
  guideWidth: number;
  guideHeight: number;
  rotation: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export const GUIDE_TYPE_LABELS: Record<GuideType, string> = {
  'thirds': '三分割法',
  'golden-ratio': '黄金比',
  'diagonal': '対角線',
  'center': '中心線',
  'golden-spiral': '黄金螺旋',
  'grid': 'グリッド',
  'triangle': '三角形',
  'rabatment': 'ラビットメント',
  'harmonic': 'ハーモニック'
};

export function createDefaultGuide(type: GuideType, canvasSize: CanvasSize): Guide {
  const id = crypto.randomUUID();
  const baseGuide: Guide = {
    id,
    type,
    enabled: true,
    color: { h: 0, s: 0, l: 80 },
    lineWidth: 1,
    opacity: 100,
    offsetX: 0,
    offsetY: 0,
    guideWidth: canvasSize.width,
    guideHeight: canvasSize.height,
    rotation: 0
  };

  if (type === 'grid') {
    baseGuide.gridColumns = 4;
    baseGuide.gridRows = 4;
  }

  if (type === 'golden-spiral') {
    baseGuide.spiralFlip = 'none';
    baseGuide.spiralShowSquares = false;
  }

  return baseGuide;
}

export function hslToString(color: HSLColor, opacity: number = 100): string {
  return `hsl(${color.h}, ${color.s}%, ${color.l}%, ${opacity / 100})`;
}
