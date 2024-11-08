<script lang="ts">

    interface Props {
        selectedColor: string;
    }

    let { selectedColor = $bindable("") }: Props = $props();

    const colors = $state([
        "#FFFFFF",
        "#F0EFFF",
        "#E0E0F3",
        "#AA9AD7",
        "#7853CD",
        "#6630D9",
        "#2B1463",
        "#190941",
        "#201929",
        "#160F1F",
        "#000000"
    ]);

</script>

<div class="color-palette">
    {#each colors as color}
        <div
            class="color-swatch"
            style="background-color: {color}"
            class:selected={selectedColor === color}
            onclick={() => selectedColor = color}
            onkeypress={() => selectedColor = color}
            role="button"
            tabindex="0"
        ></div>
    {/each}
</div>

<style>
    .color-palette {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: 2px;
        padding: 6px 0;
        background: #fff;
    }

    .color-swatch {
        width: 20px;
        height: 20px;
        border: 1px solid #808080;
        cursor: pointer;
    }

    .color-swatch.selected {
        border: 2px solid white;
        outline: 1px solid black;
    }
</style>
