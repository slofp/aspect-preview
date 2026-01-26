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
        return JSON.parse(stored);
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

  function handleExport() {
    if (!canvasRef) return;

    const link = document.createElement('a');
    link.download = `composition-guide-${canvasSize.width}x${canvasSize.height}.png`;
    link.href = canvasRef.toDataURL('image/png');
    link.click();
  }
</script>

<main>
  <GuideCanvas {canvasSize} {guides} bind:canvasRef />
  <Sidebar
    {canvasSize}
    {guides}
    onCanvasSizeChange={handleCanvasSizeChange}
    onGuidesChange={handleGuidesChange}
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
