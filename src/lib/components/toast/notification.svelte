<script lang="ts">
    import { fly } from 'svelte/transition';
    import { spring } from 'svelte/motion';
    import Icon from '../icon.svelte';

    interface Props {
        message?: string;
        type?: 'success' | 'error' | 'info';
        duration?: number;
        onClose?: () => void;
        icon?: string;
    }

    let { message = '', type = 'info', duration = 3000, onClose, icon = '' }: Props = $props();

    let visible: boolean = $state(true);
    let x = spring(0, { stiffness: 0.1, damping: 0.25 });
    let isLongMessage: boolean = $state(false);

    function handleSwipe(event: TouchEvent) {
        const touch = event.changedTouches[0];
        const swipeThreshold = 100;

        if (touch.pageX - event.touches[0].pageX > swipeThreshold) {
            dismissNotification();
        }
    }

    function dismissNotification() {
        x.set(400);
        setTimeout(() => {
            visible = false;
            if (onClose) onClose();
        }, 300);
    }

    $effect(() => {
        const timer = setTimeout(dismissNotification, duration);
        return () => clearTimeout(timer);
    });

    $effect(() => {
        isLongMessage = message.split(' ').length > 12;
    });
</script>

{#if visible}
    <div
        class="notification"
        class:success={type === 'success'}
        class:error={type === 'error'}
        class:info={type === 'info'}
        class:long-message={isLongMessage}
        in:fly={{ x: -400, duration: 300 }}
        out:fly={{ x: 400, duration: 300 }}
        style="transform: translateX({$x}px);"
        ontouchstart={() => x.set(0)}
        ontouchmove={handleSwipe}
        ontouchend={() => x.set(0)}
    >
        {#if icon}
            <div class="icon-wrapper">
                <Icon {icon} size={16} />
            </div>
        {/if}
        <p>{message}</p>
    </div>
{/if}

<style>
    .notification {
        position: relative;
        padding: 12px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 100px;
        max-width: 500px;
        z-index: 1000;
        touch-action: pan-x;
        backdrop-filter: blur(12px) saturate(180%);
        -webkit-backdrop-filter: blur(12px) saturate(180%);
        font-size: 18px;
        font-family: 'Pixelify Sans', 'Segoe UI', Tahoma, sans-serif;
        text-transform: uppercase;
    }

    .notification.long-message {
        font-size: 12px;
    }

    .success {
        background-color: rgba(12, 171, 49, 1);
        color: #fff;
    }

    .error {
        background-color: rgba(244, 67, 54, 1);
        color: #fff;
    }

    .info {
        background-color: #7132F5;
        color: #fff;
    }

    .icon-wrapper {
        min-width: 32px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    p {
        margin: 0;
        padding-right: 20px;
    }

    :global(.notification .icon) {
        cursor: pointer;
    }
</style>
