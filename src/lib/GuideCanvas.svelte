<script lang="ts">
  import { onMount } from 'svelte';
  import type { Guide, CanvasSize } from './types';
  import { hslToString } from './types';

  interface Props {
    canvasSize: CanvasSize;
    guides: Guide[];
    selectedGuideId: string | null;
    onGuidesChange: (guides: Guide[]) => void;
    canvasRef?: HTMLCanvasElement | null;
  }

  let { canvasSize, guides, selectedGuideId, onGuidesChange, canvasRef = $bindable(null) }: Props = $props();

  let sectionWidth = $state(800);
  let sectionHeight = $state(600);
  let isDragging = $state(false);
  let isResizing = $state(false);
  let resizeHandle = $state<string | null>(null);
  let dragStartX = $state(0);
  let dragStartY = $state(0);
  let initialOffsetX = $state(0);
  let initialOffsetY = $state(0);
  let initialGuideWidth = $state(0);
  let initialGuideHeight = $state(0);

  type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

  const PHI = 1.618033988749895;
  const SIDEBAR_WIDTH = 321;

  function calculateSectionSize() {
    sectionWidth = window.innerWidth - SIDEBAR_WIDTH;
    sectionHeight = window.innerHeight;
  }

  let displayWidth = $derived.by(() => {
    const padding = 60;
    const availableWidth = sectionWidth - padding;
    const availableHeight = sectionHeight - padding;
    const scaleX = availableWidth / canvasSize.width;
    const scaleY = availableHeight / canvasSize.height;
    const scale = Math.min(scaleX, scaleY);
    return Math.max(1, Math.floor(canvasSize.width * scale));
  });

  let displayHeight = $derived.by(() => {
    const padding = 60;
    const availableWidth = sectionWidth - padding;
    const availableHeight = sectionHeight - padding;
    const scaleX = availableWidth / canvasSize.width;
    const scaleY = availableHeight / canvasSize.height;
    const scale = Math.min(scaleX, scaleY);
    return Math.max(1, Math.floor(canvasSize.height * scale));
  });

  function drawGuides() {
    if (!canvasRef) return;
    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    for (const guide of guides) {
      if (!guide.enabled) continue;

      const w = guide.guideWidth;
      const h = guide.guideHeight;

      ctx.save();
      ctx.translate(guide.offsetX, guide.offsetY);
      ctx.strokeStyle = hslToString(guide.color, guide.opacity);
      ctx.lineWidth = guide.lineWidth;

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

      ctx.restore();

      if (guide.id === selectedGuideId) {
        ctx.save();
        ctx.translate(guide.offsetX, guide.offsetY);
        drawSelectionBox(ctx, guide);
        ctx.restore();
      }
    }
  }

  function drawSelectionBox(ctx: CanvasRenderingContext2D, guide: Guide) {
    const w = guide.guideWidth;
    const h = guide.guideHeight;
    const scale = getCanvasScale();
    const adjustedLineWidth = Math.max(2, 3 / scale);
    const adjustedDash = Math.max(10, 15 / scale);
    const adjustedGap = Math.max(5, 8 / scale);
    const padding = Math.max(10, 15 / scale);
    const handleSize = Math.max(8, 12 / scale);

    ctx.strokeStyle = 'hsl(200, 70%, 50%)';
    ctx.lineWidth = adjustedLineWidth;
    ctx.setLineDash([adjustedDash, adjustedGap]);
    ctx.beginPath();
    ctx.rect(-padding, -padding, w + padding * 2, h + padding * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'hsl(200, 70%, 50%)';
    const handles: { type: HandleType; x: number; y: number }[] = [
      { type: 'nw', x: -padding, y: -padding },
      { type: 'n', x: w / 2, y: -padding },
      { type: 'ne', x: w + padding, y: -padding },
      { type: 'e', x: w + padding, y: h / 2 },
      { type: 'se', x: w + padding, y: h + padding },
      { type: 's', x: w / 2, y: h + padding },
      { type: 'sw', x: -padding, y: h + padding },
      { type: 'w', x: -padding, y: h / 2 }
    ];

    for (const handle of handles) {
      ctx.beginPath();
      ctx.rect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fill();
    }
  }

  function getHandleAtPosition(x: number, y: number, guide: Guide): HandleType | null {
    const w = guide.guideWidth;
    const h = guide.guideHeight;
    const scale = getCanvasScale();
    const padding = Math.max(10, 15 / scale);
    const handleSize = Math.max(8, 12 / scale);
    const hitArea = handleSize * 1.5;

    const handles: { type: HandleType; x: number; y: number }[] = [
      { type: 'nw', x: -padding, y: -padding },
      { type: 'n', x: w / 2, y: -padding },
      { type: 'ne', x: w + padding, y: -padding },
      { type: 'e', x: w + padding, y: h / 2 },
      { type: 'se', x: w + padding, y: h + padding },
      { type: 's', x: w / 2, y: h + padding },
      { type: 'sw', x: -padding, y: h + padding },
      { type: 'w', x: -padding, y: h / 2 }
    ];

    const localX = x - guide.offsetX;
    const localY = y - guide.offsetY;

    for (const handle of handles) {
      if (
        Math.abs(localX - handle.x) < hitArea &&
        Math.abs(localY - handle.y) < hitArea
      ) {
        return handle.type;
      }
    }

    return null;
  }

  function drawThirds(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(w / 3, 0);
    ctx.lineTo(w / 3, h);
    ctx.moveTo((2 * w) / 3, 0);
    ctx.lineTo((2 * w) / 3, h);
    ctx.moveTo(0, h / 3);
    ctx.lineTo(w, h / 3);
    ctx.moveTo(0, (2 * h) / 3);
    ctx.lineTo(w, (2 * h) / 3);
    ctx.stroke();
  }

  function drawGoldenRatio(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const v1 = w / PHI;
    const v2 = w - v1;
    const h1 = h / PHI;
    const h2 = h - h1;

    ctx.beginPath();
    ctx.moveTo(v2, 0);
    ctx.lineTo(v2, h);
    ctx.moveTo(v1, 0);
    ctx.lineTo(v1, h);
    ctx.moveTo(0, h2);
    ctx.lineTo(w, h2);
    ctx.moveTo(0, h1);
    ctx.lineTo(w, h1);
    ctx.stroke();
  }

  function drawDiagonal(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();
  }

  function drawCenter(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
  }

  function drawGoldenSpiral(ctx: CanvasRenderingContext2D, gw: number, gh: number, flip: 'none' | 'horizontal' | 'vertical' | 'both', showSquares: boolean) {
    let w = gw;
    let h = gh;
    const isPortrait = h > w;

    ctx.save();

    if (isPortrait) {
      ctx.translate(w, 0);
      ctx.rotate(Math.PI / 2);
      [w, h] = [h, w];
    }

    const flipH = flip === 'horizontal' || flip === 'both';
    const flipV = flip === 'vertical' || flip === 'both';

    if (flipH) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    if (flipV) {
      ctx.translate(0, h);
      ctx.scale(1, -1);
    }

    const shortSide = Math.min(w, h);
    const longSide = shortSide * PHI;
    const scale = shortSide;

    let squares: { x: number; y: number; size: number }[] = [];
    let currentW = longSide;
    let currentH = shortSide;
    let originX = 0;
    let originY = 0;

    for (let i = 0; i < 10; i++) {
      const squareSize = Math.min(currentW, currentH);
      const dir = i % 4;

      let sqX = originX;
      let sqY = originY;

      switch (dir) {
        case 0:
          sqX = originX;
          sqY = originY;
          originX += squareSize;
          currentW -= squareSize;
          break;
        case 1:
          sqX = originX;
          sqY = originY;
          originY += squareSize;
          currentH -= squareSize;
          break;
        case 2:
          sqX = originX + currentW - squareSize;
          sqY = originY;
          currentW -= squareSize;
          break;
        case 3:
          sqX = originX;
          sqY = originY + currentH - squareSize;
          currentH -= squareSize;
          break;
      }

      squares.push({ x: sqX, y: sqY, size: squareSize });
    }

    ctx.beginPath();

    for (let i = 0; i < squares.length; i++) {
      const sq = squares[i];
      const dir = i % 4;
      let cx: number, cy: number;
      let startAngle: number, endAngle: number;

      switch (dir) {
        case 0:
          cx = sq.x + sq.size;
          cy = sq.y + sq.size;
          startAngle = Math.PI;
          endAngle = Math.PI * 1.5;
          break;
        case 1:
          cx = sq.x;
          cy = sq.y + sq.size;
          startAngle = Math.PI * 1.5;
          endAngle = Math.PI * 2;
          break;
        case 2:
          cx = sq.x;
          cy = sq.y;
          startAngle = 0;
          endAngle = Math.PI * 0.5;
          break;
        case 3:
          cx = sq.x + sq.size;
          cy = sq.y;
          startAngle = Math.PI * 0.5;
          endAngle = Math.PI;
          break;
        default:
          cx = 0;
          cy = 0;
          startAngle = 0;
          endAngle = 0;
      }

      ctx.arc(cx, cy, sq.size, startAngle, endAngle);
    }

    ctx.stroke();

    if (showSquares) {
      ctx.beginPath();
      for (const sq of squares) {
        ctx.rect(sq.x, sq.y, sq.size, sq.size);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, cols: number, rows: number) {
    const cellW = w / cols;
    const cellH = h / rows;

    ctx.beginPath();

    for (let i = 1; i < cols; i++) {
      ctx.moveTo(cellW * i, 0);
      ctx.lineTo(cellW * i, h);
    }

    for (let i = 1; i < rows; i++) {
      ctx.moveTo(0, cellH * i);
      ctx.lineTo(w, cellH * i);
    }

    ctx.stroke();
  }

  function drawTriangle(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w / 2, 0);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w / 2, h);
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.stroke();
  }

  function drawRabatment(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const shortSide = Math.min(w, h);

    ctx.beginPath();

    if (w >= h) {
      ctx.moveTo(shortSide, 0);
      ctx.lineTo(shortSide, h);
      ctx.moveTo(w - shortSide, 0);
      ctx.lineTo(w - shortSide, h);
    } else {
      ctx.moveTo(0, shortSide);
      ctx.lineTo(w, shortSide);
      ctx.moveTo(0, h - shortSide);
      ctx.lineTo(w, h - shortSide);
    }

    ctx.stroke();
  }

  function drawHarmonic(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);

    const diagLen = Math.sqrt(w * w + h * h);
    const perpX = h / diagLen;
    const perpY = w / diagLen;

    ctx.moveTo(0, h);
    ctx.lineTo(w * perpX * perpX, h - w * perpX * perpY);
    ctx.moveTo(w, h);
    ctx.lineTo(w - w * perpX * perpX, h - w * perpX * perpY);
    ctx.moveTo(0, 0);
    ctx.lineTo(w * perpX * perpX, w * perpX * perpY);
    ctx.moveTo(w, 0);
    ctx.lineTo(w - w * perpX * perpX, w * perpX * perpY);

    ctx.stroke();
  }

  function getCanvasScale(): number {
    const padding = 60;
    const availableWidth = sectionWidth - padding;
    const availableHeight = sectionHeight - padding;
    const scaleX = availableWidth / canvasSize.width;
    const scaleY = availableHeight / canvasSize.height;
    return Math.min(scaleX, scaleY);
  }

  function handleMouseDown(e: MouseEvent) {
    if (!selectedGuideId || !canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const scale = getCanvasScale();

    dragStartX = (e.clientX - rect.left) / scale;
    dragStartY = (e.clientY - rect.top) / scale;

    const selectedGuide = guides.find(g => g.id === selectedGuideId);
    if (!selectedGuide) return;

    const handle = getHandleAtPosition(dragStartX, dragStartY, selectedGuide);

    if (handle) {
      resizeHandle = handle;
      initialGuideWidth = selectedGuide.guideWidth;
      initialGuideHeight = selectedGuide.guideHeight;
      initialOffsetX = selectedGuide.offsetX;
      initialOffsetY = selectedGuide.offsetY;
      isResizing = true;
    } else {
      initialOffsetX = selectedGuide.offsetX;
      initialOffsetY = selectedGuide.offsetY;
      isDragging = true;
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if ((!isDragging && !isResizing) || !selectedGuideId || !canvasRef) return;

    const rect = canvasRef.getBoundingClientRect();
    const scale = getCanvasScale();

    const currentX = (e.clientX - rect.left) / scale;
    const currentY = (e.clientY - rect.top) / scale;

    const deltaX = currentX - dragStartX;
    const deltaY = currentY - dragStartY;

    if (isResizing && resizeHandle) {
      const minSize = 100;

      const newGuides = guides.map(g => {
        if (g.id !== selectedGuideId) return g;

        let newGuideWidth = initialGuideWidth;
        let newGuideHeight = initialGuideHeight;
        let newOffsetX = initialOffsetX;
        let newOffsetY = initialOffsetY;

        switch (resizeHandle) {
          case 'e':
            newGuideWidth = Math.max(minSize, initialGuideWidth + deltaX);
            break;
          case 'w':
            newGuideWidth = Math.max(minSize, initialGuideWidth - deltaX);
            newOffsetX = initialOffsetX + (initialGuideWidth - newGuideWidth);
            break;
          case 's':
            newGuideHeight = Math.max(minSize, initialGuideHeight + deltaY);
            break;
          case 'n':
            newGuideHeight = Math.max(minSize, initialGuideHeight - deltaY);
            newOffsetY = initialOffsetY + (initialGuideHeight - newGuideHeight);
            break;
          case 'se':
            newGuideWidth = Math.max(minSize, initialGuideWidth + deltaX);
            newGuideHeight = Math.max(minSize, initialGuideHeight + deltaY);
            break;
          case 'sw':
            newGuideWidth = Math.max(minSize, initialGuideWidth - deltaX);
            newGuideHeight = Math.max(minSize, initialGuideHeight + deltaY);
            newOffsetX = initialOffsetX + (initialGuideWidth - newGuideWidth);
            break;
          case 'ne':
            newGuideWidth = Math.max(minSize, initialGuideWidth + deltaX);
            newGuideHeight = Math.max(minSize, initialGuideHeight - deltaY);
            newOffsetY = initialOffsetY + (initialGuideHeight - newGuideHeight);
            break;
          case 'nw':
            newGuideWidth = Math.max(minSize, initialGuideWidth - deltaX);
            newGuideHeight = Math.max(minSize, initialGuideHeight - deltaY);
            newOffsetX = initialOffsetX + (initialGuideWidth - newGuideWidth);
            newOffsetY = initialOffsetY + (initialGuideHeight - newGuideHeight);
            break;
        }

        return {
          ...g,
          guideWidth: newGuideWidth,
          guideHeight: newGuideHeight,
          offsetX: newOffsetX,
          offsetY: newOffsetY
        };
      });

      onGuidesChange(newGuides);
    } else if (isDragging) {
      const newGuides = guides.map(g => {
        if (g.id === selectedGuideId) {
          return {
            ...g,
            offsetX: initialOffsetX + deltaX,
            offsetY: initialOffsetY + deltaY
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
    resizeHandle = null;
  }

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
    drawGuides();
  });
</script>

<section>
  <canvas
    bind:this={canvasRef}
    width={canvasSize.width}
    height={canvasSize.height}
    style="width: {displayWidth}px; height: {displayHeight}px;"
    onmousedown={handleMouseDown}
    class:dragging={isDragging}
    class:resizing={isResizing}
    class:selectable={selectedGuideId !== null}
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

  canvas.selectable {
    cursor: move;
  }

  canvas.dragging {
    cursor: grabbing;
  }

  canvas.resizing {
    cursor: nwse-resize;
  }
</style>
