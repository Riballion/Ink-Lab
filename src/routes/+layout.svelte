<script lang="ts">
    import type { Snippet } from "svelte";

    interface Props {
        children: Snippet
    }

    let { children }: Props = $props();

</script>

<div class="webgl"></div>

{#if children}
    {@render children()}
{/if}

<style>

    .webgl {
        position: fixed;
        inset: 0;
        height: 100%;
        width: 100%;
        background-image: url("./ink-bg.webp");
        background-size: cover;
        background-position: center center;
    }
</style>