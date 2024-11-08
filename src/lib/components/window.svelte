<script lang="ts">
    import type { Snippet } from "svelte";
    import FileMenu from "./FileMenu.svelte";
    import { scale } from 'svelte/transition';
    import { onMount } from 'svelte';

    interface WindowProps {
        title: string;
        width: number;
        height: number;
        children: Snippet;
        undo: () => void;
        redo: () => void; 
        discord: () => void; 
    }

    let { title, width, height, children, undo, redo, discord }: WindowProps = $props();

    let windowPosition = $state({
        x: 0,
        y: 0
    });

    let dragStart = $state({ x: 0, y: 0 });
    let isDragging = $state(false);
    let fileMenuOpen = $state(false);
    let isLoaded = $state(false);

    onMount(() => {
        isLoaded = true;
    });

    $effect(() => {
        windowPosition = {
            x: Math.max(0, (window.innerWidth - width) / 2),
            y: Math.max(0, (window.innerHeight - height) / 2)
        };
    });

    function handleMouseDown(e: MouseEvent) {
        const target = e.target as Element;
        if (target.closest(".title-bar")) {
            isDragging = true;
            dragStart = {
                x: e.clientX - windowPosition.x,
                y: e.clientY - windowPosition.y,
            };
        }
    }

    function handleMouseMove(e: MouseEvent) {
        if (isDragging) {
            const newX = Math.max(
                0,
                Math.min(
                    window.innerWidth - width,
                    e.clientX - dragStart.x,
                ),
            );
            const newY = Math.max(
                0,
                Math.min(
                    window.innerHeight - height,
                    e.clientY - dragStart.y,
                ),
            );

            windowPosition = { x: newX, y: newY };
        }
    }

    function handleMouseUp() {
        isDragging = false;
    }

    function handleFileAction(event: CustomEvent) {
        const { id } = event.detail;
        fileMenuOpen = false;
    }
</script>

<svelte:window onmousemove={handleMouseMove} onmouseup={handleMouseUp} />

{#if isLoaded}
    <div
        class="window"
        style="left: {windowPosition.x}px; top: {windowPosition.y}px; width: {width}px; height: {height}px;"
        role="dialog"
        aria-labelledby="window"
        onmousedown={handleMouseDown}
        in:scale={{duration: 600, start: 0}}
    >
        <div class="title-bar">
            <span>{title}</span>
            <div class="window-controls">
                <button class="minimize win-cursor-default">_</button>
                <button class="maximize win-cursor-default">□</button>
                <button class="close win-cursor-default">×</button>
            </div>
        </div>
        <FileMenu
            isOpen={fileMenuOpen}
            on:action={handleFileAction}
            undo={undo}
            redo={redo}
            discord={discord}
        />
        <div class="content">
            {#if children}
                {@render children()}
            {/if}
        </div>
    </div>
{/if}

<style>
    .window {
        position: absolute;
        background-color: #fff;
        border: 2px solid #ffffff;
        border-right-color: #808080;
        border-bottom-color: #808080;
        box-shadow: 1px 1px 0 #000000;
        padding: 2px;
        user-select: none;
    }

    .title-bar {
        background-color: #7132F5;
        color: white;
        padding: 2px 4px;
        font-weight: bold;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'Pixelify Sans';
    }

    .window-controls {
        display: flex;
        gap: 2px;
    }

    .window-controls button {
        width: 16px;
        height: 14px;
        font-size: 10px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        border: 1px solid #ffffff;
        border-right-color: #808080;
        border-bottom-color: #808080;
    }

    .content {
        display: flex;
        gap: 4px;
        padding: 0;
        background-color: #fff;
        height: calc(100% - 58px);
    }
</style>
