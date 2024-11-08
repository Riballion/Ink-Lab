import { writable } from 'svelte/store';

export interface ToastMessage {
    id: number;
    message?: string;
    type?: 'success' | 'error' | 'info';
    duration?: number;
    icon?: string;
}

function createToastStore() {
    const { subscribe, update } = writable<ToastMessage[]>([]);
    let nextId = 0;

    const remove = (id: number) => {
        update((toasts) => toasts.filter((toast) => toast.id !== id));
    };

    return {
        subscribe,
        add: (options: Omit<ToastMessage, 'id'>) => {
            const id = nextId++;
            const toast: ToastMessage = {
                id,
                message: options.message ?? '',
                type: options.type || 'info',
                duration: options.duration || 6000,
                icon: options.icon,
            };
            update((toasts) => [...toasts, toast]);
            setTimeout(() => {
                remove(id);
            }, toast.duration);
        },
        remove,
        clear: () => {
            update(() => []);
        },
    };
}

export const toasts = createToastStore();
