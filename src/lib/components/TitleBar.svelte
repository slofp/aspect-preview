<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { IconMinus, IconSquare, IconX } from '@tabler/icons-svelte';

  const appWindow = getCurrentWindow();

  let isMaximized = $state(false);

  async function checkMaximized() {
    isMaximized = await appWindow.isMaximized();
  }

  async function handleMinimize() {
    await appWindow.minimize();
  }

  async function handleMaximize() {
    await appWindow.toggleMaximize();
    await checkMaximized();
  }

  async function handleClose() {
    await appWindow.close();
  }

  async function handleDragStart(e: MouseEvent) {
    if (e.button === 0) {
      await appWindow.startDragging();
    }
  }

  $effect(() => {
    checkMaximized();
  });
</script>

<header onmousedown={handleDragStart}>
  <span>Aspect Preview</span>
  <nav onmousedown={(e) => e.stopPropagation()}>
    <button type="button" onclick={handleMinimize} aria-label="最小化">
      <IconMinus size={14} />
    </button>
    <button type="button" onclick={handleMaximize} aria-label={isMaximized ? '元に戻す' : '最大化'}>
      <IconSquare size={12} />
    </button>
    <button type="button" class="close" onclick={handleClose} aria-label="閉じる">
      <IconX size={14} />
    </button>
  </nav>
</header>

<style>
  header {
    display: flex;
    flex-shrink: 0;
    position: relative;
    z-index: 100;
    align-items: center;
    justify-content: space-between;
    height: 28px;
    padding: 0 0 0 12px;
    background-color: hsl(0, 0%, 10%);
    border-bottom: 1px solid hsl(0, 0%, 18%);
    user-select: none;
    -webkit-app-region: drag;
    app-region: drag;
  }

  span {
    font-size: 0.8rem;
    font-weight: 500;
    color: hsl(0, 0%, 50%);
  }

  nav {
    display: flex;
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 28px;
    background-color: transparent;
    border: none;
    color: hsl(0, 0%, 60%);
    cursor: pointer;
    transition: background-color 150ms, color 150ms;
    -webkit-app-region: no-drag;
    app-region: no-drag;
  }

  button:hover {
    background-color: hsl(0, 0%, 20%);
    color: hsl(0, 0%, 90%);
  }

  button.close:hover {
    background-color: hsl(0, 70%, 45%);
    color: hsl(0, 0%, 100%);
  }
</style>
