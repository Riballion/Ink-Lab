declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
    }

    interface Window {
        UnicornStudio: {
            isInitialized: boolean;
            init: () => void;
        }
    }
}

export {};