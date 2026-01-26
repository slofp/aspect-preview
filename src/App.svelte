<script lang="ts">
  import type { Guide, CanvasSize, SnapSettings } from './lib/types';
  import GuideCanvas from './lib/components/GuideCanvas.svelte';
  import Sidebar from './lib/components/Sidebar.svelte';
  import { loadSettings, saveSettings } from './lib/storage/settings';

  const initial = loadSettings();
  let canvasSize = $state<CanvasSize>(initial.canvasSize);
  let guides = $state<Guide[]>(initial.guides);
  let snap = $state<SnapSettings>(initial.snap);
  let canvasRef = $state<HTMLCanvasElement | null>(null);
  let selectedGuideId = $state<string | null>(null);

  $effect(() => {
    canvasSize;
    guides;
    snap;
    saveSettings({ canvasSize, guides, snap });
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

  function handleSnapChange(newSnap: SnapSettings) {
    snap = newSnap;
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
    {snap}
    onGuidesChange={handleGuidesChange}
    bind:canvasRef
  />
  <Sidebar
    {canvasSize}
    {guides}
    {selectedGuideId}
    {snap}
    onCanvasSizeChange={handleCanvasSizeChange}
    onGuidesChange={handleGuidesChange}
    onSelectGuide={handleSelectGuide}
    onSnapChange={handleSnapChange}
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
