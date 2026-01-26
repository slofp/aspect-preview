<script lang="ts">
  import { onMount } from 'svelte';
  import type { Guide, CanvasSize, SnapSettings } from '../types';
  import { hslToString } from '../types';
  import {
    drawThirds,
    drawGoldenRatio,
    drawDiagonal,
    drawCenter,
    drawGoldenSpiral,
    drawGrid,
    drawTriangle,
    drawRabatment,
    drawHarmonic
  } from '../canvas/guides';
  import { drawSelectionBox, getHandleAtPosition } from '../canvas/selection';
  import type { HandleType, Point } from '../interaction/types';
  import { localToGlobal, getAnchorLocalPosition } from '../interaction/transform';
  import { calculateResize, calculateLocalDelta } from '../interaction/resize';
  import { snapAngle } from '../interaction/snap';

  interface Props {
    canvasSize: CanvasSize;
    guides: Guide[];
    selectedGuideId: string | null;
    snap: SnapSettings;
    onGuidesChange: (guides: Guide[]) => void;
    canvasRef?: HTMLCanvasElement | null;
  }

  let { canvasSize, guides, selectedGuideId, snap, onGuidesChange, canvasRef = $bindable(null) }: Props = $props();

  let sectionWidth = $state(800);
  let sectionHeight = $state(600);
  let isDragging = $state(false);
  let isResizing = $state(false);
  let isRotating = $state(false);
  let resizeHandle = $state<HandleType | null>(null);
  let hoveredHandle = $state<HandleType | 'rotate' | 'move' | null>(null);
  let dragStart = $state<Point>({ x: 0, y: 0 });
  let initialOffset = $state<Point>({ x: 0, y: 0 });
  let initialSize = $state({ width: 0, height: 0 });
  let initialRotation = $state(0);
  let anchor = $state<Point>({ x: 0, y: 0 });

  const SIDEBAR_WIDTH = 321;

  function calculateSectionSize() {
    sectionWidth = window.innerWidth - SIDEBAR_WIDTH;
    sectionHeight = window.innerHeight;
  }

  function getCanvasScale(): number {
    const padding = 60;
    const availableWidth = sectionWidth - padding;
    const availableHeight = sectionHeight - padding;
    const scaleX = availableWidth / canvasSize.width;
    const scaleY = availableHeight / canvasSize.height;
    return Math.min(scaleX, scaleY);
  }

  let displayWidth = $derived.by(() => {
    const scale = getCanvasScale();
    return Math.max(1, Math.floor(canvasSize.width * scale));
  });

  let displayHeight = $derived.by(() => {
    const scale = getCanvasScale();
    return Math.max(1, Math.floor(canvasSize.height * scale));
  });

  function drawGuide(ctx: CanvasRenderingContext2D, guide: Guide): void {
    const w = guide.guideWidth;
    const h = guide.guideHeight;

    switch (guide.type) {
      case 'thirds':
        drawThirds(ctx, w, h);
        break;
      case 'golden-ratio':
        drawGoldenRatio(ctx, w, h);
        break;
      case 'diagonal':
        drawDiagonal(ctx, w, h);
        break;
      case 'center':
        drawCenter(ctx, w, h);
        break;
      case 'golden-spiral':
        drawGoldenSpiral(ctx, w, h, guide.spiralFlip || 'none', guide.spiralShowSquares || false);
        break;
      case 'grid':
        drawGrid(ctx, w, h, guide.gridColumns || 4, guide.gridRows || 4);
        break;
      case 'triangle':
        drawTriangle(ctx, w, h);
        break;
      case 'rabatment':
        drawRabatment(ctx, w, h);
        break;
      case 'harmonic':
        drawHarmonic(ctx, w, h);
        break;
    }
  }

  function render() {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    for (const guide of guides) {
      if (!guide.enabled) continue;

      const w = guide.guideWidth;
      const h = guide.guideHeight;
      const centerX = guide.offsetX + w / 2;
      const centerY = guide.offsetY + h / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(guide.rotation);
      ctx.translate(-w / 2, -h / 2);
      ctx.strokeStyle = hslToString(guide.color, guide.opacity);
      ctx.lineWidth = guide.lineWidth;

      drawGuide(ctx, guide);

      ctx.restore();

      if (guide.id === selectedGuideId) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(guide.rotation);
        ctx.translate(-w / 2, -h / 2);
        drawSelectionBox(ctx, guide, { scale: getCanvasScale() });
        ctx.restore();
      }
    }
  }

  function getMousePosition(e: MouseEvent): Point {
    if (!canvasRef) return { x: 0, y: 0 };
    const rect = canvasRef.getBoundingClientRect();
    const scale = getCanvasScale();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    };
  }

  function handleMouseDown(e: MouseEvent) {
    if (!selectedGuideId || !canvasRef) return;

    const pos = getMousePosition(e);
    dragStart = pos;

    const selectedGuide = guides.find(g => g.id === selectedGuideId);
    if (!selectedGuide) return;

    const handle = getHandleAtPosition(pos.x, pos.y, selectedGuide, getCanvasScale());

    if (handle === 'rotate') {
      initialRotation = selectedGuide.rotation;
      isRotating = true;
    } else if (handle) {
      resizeHandle = handle;
      initialSize = { width: selectedGuide.guideWidth, height: selectedGuide.guideHeight };
      initialOffset = { x: selectedGuide.offsetX, y: selectedGuide.offsetY };
      const anchorLocal = getAnchorLocalPosition(handle, selectedGuide.guideWidth, selectedGuide.guideHeight);
      const anchorGlobal = localToGlobal(anchorLocal.x, anchorLocal.y, selectedGuide);
      anchor = anchorGlobal;
      isResizing = true;
    } else {
      const w = selectedGuide.guideWidth;
      const h = selectedGuide.guideHeight;
      const cx = selectedGuide.offsetX + w / 2;
      const cy = selectedGuide.offsetY + h / 2;

      const cos = Math.cos(-selectedGuide.rotation);
      const sin = Math.sin(-selectedGuide.rotation);
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      const localX = dx * cos - dy * sin + w / 2;
      const localY = dx * sin + dy * cos + h / 2;

      if (localX >= 0 && localX <= w && localY >= 0 && localY <= h) {
        initialOffset = { x: selectedGuide.offsetX, y: selectedGuide.offsetY };
        isDragging = true;
      }
    }
  }

  function updateHoveredHandle(e: MouseEvent) {
    if (!selectedGuideId || !canvasRef || isDragging || isResizing || isRotating) {
      hoveredHandle = null;
      return;
    }

    const pos = getMousePosition(e);
    const selectedGuide = guides.find(g => g.id === selectedGuideId);
    if (!selectedGuide) {
      hoveredHandle = null;
      return;
    }

    const handle = getHandleAtPosition(pos.x, pos.y, selectedGuide, getCanvasScale());
    if (handle) {
      hoveredHandle = handle;
    } else {
      const w = selectedGuide.guideWidth;
      const h = selectedGuide.guideHeight;
      const cx = selectedGuide.offsetX + w / 2;
      const cy = selectedGuide.offsetY + h / 2;

      const cos = Math.cos(-selectedGuide.rotation);
      const sin = Math.sin(-selectedGuide.rotation);
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      const localX = dx * cos - dy * sin + w / 2;
      const localY = dx * sin + dy * cos + h / 2;

      if (localX >= 0 && localX <= w && localY >= 0 && localY <= h) {
        hoveredHandle = 'move';
      } else {
        hoveredHandle = null;
      }
    }
  }

  function handleMouseMove(e: MouseEvent) {
    updateHoveredHandle(e);

    if ((!isDragging && !isResizing && !isRotating) || !selectedGuideId || !canvasRef) return;

    const currentPos = getMousePosition(e);
    const delta = {
      x: currentPos.x - dragStart.x,
      y: currentPos.y - dragStart.y
    };

    const selectedGuide = guides.find(g => g.id === selectedGuideId);
    if (!selectedGuide) return;

    if (isRotating) {
      const centerX = selectedGuide.offsetX + selectedGuide.guideWidth / 2;
      const centerY = selectedGuide.offsetY + selectedGuide.guideHeight / 2;

      const startAngle = Math.atan2(dragStart.y - centerY, dragStart.x - centerX);
      const currentAngle = Math.atan2(currentPos.y - centerY, currentPos.x - centerX);
      const deltaAngle = currentAngle - startAngle;

      const newGuides = guides.map(g => {
        if (g.id === selectedGuideId) {
          return {
            ...g,
            rotation: snapAngle(initialRotation + deltaAngle, snap)
          };
        }
        return g;
      });

      onGuidesChange(newGuides);
    } else if (isResizing && resizeHandle) {
      const localDelta = calculateLocalDelta(delta, selectedGuide.rotation);

      const newGuides = guides.map(g => {
        if (g.id !== selectedGuideId) return g;

        const result = calculateResize({
          handle: resizeHandle!,
          localDelta,
          initialSize,
          anchor,
          rotation: g.rotation
        });

        return { ...g, ...result };
      });

      onGuidesChange(newGuides);
    } else if (isDragging) {
      const newGuides = guides.map(g => {
        if (g.id === selectedGuideId) {
          return {
            ...g,
            offsetX: initialOffset.x + delta.x,
            offsetY: initialOffset.y + delta.y
          };
        }
        return g;
      });

      onGuidesChange(newGuides);
    }
  }

  function handleMouseUp() {
    isDragging = false;
    isResizing = false;
    isRotating = false;
    resizeHandle = null;
  }

  function getCursorStyle(): string {
    if (isDragging) return 'grabbing';
    if (isRotating) return 'crosshair';
    if (isResizing) {
      switch (resizeHandle) {
        case 'nw':
        case 'se':
          return 'nwse-resize';
        case 'ne':
        case 'sw':
          return 'nesw-resize';
        case 'n':
        case 's':
          return 'ns-resize';
        case 'e':
        case 'w':
          return 'ew-resize';
        default:
          return 'nwse-resize';
      }
    }

    if (hoveredHandle) {
      switch (hoveredHandle) {
        case 'rotate':
          return 'crosshair';
        case 'move':
          return 'move';
        case 'nw':
        case 'se':
          return 'nwse-resize';
        case 'ne':
        case 'sw':
          return 'nesw-resize';
        case 'n':
        case 's':
          return 'ns-resize';
        case 'e':
        case 'w':
          return 'ew-resize';
        default:
          return 'default';
      }
    }

    return 'default';
  }

  let cursorStyle = $derived(getCursorStyle());

  onMount(() => {
    calculateSectionSize();
    window.addEventListener('resize', calculateSectionSize);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('resize', calculateSectionSize);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  });

  $effect(() => {
    guides;
    canvasSize;
    render();
  });
</script>

<section>
  <canvas
    bind:this={canvasRef}
    width={canvasSize.width}
    height={canvasSize.height}
    style="width: {displayWidth}px; height: {displayHeight}px; cursor: {cursorStyle};"
    onmousedown={handleMouseDown}
  ></canvas>
</section>

<style>
  section {
    display: grid;
    flex: 1;
    place-items: center;
    min-width: 0;
    min-height: 0;
    background-color: hsl(0, 0%, 8%);
    overflow: hidden;
  }

  canvas {
    background-color: hsl(0, 0%, 15%);
    box-shadow: 0 0 0 1px hsl(0, 0%, 25%);
  }
</style>
