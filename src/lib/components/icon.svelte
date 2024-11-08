<script lang="ts">
    interface Props {
        icon?: string;
        size?: number;
        width?: number;
        style?: string;
        color?: string;
        pointer?: boolean;
        src?: string;
        class?: string;
        onclick?: (event: MouseEvent) => void;
        onkeypress?: (event: KeyboardEvent) => void;
    }

    let {
        icon = '',
        size = 12,
        width = 20,
        style = '',
        color = '',
        pointer = false,
        src = 'sprite',
        class: className = '',
        onclick,
        onkeypress,
    }: Props = $props();
</script>

<svg
    height={size}
    width={width ? width : size}
    {onclick}
    {onkeypress}
    {style}
    style:color="{color ? color : 'currentColor'};"
    class:pointer
    class={className}
    role="img"
    aria-label={icon}
    aria-hidden={icon ? false : true}
>
    <use xlink:href="./{src}.svg#{icon}" style="color: {color ? color : 'currentColor'}"></use>
</svg>

<style>
    svg {
        display: block;
        position: relative;
        cursor: pointer;
        pointer-events: none;
        transition: none;
        transition: transform 200ms ease;
    }

    use {
        transition: none;
    }

    svg.pointer {
        pointer-events: all;
    }
</style>
