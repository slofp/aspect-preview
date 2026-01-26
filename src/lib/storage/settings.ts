import type { Guide, CanvasSize, SnapSettings } from '../types';

const STORAGE_KEY = 'aspect-preview-settings';

export interface StoredSettings {
  canvasSize: CanvasSize;
  guides: Guide[];
  snap: SnapSettings;
}

const DEFAULT_SETTINGS: StoredSettings = {
  canvasSize: { width: 1920, height: 1080 },
  guides: [],
  snap: { enabled: true, angle: 45 }
};

function migrateGuides(guides: any[], canvasSize: CanvasSize): Guide[] {
  return guides.map((g: any) => {
    const scaleX = g.scaleX ?? 1;
    const scaleY = g.scaleY ?? 1;
    return {
      ...g,
      offsetX: g.offsetX ?? 0,
      offsetY: g.offsetY ?? 0,
      guideWidth: g.guideWidth ?? canvasSize.width * scaleX,
      guideHeight: g.guideHeight ?? canvasSize.height * scaleY,
      rotation: g.rotation ?? 0,
      scaleX: undefined,
      scaleY: undefined
    };
  });
}

export function loadSettings(): StoredSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const canvasSize = parsed.canvasSize || DEFAULT_SETTINGS.canvasSize;
      const migratedGuides = migrateGuides(parsed.guides || [], canvasSize);
      return {
        canvasSize,
        guides: migratedGuides,
        snap: parsed.snap ?? DEFAULT_SETTINGS.snap
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: StoredSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
