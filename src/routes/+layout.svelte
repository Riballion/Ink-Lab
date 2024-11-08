<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        children: Snippet
    }

    let { children }: Props = $props();

    /*
    interface Window {
        UnicornStudio: {
            isInitialized: boolean;
            init: () => void;
        }
    }

    $effect(() => {
        (window as Window).UnicornStudio = {
            isInitialized: false,
            init: () => void 0
        };
        
        const script = document.createElement('script');
        script.src = 'https://cdn.unicorn.studio/v1.3.2/unicornStudio.umd.js';
        script.onload = () => {
            if (!window.UnicornStudio.isInitialized) {
                window.UnicornStudio.init();
                window.UnicornStudio.isInitialized = true;
            }
        };
        document.head.appendChild(script);

        data-us-project="zQUwabOz723Cf0k9JvPa"
    }); */
</script>

<div class="webgl"></div>

{#if children}
    {@render children()}
{/if}

<img src="../ink-bg.webp" alt="" class="bg">

<style>

    .bg {
        height: 100%;
        width: 100%;
        position: fixed;
        inset: 0;
        z-index: -1;
        object-fit: cover;
    }
</style>