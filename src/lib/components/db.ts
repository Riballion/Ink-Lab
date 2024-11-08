// db.ts

interface StorageOptions {
    compressionQuality: number;
    maxStates: number;
}

const DEFAULT_OPTIONS: StorageOptions = {
    compressionQuality: 0.6,
    maxStates: 30
};

const COMPRESSION_WORKER_CODE = `
    self.onmessage = async function(e) {
        const { dataUrl, quality } = e.data;
        
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const bitmap = await createImageBitmap(blob);
            
            let targetWidth = bitmap.width;
            let targetHeight = bitmap.height;
            
            if (bitmap.width > 2000 || bitmap.height > 2000) {
                const scale = 2000 / Math.max(bitmap.width, bitmap.height);
                targetWidth *= scale;
                targetHeight *= scale;
            }
            
            const canvas = new OffscreenCanvas(targetWidth, targetHeight);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
            
            const compressedBlob = await canvas.convertToBlob({
                type: 'image/webp',
                quality: quality
            });
            
            const reader = new FileReader();
            reader.readAsDataURL(compressedBlob);
            reader.onloadend = function() {
                self.postMessage({
                    success: true,
                    data: reader.result
                });
            };
        } catch (error) {
            self.postMessage({
                success: false,
                error: error.message
            });
        }
    };
`;

class StorageManager {
    private worker: Worker | null = null;
    private options: StorageOptions;
    private isBrowser: boolean;
    
    constructor(options: Partial<StorageOptions> = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.isBrowser = typeof window !== 'undefined';
        
        if (this.isBrowser) {
            this.initWorker();
        }
    }
    
    private initWorker() {
        if (!this.isBrowser) return;
        
        try {
            const blob = new Blob([COMPRESSION_WORKER_CODE], { type: 'application/javascript' });
            this.worker = new Worker(URL.createObjectURL(blob));
        } catch (error) {
            console.warn('Worker initialization failed:', error);
        }
    }
    
    private async compressImage(dataUrl: string): Promise<string> {
        if (!this.worker) {
            return dataUrl; // Fallback: uncompressed
        }
        
        return new Promise((resolve, reject) => {
            this.worker!.onmessage = (e) => {
                if (e.data.success) {
                    resolve(e.data.data);
                } else {
                    console.warn('Compression failed, using original:', e.data.error);
                    resolve(dataUrl); // Fallback bei Fehler
                }
            };
            
            this.worker!.postMessage({
                dataUrl,
                quality: this.options.compressionQuality
            });
        });
    }
    
    private saveChunks(key: string, data: string) {
        if (!this.isBrowser) return;
        
        try {
            const chunkSize = 512 * 1024;
            const chunks = Math.ceil(data.length / chunkSize);
            
            // Alte Chunks löschen
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const storageKey = localStorage.key(i);
                if (storageKey?.startsWith(`${key}_chunk_`)) {
                    localStorage.removeItem(storageKey);
                }
            }
            
            // Neue Chunks speichern
            for (let i = 0; i < chunks; i++) {
                const chunk = data.slice(i * chunkSize, (i + 1) * chunkSize);
                localStorage.setItem(`${key}_chunk_${i}`, chunk);
            }
            
            localStorage.setItem(`${key}_chunks`, chunks.toString());
        } catch (error) {
            console.warn('Failed to save chunks:', error);
        }
    }
    
    private loadChunks(key: string): string | null {
        if (!this.isBrowser) return null;
        
        try {
            const chunks = parseInt(localStorage.getItem(`${key}_chunks`) || '0');
            if (!chunks) return null;
            
            let data = '';
            for (let i = 0; i < chunks; i++) {
                const chunk = localStorage.getItem(`${key}_chunk_${i}`);
                if (chunk) {
                    data += chunk;
                }
            }
            
            return data;
        } catch (error) {
            console.warn('Failed to load chunks:', error);
            return null;
        }
    }
    
    async saveCanvasState(dataUrl: string): Promise<void> {
        if (!this.isBrowser) return;
        
        try {
            const compressedData = await this.compressImage(dataUrl);
            const timestamp = Date.now();
            const key = `canvas_state_${timestamp}`;
            
            this.saveChunks(key, compressedData);
            this.cleanupHistory();
            
            localStorage.setItem('canvas_current_version', timestamp.toString());
        } catch (error) {
            console.warn('Failed to save canvas state:', error);
        }
    }
    
    loadCanvasState(): string | null {
        if (!this.isBrowser) return null;
        
        try {
            const currentVersion = localStorage.getItem('canvas_current_version');
            if (!currentVersion) return null;
            
            return this.loadChunks(`canvas_state_${currentVersion}`);
        } catch (error) {
            console.warn('Failed to load canvas state:', error);
            return null;
        }
    }
    
    async saveToUndoStack(dataUrl: string): Promise<void> {
        if (!this.isBrowser) return;
        
        try {
            const compressedData = await this.compressImage(dataUrl);
            const timestamp = Date.now();
            
            const undoList = JSON.parse(localStorage.getItem('undo_stack') || '[]');
            undoList.push(timestamp);
            
            this.saveChunks(`undo_state_${timestamp}`, compressedData);
            localStorage.setItem('undo_stack', JSON.stringify(undoList));
            
            this.cleanupUndoStack();
        } catch (error) {
            console.warn('Failed to save to undo stack:', error);
        }
    }
    
    loadFromUndoStack(): string | null {
        if (!this.isBrowser) return null;
        
        try {
            const undoList = JSON.parse(localStorage.getItem('undo_stack') || '[]');
            if (undoList.length === 0) return null;
            
            const lastTimestamp = undoList[undoList.length - 1];
            return this.loadChunks(`undo_state_${lastTimestamp}`);
        } catch (error) {
            console.warn('Failed to load from undo stack:', error);
            return null;
        }
    }
    
    private cleanupHistory() {
        if (!this.isBrowser) return;
        
        try {
            const versions = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('canvas_state_')) {
                    const timestamp = parseInt(key.split('_')[2]);
                    versions.push(timestamp);
                }
            }
            
            versions.sort((a, b) => b - a);
            
            while (versions.length > this.options.maxStates) {
                const oldTimestamp = versions.pop();
                if (oldTimestamp) {
                    this.removeChunks(`canvas_state_${oldTimestamp}`);
                }
            }
        } catch (error) {
            console.warn('Failed to cleanup history:', error);
        }
    }
    
    private cleanupUndoStack() {
        if (!this.isBrowser) return;
        
        try {
            const undoList = JSON.parse(localStorage.getItem('undo_stack') || '[]');
            
            while (undoList.length > this.options.maxStates) {
                const oldTimestamp = undoList.shift();
                if (oldTimestamp) {
                    this.removeChunks(`undo_state_${oldTimestamp}`);
                }
            }
            
            localStorage.setItem('undo_stack', JSON.stringify(undoList));
        } catch (error) {
            console.warn('Failed to cleanup undo stack:', error);
        }
    }
    
    private removeChunks(key: string) {
        if (!this.isBrowser) return;
        
        try {
            const chunks = parseInt(localStorage.getItem(`${key}_chunks`) || '0');
            
            for (let i = 0; i < chunks; i++) {
                localStorage.removeItem(`${key}_chunk_${i}`);
            }
            
            localStorage.removeItem(`${key}_chunks`);
        } catch (error) {
            console.warn('Failed to remove chunks:', error);
        }
    }
    
    destroy() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
    }
}

// Singleton-Instanz
export const storage = new StorageManager();