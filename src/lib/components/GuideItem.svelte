<script lang="ts">
  import type { Guide, HSLColor } from '../types';
  import { GUIDE_TYPE_LABELS, hslToString } from '../types';
  import ColorPicker from './ColorPicker.svelte';
  import { IconChevronDown, IconChevronUp, IconTrash, IconGripVertical } from '@tabler/icons-svelte';

  interface Props {
    guide: Guide;
    selected: boolean;
    onupdate: (guide: Guide) => void;
    onremove: (id: string) => void;
    onselect: () => void;
  }

  let { guide, selected, onupdate, onremove, onselect }: Props = $props();

  let expanded = $state(false);

  function toggleEnabled() {
    onupdate({ ...guide, enabled: !guide.enabled });
  }

  function handleColorChange(color: HSLColor) {
    onupdate({ ...guide, color });
  }

  function handleLineWidthChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onupdate({ ...guide, lineWidth: parseInt(target.value) });
  }

  function handleOpacityChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onupdate({ ...guide, opacity: parseInt(target.value) });
  }

  function handleGridColumnsChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onupdate({ ...guide, gridColumns: parseInt(target.value) });
  }

  function handleGridRowsChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onupdate({ ...guide, gridRows: parseInt(target.value) });
  }

  function handleSpiralFlipChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    onupdate({ ...guide, spiralFlip: target.value as 'none' | 'horizontal' | 'vertical' | 'both' });
  }

  function handleSpiralShowSquaresChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onupdate({ ...guide, spiralShowSquares: target.checked });
  }
</script>

<article class:selected>
  <header>
    <span class="grip" data-drag-handle>
      <IconGripVertical size={16} />
    </span>
    <button
      type="button"
      onclick={toggleEnabled}
      aria-pressed={guide.enabled}
      aria-label="有効/無効を切り替え"
    >
      <span
        style="background-color: {guide.enabled ? hslToString(guide.color, guide.opacity) : 'hsl(0, 0%, 30%)'};"
      ></span>
    </button>
    <button type="button" class="label" onclick={onselect}>
      <strong>{GUIDE_TYPE_LABELS[guide.type]}</strong>
    </button>
    <button type="button" onclick={() => expanded = !expanded} aria-label="展開">
      {#if expanded}
        <IconChevronUp size={18} />
      {:else}
        <IconChevronDown size={18} />
      {/if}
    </button>
    <button type="button" onclick={() => onremove(guide.id)} aria-label="削除">
      <IconTrash size={18} />
    </button>
  </header>

  {#if expanded}
    <div>
      <fieldset>
        <legend>カラー</legend>
        <ColorPicker color={guide.color} onchange={handleColorChange} />
      </fieldset>

      <label>
        <span>線幅</span>
        <input
          type="range"
          min="1"
          max="10"
          value={guide.lineWidth}
          oninput={handleLineWidthChange}
        />
        <output>{guide.lineWidth}px</output>
      </label>

      <label>
        <span>不透明度</span>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={guide.opacity}
          oninput={handleOpacityChange}
        />
        <output>{guide.opacity}%</output>
      </label>

      {#if guide.type === 'grid'}
        <label>
          <span>列数</span>
          <input
            type="number"
            min="2"
            max="20"
            value={guide.gridColumns}
            onchange={handleGridColumnsChange}
          />
        </label>
        <label>
          <span>行数</span>
          <input
            type="number"
            min="2"
            max="20"
            value={guide.gridRows}
            onchange={handleGridRowsChange}
          />
        </label>
      {/if}

      {#if guide.type === 'golden-spiral'}
        <label>
          <span>反転</span>
          <select value={guide.spiralFlip} onchange={handleSpiralFlipChange}>
            <option value="none">なし</option>
            <option value="horizontal">水平</option>
            <option value="vertical">垂直</option>
            <option value="both">両方</option>
          </select>
        </label>
        <label class="checkbox">
          <input
            type="checkbox"
            checked={guide.spiralShowSquares}
            onchange={handleSpiralShowSquaresChange}
          />
          <span>正方形を表示</span>
        </label>
      {/if}
    </div>
  {/if}
</article>

<style>
  article {
    background-color: hsl(0, 0%, 15%);
    border-radius: 5px;
    overflow: hidden;
  }

  article.selected {
    outline: 2px solid hsl(200, 70%, 50%);
  }

  header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
  }

  header > .grip {
    display: flex;
    align-items: center;
    color: hsl(0, 0%, 40%);
    cursor: grab;
  }

  header > button:nth-of-type(1) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
  }

  header > button:nth-of-type(1) span {
    display: block;
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 2px solid hsl(0, 0%, 40%);
  }

  header > button.label {
    display: flex;
    flex: 1;
    align-items: center;
    padding: 5px 10px;
    background: none;
    border: none;
    color: hsl(0, 0%, 90%);
    cursor: pointer;
  }

  header > button.label strong {
    font-size: 0.95rem;
    font-weight: 500;
  }

  header > button:nth-of-type(3) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    background: none;
    border: none;
    color: hsl(0, 0%, 60%);
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 250ms;
  }

  header > button:nth-of-type(3):hover {
    opacity: 1;
  }

  header > button:nth-of-type(4) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    background: none;
    border: none;
    color: hsl(0, 70%, 60%);
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 250ms;
  }

  header > button:nth-of-type(4):hover {
    opacity: 1;
  }

  div {
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 15px;
    padding-top: 5px;
    border-top: 1px solid hsl(0, 0%, 25%);
  }

  fieldset {
    margin: 0;
    padding: 10px;
    border: 1px solid hsl(0, 0%, 25%);
    border-radius: 5px;
  }

  legend {
    padding: 0 5px;
    font-size: 0.85rem;
    color: hsl(0, 0%, 60%);
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  label > span {
    flex-shrink: 0;
    font-size: 0.9rem;
    color: hsl(0, 0%, 70%);
  }

  label > input[type="range"] {
    flex: 1;
    appearance: none;
    -webkit-appearance: none;
    height: 6px;
    background-color: hsl(0, 0%, 30%);
    border-radius: 5px;
    cursor: pointer;
  }

  label > input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 9999px;
    background-color: hsl(200, 70%, 50%);
    cursor: pointer;
  }

  label > input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 9999px;
    background-color: hsl(200, 70%, 50%);
    border: none;
    cursor: pointer;
  }

  label > output {
    flex-shrink: 0;
    font-size: 0.85rem;
    color: hsl(0, 0%, 60%);
    text-align: right;
  }

  label > input[type="number"] {
    flex: 1;
    padding: 5px 10px;
    background-color: hsl(0, 0%, 20%);
    border: 1px solid hsl(0, 0%, 30%);
    border-radius: 5px;
    color: hsl(0, 0%, 90%);
    font-size: 0.9rem;
  }

  label > select {
    flex: 1;
    padding: 5px 10px;
    background-color: hsl(0, 0%, 20%);
    border: 1px solid hsl(0, 0%, 30%);
    border-radius: 5px;
    color: hsl(0, 0%, 90%);
    font-size: 0.9rem;
  }

  label.checkbox {
    flex-direction: row-reverse;
    justify-content: flex-end;
    gap: 10px;
  }

  label.checkbox > input {
    width: 16px;
    height: 16px;
    accent-color: hsl(200, 70%, 50%);
    cursor: pointer;
  }

  label.checkbox > span {
    min-width: auto;
  }
</style>
