<script lang="ts">
  import type { HSLColor } from '../types';

  interface Props {
    color: HSLColor;
    onchange: (color: HSLColor) => void;
  }

  let { color, onchange }: Props = $props();

  function handleHueChange(e: Event) {
    const target = e.target as HTMLInputElement;
    let h = parseInt(target.value);
    if (h >= 240 && h <= 340) {
      h = h < 290 ? 239 : 341;
    }
    onchange({ ...color, h });
  }

  function handleSaturationChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onchange({ ...color, s: parseInt(target.value) });
  }

  function handleLightnessChange(e: Event) {
    const target = e.target as HTMLInputElement;
    onchange({ ...color, l: parseInt(target.value) });
  }
</script>

<div>
  <label>
    <span>H</span>
    <input
      type="range"
      min="0"
      max="360"
      value={color.h}
      oninput={handleHueChange}
      style="background: linear-gradient(to right,
        hsl(0, 100%, 50%),
        hsl(60, 100%, 50%),
        hsl(120, 100%, 50%),
        hsl(180, 100%, 50%),
        hsl(239, 100%, 50%),
        hsl(239, 50%, 30%),
        hsl(341, 50%, 30%),
        hsl(341, 100%, 50%),
        hsl(360, 100%, 50%));"
    />
    <output>{color.h}</output>
  </label>
  <label>
    <span>S</span>
    <input
      type="range"
      min="0"
      max="100"
      value={color.s}
      oninput={handleSaturationChange}
      style="background: linear-gradient(to right, hsl({color.h}, 0%, {color.l}%), hsl({color.h}, 100%, {color.l}%));"
    />
    <output>{color.s}%</output>
  </label>
  <label>
    <span>L</span>
    <input
      type="range"
      min="0"
      max="100"
      value={color.l}
      oninput={handleLightnessChange}
      style="background: linear-gradient(to right, hsl({color.h}, {color.s}%, 0%), hsl({color.h}, {color.s}%, 50%), hsl({color.h}, {color.s}%, 100%));"
    />
    <output>{color.l}%</output>
  </label>
  <div
    style="background-color: hsl({color.h}, {color.s}%, {color.l}%);"
  ></div>
</div>

<style>
  div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  span {
    min-width: 15px;
    font-size: 0.85rem;
    color: hsl(0, 0%, 60%);
  }

  input[type="range"] {
    flex: 1;
    appearance: none;
    -webkit-appearance: none;
    height: 8px;
    border-radius: 5px;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background-color: hsl(0, 0%, 100%);
    border: 2px solid hsl(0, 0%, 30%);
    cursor: pointer;
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 9999px;
    background-color: hsl(0, 0%, 100%);
    border: 2px solid hsl(0, 0%, 30%);
    cursor: pointer;
  }

  output {
    min-width: 40px;
    font-size: 0.85rem;
    color: hsl(0, 0%, 70%);
    text-align: right;
  }

  div > div {
    min-height: 24px;
    border-radius: 5px;
    margin-top: 5px;
  }
</style>
