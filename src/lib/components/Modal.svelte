<script lang="ts">
    interface Props {
        imageUrl: string;
        text: string;
        xHandle: string;
        onSubmit: () => void;
        onClose: () => void;
    }

    let { 
        imageUrl = "", 
        text = $bindable(""),
        xHandle = $bindable(""),
        onSubmit = () => {},
        onClose = () => {}
    }: Props = $props();


    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            onClose();
        }
    }

    function handleSubmit() {
        onSubmit();
        onClose();
    }
</script>


<div class="modal">
    <div class="modal-backdrop" onclick={onClose}></div>
    <div class="modal-content">
        <div class="modal-header">
            <h2 class="modal-title">Submit to Discord</h2>
            <button class="close-button" onclick={onClose}>×</button>
        </div>

        <p class="text">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        
        <div class="modal-body">
            {#if imageUrl}
                <img src={imageUrl} alt="Preview" class="preview-image" />
            {/if}
            
            <div class="text-input">
                <input
                    type="text"
                    bind:value={xHandle}
                    placeholder="Your X-Handle"
                    class="x-handle-input"
                />
                <textarea
                    bind:value={text}
                    placeholder="Your Message"
                    onkeydown={handleKeydown}
                    rows="4"
                    class="text-field"
                ></textarea>
                <button class="submit-button" onclick={handleSubmit}>
                    Submit
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .modal {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 0;
        backdrop-filter: blur(8px);
    }

    .modal-content {
        background: white;
        padding: 24px;
        border-radius: 12px;
        position: relative;
        max-width: 550px;
        width: 95%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(113, 50, 245, 0.1);
        position: relative;
        z-index: 10;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        border-bottom: 2px solid rgba(113, 50, 245, 0.1);
        padding-bottom: 12px;
    }

    .modal-title {
        margin: 0;
        font-family: 'Pixelify Sans';
        color: #7132F5;
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: 0.5px;
    }

    .text {
        font-family: Arial, Helvetica, sans-serif;
        margin: 0 0 16px 0;
        line-height: 1.5;
        color: #444;
    }

    .close-button {
        position: static;
        border: none;
        background: none;
        font-size: 28px;
        cursor: pointer;
        color: #7132F5;
    }

    .modal-body {
        margin: 0;
    }

    .preview-image {
        max-width: 100%;
        height: auto;
        margin-bottom: 24px;
        border-radius: 8px;
        border: 2px solid #7132F5;
        box-shadow: 0 2px 8px rgba(113, 50, 245, 0.2);
    }

    .text-input {
        display: flex;
        justify-content: stretch;
        align-items: stretch;
        flex-direction: column;
        gap: 16px;
    }

    .x-handle-input {
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
        font-family: Arial, sans-serif;
        transition: border-color 0.2s ease;
    }

    .x-handle-input:focus {
        outline: none;
        border-color: #7132F5;
        box-shadow: 0 0 0 3px rgba(113, 50, 245, 0.1);
    }

    .text-input textarea {
        flex: 1;
        padding: 12px;
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        font-size: 1rem;
        resize: vertical;
        min-height: 100px;
        transition: border-color 0.2s ease;
        font-family: Arial, sans-serif;
    }

    .text-input textarea:focus {
        outline: none;
        border-color: #7132F5;
        box-shadow: 0 0 0 3px rgba(113, 50, 245, 0.1);
    }

    .submit-button {
        padding: 12px 24px;
        background-color: #7132F5;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .submit-button:hover {
        background-color: #5a28c4;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(90, 40, 196, 0.3);
    }

    .submit-button:active {
        transform: translateY(0);
        box-shadow: none;
    }
</style>
