<script lang="ts">
    import { toasts, type ToastMessage } from './store';
    import Notification from './notification.svelte';
    import { flip } from 'svelte/animate';

    let toastList: ToastMessage[] = $state([]);

    $effect(() => {
        toastList = $toasts;
    });

    function removeToast(id: number) {
        toasts.remove(id);
    }
</script>

<div class="wrapper">
    {#each toastList as toast (toast.id)}
        <div animate:flip={{ duration: 300 }}>
            <Notification
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={() => removeToast(toast.id)}
                icon={toast.icon}
            />
        </div>
    {/each}
</div>

<style>
    .wrapper {
        position: fixed;
        inset: 20px 20px auto auto;
        z-index: 100;
        display: flex;
        justify-content: flex-start;
        align-items: flex-end;
        flex-direction: column;
        gap: 12px;
    }
</style>
