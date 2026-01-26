<script lang="ts">
  import type { Guide, GuideType, CanvasSize } from './types';
  import { GUIDE_TYPE_LABELS, createDefaultGuide } from './types';
  import GuideItem from './GuideItem.svelte';
  import { IconDownload } from '@tabler/icons-svelte';

  interface Props {
    canvasSize: CanvasSize;
    guides: Guide[];
    selectedGuideId: string | null;
    onCanvasSizeChange: (size: CanvasSize) => void;
    onGuidesChange: (guides: Guide[]) => void;
    onSelectGuide: (id: string | null) => void;
    onExport: () => void;
  }

  let { canvasSize, guides, selectedGuideId, onCanvasSizeChange, onGuidesChange, onSelectGuide, onExport }: Props = $props();

  const guideTypes: GuideType[] = ['thirds', 'golden-ratio', 'diagonal', 'center', 'golden-spiral', 'grid', 'triangle', 'rabatment', 'harmonic'];
  const presets = [
    { label: '1920×1080 (FHD)', width: 1920, height: 1080 },
    { label: '2560×1440 (QHD)', width: 2560, height: 1440 },
    { label: '3840×2160 (4K)', width: 3840, height: 2160 },
    { label: '1080×1920 (縦FHD)', width: 1080, height: 1920 },
    { label: '1080×1080 (正方形)', width: 1080, height: 1080 },
    { label: '4000×3000 (4:3)', width: 4000, height: 3000 },
    { label: '3508×2480 (A4:300)', width: 3508, height: 2480 },
  ];

  let widthInput = $state('1920');
  let heightInput = $state('1080');

  $effect(() => {
    widthInput = canvasSize.width.toString();
    heightInput = canvasSize.height.toString();
  });

  function applySize() {
    const width = parseInt(widthInput) || 1920;
    const height = parseInt(heightInput) || 1080;
    onCanvasSizeChange({ width, height });
  }

  function applyPreset(preset: { width: number; height: number }) {
    widthInput = preset.width.toString();
    heightInput = preset.height.toString();
    onCanvasSizeChange({ width: preset.width, height: preset.height });
  }

  let usedTypes = $derived(new Set(guides.map(g => g.type)));

  function addGuide(type: GuideType) {
    if (usedTypes.has(type)) return;
    const newGuide = createDefaultGuide(type, canvasSize);
    onGuidesChange([...guides, newGuide]);
  }

  function updateGuide(updatedGuide: Guide) {
    onGuidesChange(guides.map(g => g.id === updatedGuide.id ? updatedGuide : g));
  }

  function removeGuide(id: string) {
    onGuidesChange(guides.filter(g => g.id !== id));
  }

  let draggedId: string | null = $state(null);
  let dropTargetId: string | null = $state(null);
  let dropPosition: 'above' | 'below' | null = $state(null);
  let canDrag = $state(false);

  function handleMouseDown(e: MouseEvent) {
    const target = e.target as HTMLElement;
    canDrag = !!target.closest('[data-drag-handle]');
  }

  function handleDragStart(e: DragEvent, guide: Guide) {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    draggedId = guide.id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', guide.id);
    }
  }

  function handleDragOver(e: DragEvent, guide: Guide) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (draggedId && draggedId !== guide.id) {
      dropTargetId = guide.id;
      const draggedIndex = guides.findIndex(g => g.id === draggedId);
      const targetIndex = guides.findIndex(g => g.id === guide.id);
      dropPosition = draggedIndex < targetIndex ? 'below' : 'above';
    }
  }

  function handleDragLeave() {
    dropTargetId = null;
    dropPosition = null;
  }

  function handleDrop(e: DragEvent, targetGuide: Guide) {
    e.preventDefault();
    if (!draggedId || draggedId === targetGuide.id) {
      resetDrag();
      return;
    }

    const draggedIndex = guides.findIndex(g => g.id === draggedId);
    const targetIndex = guides.findIndex(g => g.id === targetGuide.id);

    if (draggedIndex === -1 || targetIndex === -1) {
      resetDrag();
      return;
    }

    const newGuides = [...guides];
    const [removed] = newGuides.splice(draggedIndex, 1);
    const insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
    newGuides.splice(insertIndex, 0, removed);
    onGuidesChange(newGuides);

    resetDrag();
  }

  function handleDragEnd() {
    resetDrag();
  }

  function resetDrag() {
    draggedId = null;
    dropTargetId = null;
    dropPosition = null;
  }
