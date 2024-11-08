import { writable } from 'svelte/store';

interface SelectedArea {
    x: number;
    y: number;
    width: number;
    height: number;
    imageData?: ImageData;
}

export const currentColor = writable('#000000');
export const backgroundColor = writable('#ffffff');
export const currentTool = writable('pencil');
export const undoStack = writable<ImageData[]>([]);
export const redoStack = writable<ImageData[]>([]);
export const triggerUndo = writable<number>(0);
export const triggerRedo = writable<number>(0);
export const newCanvas = writable(false)

export const STORAGE_KEY = 'canvas_state';
export const UNDO_STACK_KEY = 'canvas_undo_stack';
export const REDO_STACK_KEY = 'canvas_redo_stack';
