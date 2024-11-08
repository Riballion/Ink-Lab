<script lang="ts">
    import { fly } from 'svelte/transition';
    import Icon from './icon.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        icon?: string;
        iconSize?: number;
        onclick?: () => void;
        children?: Snippet;
        open?: boolean;
        style?: string;
    }

    let {
        icon = '',
        iconSize = 16,
        onclick,
        children,
        open = $bindable(false),
        style = '',
    }: Props = $props();

    let dropdown = $state<HTMLDivElement>();
    let button = $state<HTMLButtonElement>();

    function handleClickOutside(event: MouseEvent) {
        if (
            open &&
            dropdown &&
            !dropdown.contains(event.target as Node) &&
            !button?.contains(event.target as Node)
        ) {
            open = false;
        }
    }

    function toggleOpen() {
        open = !open;
    }
</script>

<svelte:document onclick={handleClickOutside} />

{#if children}
    <button bind:this={button} onclick={onclick || toggleOpen}>
        <Icon {icon} size={iconSize} />
    </button>
{:else}
    <button bind:this={button} {onclick}>
        <Icon {icon} size={iconSize} />
    </button>
{/if}

{#if open && children}
    <div bind:this={dropdown} class="dd" {style} transition:fly={{ y: 10, duration: 400 }}>
        {@render children()}
    </div>
{/if}

<style>
    button {
        height: 28px;
        width: 28px;
        min-width: 28px;
        background-color: transparent;
        border: 1px solid transparent;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        border-radius: 4px;
        transition: all ease 400ms;
        opacity: 0.7;
    }

    button:hover {
        background-color: var(--5);
        border: 1px solid var(--6);
        box-shadow: var(--boxShadow);
        opacity: 1;
    }

    .dd {
        position: absolute;
        inset: 28px 0 auto auto;
        z-index: 10;
        padding: 8px;
        background-color: var(--3);
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        border-radius: 6px;
        border: 1px solid var(--4);
    }
</style>
