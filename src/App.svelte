<script lang="ts">
  import type { Guide, CanvasSize } from './lib/types';
  import GuideCanvas from './lib/GuideCanvas.svelte';
  import Sidebar from './lib/Sidebar.svelte';

  const STORAGE_KEY = 'aspect-preview-settings';

  interface StoredSettings {
    canvasSize: CanvasSize;
    guides: Guide[];
  }

  function loadSettings(): StoredSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const canvasSizeForMigration = parsed.canvasSize || { width: 1920, height: 1080 };
        const migratedGuides = parsed.guides.map((g: any) => {
          const scaleX = g.scaleX ?? 1;
          const scaleY = g.scaleY ?? 1;
          return {
            ...g,
            offsetX: g.offsetX ?? 0,
            offsetY: g.offsetY ?? 0,
            guideWidth: g.guideWidth ?? canvasSizeForMigration.width * scaleX,
            guideHeight: g.guideHeight ?? canvasSizeForMigration.height * scaleY,
            scaleX: undefined,
            scaleY: undefined
          };
        });
        return { ...parsed, guides: migratedGuides };
      }
    } catch {
      // ignore
    }
    return {
      canvasSize: { width: 1920, height: 1080 },
      guides: []
    };
  }

  function saveSettings() {
    const settings: StoredSettings = { canvasSize, guides };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  const initial = loadSettings();
  let canvasSize = $state<CanvasSize>(initial.canvasSize);
  let guides = $state<Guide[]>(initial.guides);
  let canvasRef = $state<HTMLCanvasElement | null>(null);
  let selectedGuideId = $state<string | null>(null);

  $effect(() => {
    canvasSize;
    guides;
    saveSettings();
  });

  function handleCanvasSizeChange(size: CanvasSize) {
    canvasSize = size;
  }

  function handleGuidesChange(newGuides: Guide[]) {
    guides = newGuides;
  }

  function handleSelectGuide(id: string | null) {
    selectedGuideId = id;
  }

  function handleExport() {
    if (!canvasRef) return;

    const link = document.createElement('a');
    link.download = `composition-guide-${canvasSize.width}x${canvasSize.height}.png`;
    link.href = canvasRef.toDataURL('image/png');
    link.click();
  }
</script>

<main>
  <GuideCanvas
    {canvasSize}
    {guides}
    {selectedGuideId}
    onGuidesChange={handleGuidesChange}
    bind:canvasRef
  />
  <Sidebar
    {canvasSize}
    {guides}
    {selectedGuideId}
    onCanvasSizeChange={handleCanvasSizeChange}
    onGuidesChange={handleGuidesChange}
    onSelectGuide={handleSelectGuide}
    onExport={handleExport}
  />
</main>

<style>
  main {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
</style>
