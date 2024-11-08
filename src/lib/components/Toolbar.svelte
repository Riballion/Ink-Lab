<script lang="ts">
    interface Props {
        selectedTool: string;
    }

    let { selectedTool = $bindable("") }: Props = $props();

    const tools = $state([
        { id: "pencil", name: "Pencil", img: "pencil" },
        { id: "eraser", name: "Eraser", img: "eraser" },
        { id: "fill", name: "Fill", img: "fill" },
        { id: "brush", name: "Brush", img: "brush" },
        { id: "airbrush", name: "Airbrush", img: "airbrush" },
        { id: "splash", name: "Splash", img: "splash" },
        { id: "rectangle", name: "Rectangle", img: "rectangle" },
        { id: "roundRect", name: "Rounded Rectangle", img: "rectangle-rounded" },
        { id: "circle", name: "Ellipse", img: "circle" },
        { id: "polygon", name: "Polygon", img: "polygon" },
        { id: "line", name: "Line", img: "line" },
        { id: "pepe", name: "Pepe", img: "pepe" },
        { id: "doge", name: "Doge", img: "doge" },
        { id: "ink", name: "INK", img: "ink" },
        // { id: "ascii", name: "ascii", img: "ascii" },
    ]);

    $inspect(selectedTool)

    let toolTipText = $state("");
    let toolTipVisible = $state(false);
    let toolTipPosition = $state({ x: 0, y: 0 });

    function showTooltip(event: MouseEvent, name: string) {
        toolTipText = name;
        toolTipVisible = true;
        toolTipPosition = {
            x: event.clientX + 10,
            y: event.clientY + 10,
        };
    }

    function hideTooltip() {
        toolTipVisible = false;
    }

    function selectTool(id: string) {
        selectedTool = id;
    }
</script>

<div class="toolbar">
    <div class="tools-grid">
        {#each tools as tool}
            <button
                class:selected={selectedTool === tool.id}
                onclick={() => selectTool(tool.id)}
                onmouseenter={(e) => showTooltip(e, tool.name)}
                onmouseleave={hideTooltip}
            >
                <img src="../{tool.img}.svg" alt={tool.name} class="icon" />
            </button>
        {/each}
    </div>
    <img src="../ink-canva.svg" alt="Ink Canva" height="160" class="image">
    {#if toolTipVisible}
        <div
            class="tooltip"
            style="left: {toolTipPosition.x}px; top: {toolTipPosition.y}px;"
        >
            {toolTipText}
        </div>
    {/if}
</div>

<style>
    .toolbar {
        display: flex;
        flex-direction: column;
        padding: 2px;
        width: 64px;
    }

    .tools-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 2px;
    }

    button {
        width: 28px;
        height: 28px;
        padding: 2px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        border: none;
        background-color: transparent;
    }

    button:active,
    button.selected {
        background-color: #eee;
    }

    .icon {
        width: 16px;
        height: 16px;
    }

    .image {
        margin-top: auto;
        margin-bottom: -40px;
        margin-left: -5px;
    }

    .tooltip {
        position: fixed;
        background: #7132F5;
        border: 1px solid #7132F5;
        color: #fff;
        padding: 2px 4px;
        font-size: 11px;
        pointer-events: none;
        z-index: 1000;
        font-family: 'Pixelify Sans';
        text-transform: uppercase;
    }
</style>
