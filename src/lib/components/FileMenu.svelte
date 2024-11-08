<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { newCanvas } from "../store";
    import { toasts } from "$lib/components/toast/store";

    interface Props {
        isOpen: boolean;
        undo: () => void;
        redo: () => void;
        discord: () => void
    }

    let { isOpen, undo, redo, discord }: Props = $props();

    const dispatch = createEventDispatcher<{
        action: { id: string };
    }>();

    function handleClick(id: string) {
        dispatch("action", { id });
        isOpen = false;
    }

    function handleMouseLeave() {
        setTimeout(() => {
            isOpen = false;
        }, 500);
    }

    function toggleMenu() {
        isOpen = !isOpen;
    }

    function justForNow() {
        toasts.add({
            type: 'error',
            message: 'Nop, not yet',
            duration: 3000
        });
    }

</script>

<div class="menu-bar win-cursor-default">
    {#if isOpen}
        <div
            class="menu win-cursor-default"
            onmouseleave={handleMouseLeave}
            role="menu"
            tabindex="0"
        >
            <button
                class="menu-item win-cursor-default"
                onclick={() => {
                    newCanvas.set(true);
                }}
            >
                <span>NEW</span>
                <span class="shortcut">Ctrl+N</span>
            </button>
            <button
                class="menu-item win-cursor-default"
                onclick={justForNow}
            >
                <span>SUBMIT TO DISCORD</span>
                <span class="shortcut">Ctrl+S</span>
            </button>
            <div class="separator"></div>
            <button
                class="menu-item win-cursor-default"
                onclick={undo}
            >
                <span>UNDO</span>
                <span class="shortcut">Ctrl+Z</span>
            </button>
            <button
                class="menu-item win-cursor-default"
                onclick={redo}
            >
                <span>REDO</span>
                <span class="shortcut">Ctrl+Y</span>
            </button>
            <div class="separator"></div>
            <button
                class="menu-item win-cursor-default"
                onclick={() => handleClick("exit")}
            >
                <span>EXIT</span>
            </button>
        </div>
    {/if}
    <span
        class="menu-item-top"
        onclick={toggleMenu}
        onkeydown={(e) => e.key === "Enter" && toggleMenu()}
        role="menuitem"
        tabindex="0">FILE</span
    >
    <span class="menu-item-top">WHAT IS INK?</span>
    <span class="menu-item-top">SUPERCHAIN</span>
    <span class="menu-item-top">FOLLOW ON X</span>
</div>

<style>
    .menu-bar {
        background-color: #fff;
        padding: 4px;
        display: flex;
        gap: 32px;
        position: relative;
        color: #7132F5;
    }

    .menu-item-top {
        cursor: pointer;
        padding: 2px 4px;
        font-family: 'Pixelify Sans';
    }

    .menu-item-top:hover {
        background: #7132F5;
        color: white;
    }

    .menu {
        position: absolute;
        top: 100%;
        left: 4px;
        background: #fff;
        border: 1px solid #808080;
        border-top: 1px solid #ffffff;
        border-left: 1px solid #ffffff;
        padding: 2px;
        min-width: 180px;
        z-index: 1000;
    }

    .menu-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 4px 8px;
        text-align: left;
        background: transparent;
        border: none;
        font-size: 16px;
        font-family: 'Pixelify Sans';
        color: #7132F5;
    }

    .menu-item:hover:not(:disabled) {
        background: #7132F5;
        color: white;
    }

    .menu-item:disabled {
        color: #808080;
        cursor: default;
    }

    .shortcut {
        color: #808080;
        margin-left: 20px;
    }

    .menu-item:hover:not(:disabled) .shortcut {
        color: white;
    }

    .separator {
        height: 1px;
        background: #808080;
        margin: 2px 0;
    }
</style>
