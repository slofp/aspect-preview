<script lang="ts">
  import type { Guide, GuideType, CanvasSize, SnapSettings } from '../types';
  import { GUIDE_TYPE_LABELS, createDefaultGuide } from '../types';
  import GuideItem from './GuideItem.svelte';
  import { IconDownload, IconArrowsExchange } from '@tabler/icons-svelte';

  interface Props {
    canvasSize: CanvasSize;
    guides: Guide[];
    selectedGuideId: string | null;
    snap: SnapSettings;
    onCanvasSizeChange: (size: CanvasSize) => void;
    onGuidesChange: (guides: Guide[]) => void;
    onSelectGuide: (id: string | null) => void;
    onSnapChange: (snap: SnapSettings) => void;
    onExport: () => void;
  }

  let { canvasSize, guides, selectedGuideId, snap, onCanvasSizeChange, onGuidesChange, onSelectGuide, onSnapChange, onExport }: Props = $props();

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

  function swapDimensions() {
    const newWidth = canvasSize.height;
    const newHeight = canvasSize.width;
    widthInput = newWidth.toString();
    heightInput = newHeight.toString();
    onCanvasSizeChange({ width: newWidth, height: newHeight });
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
  let dropTargetIndex: number | null = $state(null);
  let listElement: HTMLUListElement | null = $state(null);

  function handleDragStart(e: MouseEvent, guide: Guide) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;

    e.preventDefault();
    draggedId = guide.id;
    document.body.style.cursor = 'grabbing';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(e: MouseEvent) {
    if (!draggedId || !listElement) return;

    const items = Array.from(listElement.querySelectorAll('li'));
    const draggedIndex = guides.findIndex(g => g.id === draggedId);

    let newDropIndex: number | null = null;

    for (let i = 0; i < items.length; i++) {
      if (i === draggedIndex) continue;

      const rect = items[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        newDropIndex = i;
        break;
      } else {
        newDropIndex = i + 1;
      }
    }

    if (newDropIndex === draggedIndex || newDropIndex === draggedIndex + 1) {
      newDropIndex = null;
    }

    dropTargetIndex = newDropIndex;
  }

  function handleMouseUp() {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';

    if (draggedId && dropTargetIndex !== null) {
      const draggedIndex = guides.findIndex(g => g.id === draggedId);

      if (draggedIndex !== -1) {
        const newGuides = [...guides];
        const [removed] = newGuides.splice(draggedIndex, 1);
        const insertIndex = dropTargetIndex > draggedIndex ? dropTargetIndex - 1 : dropTargetIndex;
        newGuides.splice(insertIndex, 0, removed);
        onGuidesChange(newGuides);
      }
    }

    draggedId = null;
    dropTargetIndex = null;
  }

  function isDropTarget(index: number): boolean {
    return dropTargetIndex === index && draggedId !== null;
  }

  function isDropTargetEnd(): boolean {
    return dropTargetIndex === guides.length && draggedId !== null;
  }
</script>

<aside>
  <section>
    <h2>解像度</h2>
    <div class="size-inputs">
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
      <button type="button" class="swap-btn" onclick={swapDimensions} aria-label="縦横を反転">
        <IconArrowsExchange size={18} />
      </button>
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
      <ul bind:this={listElement} class:is-dragging={draggedId !== null}>
        {#each guides as guide, index (guide.id)}
          <li
            onmousedown={(e) => handleDragStart(e, guide)}
            class:dragging={draggedId === guide.id}
            class:drop-above={isDropTarget(index)}
            class:drop-below={index === guides.length - 1 && isDropTargetEnd()}
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
    <h2>回転スナップ</h2>
    <label class="snap-toggle">
      <input
        type="checkbox"
        checked={snap.enabled}
        onchange={(e) => onSnapChange({ ...snap, enabled: (e.target as HTMLInputElement).checked })}
      />
      <span>スナップ有効</span>
    </label>
    <label class="snap-angle">
      <span>角度</span>
      <input
        type="number"
        min="1"
        max="90"
        step="1"
        value={snap.angle}
        onchange={(e) => onSnapChange({ ...snap, angle: parseInt((e.target as HTMLInputElement).value) || 45 })}
        disabled={!snap.enabled}
      />
      <span>°</span>
    </label>
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
    scrollbar-width: thin;
    scrollbar-color: hsl(0, 0%, 25%) transparent;
  }

  aside::-webkit-scrollbar {
    width: 8px;
  }

  aside::-webkit-scrollbar-track {
    background: transparent;
  }

  aside::-webkit-scrollbar-thumb {
    background-color: hsl(0, 0%, 25%);
    border-radius: 4px;
  }

  aside::-webkit-scrollbar-thumb:hover {
    background-color: hsl(0, 0%, 35%);
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

  .size-inputs {
    display: flex;
    align-items: flex-end;
    gap: 10px;
  }

  .size-inputs > label {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 5px;
  }

  .size-inputs > label > span {
    font-size: 0.85rem;
    color: hsl(0, 0%, 50%);
  }

  .size-inputs > label > input {
    padding: 8px 10px;
    background-color: hsl(0, 0%, 18%);
    border: 1px solid hsl(0, 0%, 28%);
    border-radius: 5px;
    color: hsl(0, 0%, 90%);
    font-size: 0.95rem;
  }

  .size-inputs > label > input:focus {
    outline: none;
    border-color: hsl(200, 70%, 50%);
  }

  .swap-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background-color: hsl(0, 0%, 22%);
    border: 1px solid hsl(0, 0%, 30%);
    border-radius: 5px;
    color: hsl(0, 0%, 70%);
    cursor: pointer;
    transition: background-color 250ms, border-color 250ms, color 250ms;
  }

  .swap-btn:hover {
    background-color: hsl(0, 0%, 28%);
    border-color: hsl(0, 0%, 40%);
    color: hsl(0, 0%, 90%);
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
  }

  li.dragging {
    opacity: 0.4;
    cursor: grabbing;
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

  ul.is-dragging {
    user-select: none;
  }

  label.snap-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  label.snap-toggle > input {
    width: 18px;
    height: 18px;
    accent-color: hsl(200, 70%, 50%);
    cursor: pointer;
  }

  label.snap-toggle > span {
    font-size: 0.9rem;
    color: hsl(0, 0%, 80%);
  }

  label.snap-angle {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  label.snap-angle > span:first-child {
    font-size: 0.9rem;
    color: hsl(0, 0%, 70%);
  }

  label.snap-angle > input {
    flex: 1;
    padding: 8px 10px;
    background-color: hsl(0, 0%, 18%);
    border: 1px solid hsl(0, 0%, 28%);
    border-radius: 5px;
    color: hsl(0, 0%, 90%);
    font-size: 0.95rem;
  }

  label.snap-angle > input:focus {
    outline: none;
    border-color: hsl(200, 70%, 50%);
  }

  label.snap-angle > input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  label.snap-angle > span:last-child {
    font-size: 0.9rem;
    color: hsl(0, 0%, 60%);
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