</script>

<aside>
  <section>
    <h2>解像度</h2>
    <div>
      <label>
        <span>幅</span>
        <input
          type="number"
          min="100"
          max="10000"
          bind:value={widthInput}
          onblur={applySize}
        />
      </label>
      <label>
        <span>高さ</span>
        <input
          type="number"
          min="100"
          max="10000"
          bind:value={heightInput}
          onblur={applySize}
        />
      </label>
    </div>
    <nav>
      {#each presets as preset}
        <button type="button" onclick={() => applyPreset(preset)}>
          {preset.label}
        </button>
      {/each}
    </nav>
  </section>

  <section>
    <h2>構図線を追加</h2>
    <nav>
      {#each guideTypes as type}
        <button type="button" onclick={() => addGuide(type)} disabled={usedTypes.has(type)}>
          {GUIDE_TYPE_LABELS[type]}
        </button>
      {/each}
    </nav>
  </section>

  <section>
    <h2>構図線一覧</h2>
    {#if guides.length === 0}
      <p>構図線がありません</p>
    {:else}
      <ul>
        {#each guides as guide (guide.id)}
          <li
            draggable="true"
            onmousedown={handleMouseDown}
            ondragstart={(e) => handleDragStart(e, guide)}
            ondragover={(e) => handleDragOver(e, guide)}
            ondragleave={handleDragLeave}
            ondrop={(e) => handleDrop(e, guide)}
            ondragend={handleDragEnd}
            class:dragging={draggedId === guide.id}
            class:drop-above={dropTargetId === guide.id && dropPosition === 'above'}
            class:drop-below={dropTargetId === guide.id && dropPosition === 'below'}
          >
            <GuideItem
              {guide}
              selected={selectedGuideId === guide.id}
              onupdate={updateGuide}
              onremove={removeGuide}
              onselect={() => onSelectGuide(selectedGuideId === guide.id ? null : guide.id)}
            />
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <button type="button" onclick={onExport}>
      <IconDownload size={20} />
      PNG エクスポート
    </button>
  </section>
</aside>

<style>
  aside {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 320px;
    min-width: 320px;
    padding: 20px;
    background-color: hsl(0, 0%, 12%);
    border-left: 1px solid hsl(0, 0%, 20%);
    overflow-y: auto;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  h2 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: hsl(0, 0%, 60%);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  section > div {
    display: flex;
    gap: 10px;
  }

  section > div > label {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 5px;
  }

  section > div > label > span {
    font-size: 0.85rem;
    color: hsl(0, 0%, 50%);
  }

  section > div > label > input {
    padding: 8px 10px;
    background-color: hsl(0, 0%, 18%);
    border: 1px solid hsl(0, 0%, 28%);
    border-radius: 5px;
    color: hsl(0, 0%, 90%);
    font-size: 0.95rem;
  }

  section > div > label > input:focus {
    outline: none;
    border-color: hsl(200, 70%, 50%);
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  nav > button {
    padding: 6px 10px;
    background-color: hsl(0, 0%, 22%);
    border: 1px solid hsl(0, 0%, 30%);
    border-radius: 5px;
    color: hsl(0, 0%, 80%);
    font-size: 0.8rem;
    cursor: pointer;
    transition: background-color 250ms, border-color 250ms;
  }

  nav > button:hover:not(:disabled) {
    background-color: hsl(0, 0%, 28%);
    border-color: hsl(0, 0%, 40%);
  }

  nav > button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: hsl(0, 0%, 50%);
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    display: block;
    cursor: grab;
  }

  li.dragging {
    opacity: 0.4;
  }

  li.drop-above::before {
    position: absolute;
    top: -6px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: hsl(200, 70%, 50%);
    content: '';
  }

  li.drop-below::after {
    position: absolute;
    bottom: -6px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: hsl(200, 70%, 50%);
    content: '';
  }


  section:last-child > button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 20px;
    background-color: hsl(200, 70%, 45%);
    border: none;
    border-radius: 5px;
    color: hsl(0, 0%, 100%);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 250ms;
  }

  section:last-child > button:hover {
    background-color: hsl(200, 70%, 55%);
  }
</style>
