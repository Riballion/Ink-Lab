<script lang="ts">
    import {
        currentColor,
        backgroundColor,
        currentTool,
        undoStack,
        redoStack,
        newCanvas,
        STORAGE_KEY,
        UNDO_STACK_KEY,
        REDO_STACK_KEY,
    } from "../store";

    interface Props {
        handleUndo: () => void;
        handleRedo: () => void;
        currentImage: string;
    }

    let {
        handleUndo = $bindable(() => {}),
        handleRedo = $bindable(() => {}),
        currentImage = $bindable(""),
    }: Props = $props();

    let width = $state(1155);
    let height = $state(385);

    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    let isDrawing = $state(false);
    let lastX = $state(0);
    let lastY = $state(0);
    let startX = $state(0);
    let startY = $state(0);
    let points = $state<{ x: number; y: number }[]>([]);
    let imageData = $state<ImageData | null>(null);
    let rightMouseDown = $state(false);
    let curvePoints = $state<{ x: number; y: number }[]>([]);
    let curveStep = $state(0);

    const HISTORY_KEY = "canvas_history";
    const MAX_HISTORY_STATES = 50;
    let saveTimeout: any;

    interface HistoryState {
        undoStack: string[];
        redoStack: string[];
        currentState: string;
        lastActiveState?: string;
    }

    $effect(() => {
        if (canvas && ctx) {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext("2d", {
                alpha: false,
                willReadFrequently: true,
            })!;

            tempCtx.drawImage(canvas, 0, 0);
            canvas.width = width;
            canvas.height = height;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(tempCanvas, 0, 0, width, height);

            if (
                canvas.toDataURL() !==
                document.createElement("canvas").toDataURL()
            ) {
                saveToLocalStorage();
            }

            const unsubscribe = newCanvas.subscribe((isNew) => {
                if (isNew) {
                    ctx.fillStyle = $backgroundColor;
                    ctx.fillRect(0, 0, width, height);
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(UNDO_STACK_KEY);
                    localStorage.removeItem(REDO_STACK_KEY);
                    undoStack.set([]);
                    redoStack.set([]);
                    newCanvas.set(false);
                    imageData = ctx.getImageData(0, 0, width, height);
                }
            });

            return () => {
                unsubscribe();
            };
        }
    });

    async function saveToLocalStorage() {
        if (!canvas || !ctx) return;

        try {
            const currentState = canvas.toDataURL();
            const undoDataUrls = await Promise.all(
                $undoStack.slice(-MAX_HISTORY_STATES).map(async (imageData) => {
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const tempCtx = tempCanvas.getContext("2d")!;
                    tempCtx.putImageData(imageData, 0, 0);
                    return await optimizeDataUrl(tempCanvas.toDataURL());
                }),
            );

            const redoDataUrls = await Promise.all(
                $redoStack.slice(-MAX_HISTORY_STATES).map(async (imageData) => {
                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = width;
                    tempCanvas.height = height;
                    const tempCtx = tempCanvas.getContext("2d")!;
                    tempCtx.putImageData(imageData, 0, 0);
                    return await optimizeDataUrl(tempCanvas.toDataURL());
                }),
            );

            const history: HistoryState = {
                undoStack: undoDataUrls,
                redoStack: redoDataUrls,
                currentState: currentState,
                lastActiveState: currentState,
            };

            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.warn("Failed to save history:", error);
            try {
                const currentState = canvas.toDataURL();
                localStorage.setItem(
                    HISTORY_KEY,
                    JSON.stringify({
                        undoStack: [],
                        redoStack: [],
                        currentState: currentState,
                        lastActiveState: currentState,
                    }),
                );
            } catch (e) {
                localStorage.removeItem(HISTORY_KEY);
            }
        }
    }

    async function restoreFromLocalStorage(): Promise<boolean> {
        if (!canvas || !ctx) return false;

        try {
            const historyJson = localStorage.getItem(HISTORY_KEY);
            if (!historyJson) return false;

            const history: HistoryState = JSON.parse(historyJson);

            if (history.lastActiveState) {
                const lastActiveImageData = await loadImageFromDataUrl(
                    history.lastActiveState,
                );
                ctx.putImageData(lastActiveImageData, 0, 0);
                imageData = lastActiveImageData;
            }

            const undoStates = await Promise.all(
                (history.undoStack || []).map((dataUrl) =>
                    loadImageFromDataUrl(dataUrl),
                ),
            );
            undoStack.set(undoStates);

            const redoStates = await Promise.all(
                (history.redoStack || []).map((dataUrl) =>
                    loadImageFromDataUrl(dataUrl),
                ),
            );
            redoStack.set(redoStates);

            return true;
        } catch (error) {
            console.warn("Failed to restore history:", error);
            localStorage.removeItem(HISTORY_KEY);
            return false;
        }
    }

    function loadImageFromDataUrl(dataUrl: string): Promise<ImageData> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext("2d")!;
                tempCtx.drawImage(img, 0, 0);
                resolve(tempCtx.getImageData(0, 0, width, height));
            };
            img.src = dataUrl;
        });
    }

    function saveState() {
        if (ctx) {
            const currentState = ctx.getImageData(0, 0, width, height);

            undoStack.update((stack) => {
                const newStack = [...stack, currentState];
                return newStack.slice(-MAX_HISTORY_STATES);
            });

            redoStack.set([]);

            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                saveToLocalStorage();
                updateCurrentImage();
            }, 500);
        }
    }

    function getCanvasCoordinates(e: MouseEvent) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = width / canvas.offsetWidth;
        const scaleY = height / canvas.offsetHeight;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        return {
            x: Math.round(x),
            y: Math.round(y),
        };
    }

    function initCanvas(node: HTMLCanvasElement) {
        canvas = node;
        ctx = node.getContext("2d", {
            alpha: false,
            willReadFrequently: true,
        })!;

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";

        ctx.imageSmoothingEnabled = false;
        ctx.fillStyle = $backgroundColor;
        ctx.fillRect(0, 0, width, height);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        void setupCanvas();
    }

    async function setupCanvas() {
        const restored = await restoreFromLocalStorage();

        if (!restored) {
            imageData = ctx.getImageData(0, 0, width, height);
            undoStack.set([imageData]);
            saveToLocalStorage();
        }

        updateCurrentImage();
    }

    function optimizeDataUrl(dataUrl: string, quality = 0.7): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext("2d")!;
                tempCtx.drawImage(img, 0, 0);
                resolve(tempCanvas.toDataURL("image/jpeg", quality));
            };
            img.src = dataUrl;
        });
    }

    function startDrawing(e: MouseEvent) {
        isDrawing = true;
        rightMouseDown = e.button === 2;
        const { x, y } = getCanvasCoordinates(e);
        [lastX, lastY] = [x, y];
        [startX, startY] = [x, y];

        imageData = ctx.getImageData(0, 0, width, height);

        switch ($currentTool) {
            case "pepe":
            case "doge":
            case "ink":
                loadSvg($currentTool, x, y);
                break;

            case "fill":
                floodFill(
                    x,
                    y,
                    rightMouseDown ? $backgroundColor : $currentColor,
                );
                saveState();
                break;

            case "curve":
                if (curveStep === 0) {
                    curvePoints = [{ x: startX, y: startY }];
                }
                break;

            case "polygon":
                if (points.length === 0) {
                    points = [{ x: startX, y: startY }];
                }
                break;
        }
    }

    function applyAscii() {
        if (!ctx || !imageData) return;

        const ASCII_CHARS =
            " .`-_':,;^=+/\"|)\\<>)iv%xclrs{*}I?!][1taeo7zjLunT#JCwfy325Fp6mqSghVd4EgXPGZbYkOA&8U$@KHDBWNMR0Q".split(
                "",
            );
        const charSize = 6;
        const fontScale = 1.2;

        const originalImageData = ctx.getImageData(0, 0, width, height);
        const data = originalImageData.data;

        const grayscaleData = new Uint8ClampedArray(data.length);
        for (let i = 0; i < data.length; i += 4) {
            const brightness =
                data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            grayscaleData[i] =
                grayscaleData[i + 1] =
                grayscaleData[i + 2] =
                    brightness;
            grayscaleData[i + 3] = data[i + 3];
        }

        ctx.fillStyle = $backgroundColor;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = $currentColor;
        ctx.font = `${charSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const cols = Math.floor(width / charSize);
        const rows = Math.floor(height / (charSize * fontScale));

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                let total = 0;
                let count = 0;
                let hasContent = false;

                const startX = x * charSize;
                const startY = y * charSize * fontScale;

                for (
                    let py = startY;
                    py < startY + charSize * fontScale && py < height;
                    py++
                ) {
                    for (
                        let px = startX;
                        px < startX + charSize && px < width;
                        px++
                    ) {
                        const pos =
                            (Math.floor(py) * width + Math.floor(px)) * 4;
                        const alpha = data[pos + 3];

                        if (alpha > 0) {
                            const brightness = grayscaleData[pos];
                            total += brightness;
                            count++;
                            hasContent = true;
                        }
                    }
                }

                if (hasContent) {
                    const avgBrightness = count > 0 ? total / count : 0;
                    const charIndex = Math.floor(
                        (avgBrightness / 255) * (ASCII_CHARS.length - 1),
                    );

                    ctx.fillText(
                        ASCII_CHARS[charIndex],
                        x * charSize + charSize / 2,
                        y * charSize * fontScale + (charSize * fontScale) / 2,
                    );
                }
            }
        }

        saveState();
    }

    function draw(e: MouseEvent) {
        if (!isDrawing) return;

        const { x, y } = getCanvasCoordinates(e);

        if (["pepe", "doge", "ink"].includes($currentTool)) {
            const dx = x - lastX;
            const dy = y - lastY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 35) {
                loadSvg($currentTool, x, y);
                [lastX, lastY] = [x, y];
            }
            return;
        }

        switch ($currentTool) {
            case "ascii":
                applyAscii();
                break;
            case "pencil":
                ctx.beginPath();
                ctx.strokeStyle = rightMouseDown
                    ? $backgroundColor
                    : $currentColor;
                ctx.lineWidth = 1;
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                break;

            case "brush":
                const brushSize = 8;
                const gradient = ctx.createRadialGradient(
                    x,
                    y,
                    0,
                    x,
                    y,
                    brushSize,
                );
                gradient.addColorStop(
                    0,
                    rightMouseDown ? `${$backgroundColor}` : `${$currentColor}`,
                );
                gradient.addColorStop(
                    0.05,
                    rightMouseDown ? `${$backgroundColor}` : `${$currentColor}`,
                );
                gradient.addColorStop(
                    1,
                    rightMouseDown
                        ? `${$backgroundColor}0D`
                        : `${$currentColor}0D`,
                );

                const dx = x - lastX;
                const dy = y - lastY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const steps = Math.max(Math.floor(distance), 1);

                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const currentX = lastX + dx * t;
                    const currentY = lastY + dy * t;

                    const color = rightMouseDown
                        ? $backgroundColor
                        : $currentColor;
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);

                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.05)`;
                    ctx.beginPath();
                    ctx.arc(currentX, currentY, brushSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case "airbrush":
                const density = 20;
                const radius = 10;
                ctx.fillStyle = rightMouseDown
                    ? $backgroundColor
                    : $currentColor;
                for (let i = 0; i < density; i++) {
                    const offsetX = (Math.random() - 0.5) * radius * 2;
                    const offsetY = (Math.random() - 0.5) * radius * 2;
                    if (
                        offsetX * offsetX + offsetY * offsetY <=
                        radius * radius
                    ) {
                        ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
                    }
                }
                break;

            case "splash":
                const splashConfig = {
                    minRadius: 1,
                    maxRadius: 30,
                    minDensity: 2,
                    maxDensity: 15,
                    minOpacity: 0.05,
                    maxOpacity: 0.6,
                    minDroplets: 1,
                    maxDroplets: 6,
                };

                const numDroplets = Math.floor(
                    Math.random() *
                        (splashConfig.maxDroplets - splashConfig.minDroplets) +
                        splashConfig.minDroplets,
                );

                for (let d = 0; d < numDroplets; d++) {
                    const dropX = x + (Math.random() - 0.5) * 30;
                    const dropY = y + (Math.random() - 0.5) * 30;

                    const radius =
                        Math.random() *
                            (splashConfig.maxRadius - splashConfig.minRadius) +
                        splashConfig.minRadius;
                    const density = Math.floor(
                        Math.random() *
                            (splashConfig.maxDensity -
                                splashConfig.minDensity) +
                            splashConfig.minDensity,
                    );
                    const opacity =
                        Math.random() *
                            (splashConfig.maxOpacity -
                                splashConfig.minOpacity) +
                        splashConfig.minOpacity;

                    const color = rightMouseDown
                        ? $backgroundColor
                        : $currentColor;
                    const rgba = color.startsWith("#")
                        ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`
                        : color;

                    ctx.fillStyle = rgba;

                    for (let i = 0; i < density; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const distance = Math.random() * radius;
                        const pointX = dropX + Math.cos(angle) * distance;
                        const pointY = dropY + Math.sin(angle) * distance;

                        const pointSize = Math.random() * 2 + 1;
                        ctx.beginPath();
                        ctx.arc(pointX, pointY, pointSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                break;

            case "eraser":
                ctx.beginPath();
                ctx.strokeStyle = rightMouseDown
                    ? $currentColor
                    : $backgroundColor;
                ctx.lineWidth = 20;
                ctx.lineCap = "square";
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.stroke();
                break;

            case "line":
                ctx.putImageData(imageData!, 0, 0);
                ctx.beginPath();
                ctx.strokeStyle = rightMouseDown
                    ? $backgroundColor
                    : $currentColor;
                ctx.lineWidth = 1;
                ctx.moveTo(startX, startY);

                if (e.shiftKey) {
                    const dx = x - startX;
                    const dy = y - startY;
                    const angle = Math.atan2(dy, dx);
                    const snappedAngle =
                        Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const endX = startX + distance * Math.cos(snappedAngle);
                    const endY = startY + distance * Math.sin(snappedAngle);
                    ctx.lineTo(endX, endY);
                } else {
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
                break;

            case "curve":
                ctx.putImageData(imageData!, 0, 0);
                ctx.beginPath();
                ctx.strokeStyle = rightMouseDown
                    ? $backgroundColor
                    : $currentColor;
                ctx.lineWidth = 1;

                if (curveStep === 0) {
                    ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
                    ctx.lineTo(x, y);
                } else if (curveStep === 1) {
                    const cp1 = { x, y };
                    ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
                    ctx.quadraticCurveTo(
                        cp1.x,
                        cp1.y,
                        curvePoints[1].x,
                        curvePoints[1].y,
                    );
                }
                ctx.stroke();
                break;

            case "rectangle":
            case "roundRect":
                ctx.putImageData(imageData!, 0, 0);
                const rectWidth = x - startX;
                const rectHeight = y - startY;

                if (e.shiftKey) {
                    const size = Math.min(
                        Math.abs(rectWidth),
                        Math.abs(rectHeight),
                    );
                    const signX = Math.sign(rectWidth);
                    const signY = Math.sign(rectHeight);

                    if ($currentTool === "roundRect") {
                        drawRoundedRect(
                            startX,
                            startY,
                            size * signX,
                            size * signY,
                        );
                    } else {
                        ctx.strokeStyle = rightMouseDown
                            ? $backgroundColor
                            : $currentColor;
                        ctx.strokeRect(
                            startX,
                            startY,
                            size * signX,
                            size * signY,
                        );
                    }
                } else {
                    if ($currentTool === "roundRect") {
                        drawRoundedRect(startX, startY, rectWidth, rectHeight);
                    } else {
                        ctx.strokeStyle = rightMouseDown
                            ? $backgroundColor
                            : $currentColor;
                        ctx.strokeRect(startX, startY, rectWidth, rectHeight);
                    }
                }
                break;

            case "circle":
                ctx.putImageData(imageData!, 0, 0);
                ctx.beginPath();
                ctx.strokeStyle = rightMouseDown
                    ? $backgroundColor
                    : $currentColor;

                if (e.shiftKey) {
                    const size = Math.min(
                        Math.abs(x - startX),
                        Math.abs(y - startY),
                    );
                    const centerX = startX + (Math.sign(x - startX) * size) / 2;
                    const centerY = startY + (Math.sign(y - startY) * size) / 2;
                    ctx.ellipse(
                        centerX,
                        centerY,
                        size / 2,
                        size / 2,
                        0,
                        0,
                        2 * Math.PI,
                    );
                } else {
                    const radiusX = Math.abs(x - startX) / 2;
                    const radiusY = Math.abs(y - startY) / 2;
                    const centerX = Math.min(startX, x) + radiusX;
                    const centerY = Math.min(startY, y) + radiusY;
                    ctx.ellipse(
                        centerX,
                        centerY,
                        radiusX,
                        radiusY,
                        0,
                        0,
                        2 * Math.PI,
                    );
                }
                ctx.stroke();
                break;

            case "polygon":
                ctx.putImageData(imageData!, 0, 0);
                ctx.beginPath();
                ctx.strokeStyle = rightMouseDown
                    ? $backgroundColor
                    : $currentColor;
                ctx.moveTo(points[0].x, points[0].y);

                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }

                ctx.lineTo(x, y);
                if (isNearStartPoint(x, y)) {
                    ctx.closePath();
                }
                ctx.stroke();
                break;
        }

        [lastX, lastY] = [x, y];
    }

    let pendingSave = false;

    async function loadSvg(
        toolId: string,
        x: number,
        y: number,
    ): Promise<void> {
        if (!ctx) return;

        try {
            const response = await fetch(`../${toolId}.svg`);
            const svgText = await response.text();

            const blob = new Blob([svgText], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);

            const img = new Image();
            img.onload = () => {
                const size = 70;
                const drawX = x - size / 2;
                const drawY = y - size / 2;

                ctx.drawImage(img, drawX, drawY, size, size);
                URL.revokeObjectURL(url);

                pendingSave = true;
                updateCurrentImage();
            };
            img.src = url;
        } catch (error) {
            console.error("Failed to load SVG:", error);
        }
    }

    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;

        if (
            ["pepe", "doge", "ink"].includes($currentTool) &&
            pendingSave
        ) {
            saveState();
            pendingSave = false;
        } else {
            switch ($currentTool) {
                case "curve":
                    if (curveStep === 0) {
                        curvePoints = [...curvePoints, { x: lastX, y: lastY }];
                        curveStep = 1;
                    } else {
                        curveStep = 0;
                        saveState();
                    }
                    break;

                case "polygon":
                    if (isNearStartPoint(lastX, lastY) && points.length > 2) {
                        ctx.beginPath();
                        ctx.strokeStyle = rightMouseDown
                            ? $backgroundColor
                            : $currentColor;
                        ctx.moveTo(points[0].x, points[0].y);
                        for (const point of points) {
                            ctx.lineTo(point.x, point.y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                        points = [];
                        saveState();
                    } else {
                        points = [...points, { x: lastX, y: lastY }];
                    }
                    break;

                default:
                    saveState();
                    break;
            }
        }

        imageData = ctx.getImageData(0, 0, width, height);
    }

    function isNearStartPoint(x: number, y: number): boolean {
        if (points.length === 0) return false;
        const dx = x - points[0].x;
        const dy = y - points[0].y;
        return Math.sqrt(dx * dx + dy * dy) < 5;
    }

    function drawRoundedRect(
        x: number,
        y: number,
        width: number,
        height: number,
    ) {
        const radius = Math.min(10, Math.abs(width) / 4, Math.abs(height) / 4);
        ctx.beginPath();
        ctx.strokeStyle = rightMouseDown ? $backgroundColor : $currentColor;

        const right = x + width;
        const bottom = y + height;
        const signX = Math.sign(width);
        const signY = Math.sign(height);

        ctx.moveTo(x + radius * signX, y);
        ctx.lineTo(right - radius * signX, y);
        ctx.quadraticCurveTo(right, y, right, y + radius * signY);
        ctx.lineTo(right, bottom - radius * signY);
        ctx.quadraticCurveTo(right, bottom, right - radius * signX, bottom);
        ctx.lineTo(x + radius * signX, bottom);
        ctx.quadraticCurveTo(x, bottom, x, bottom - radius * signY);
        ctx.lineTo(x, y + radius * signY);
        ctx.quadraticCurveTo(x, y, x + radius * signX, y);

        ctx.stroke();
    }

    function floodFill(startX: number, startY: number, fillColor: string) {
        startX = Math.floor(startX);
        startY = Math.floor(startY);

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        const startPos = (startY * width + startX) * 4;
        const targetR = pixels[startPos];
        const targetG = pixels[startPos + 1];
        const targetB = pixels[startPos + 2];
        const targetA = pixels[startPos + 3];

        const fillR = parseInt(fillColor.slice(1, 3), 16);
        const fillG = parseInt(fillColor.slice(3, 5), 16);
        const fillB = parseInt(fillColor.slice(5, 7), 16);
        const fillA = 255;

        if (
            targetR === fillR &&
            targetG === fillG &&
            targetB === fillB &&
            targetA === fillA
        ) {
            return;
        }

        function matchesTarget(pos: number): boolean {
            return (
                pixels[pos] === targetR &&
                pixels[pos + 1] === targetG &&
                pixels[pos + 2] === targetB &&
                pixels[pos + 3] === targetA
            );
        }

        function setPixel(pos: number) {
            pixels[pos] = fillR;
            pixels[pos + 1] = fillG;
            pixels[pos + 2] = fillB;
            pixels[pos + 3] = fillA;
        }

        const queue: [number, number][] = [[startX, startY]];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const [x, y] = queue.shift()!;
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (x < 0 || x >= width || y < 0 || y >= height) continue;

            const pos = (y * width + x) * 4;

            if (!matchesTarget(pos)) continue;

            visited.add(key);
            setPixel(pos);

            queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    function handleContextMenu(e: MouseEvent) {
        e.preventDefault();
    }

    function updateCurrentImage() {
        if (canvas) {
            currentImage = canvas.toDataURL();
        }
    }

    $effect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "z") {
                undo();
            } else if (e.ctrlKey && e.key === "y") {
                redo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    function undo() {
        const stack = $undoStack;
        if (stack.length <= 1) return;

        const currentState = stack[stack.length - 1];
        const previousState = stack[stack.length - 2];

        undoStack.update((s) => s.slice(0, -1));
        redoStack.update((s) => [...s, currentState]);

        ctx.putImageData(previousState, 0, 0);
        imageData = ctx.getImageData(0, 0, width, height);
        saveToLocalStorage();
        updateCurrentImage();
    }

    function redo() {
        const stack = $redoStack;
        if (stack.length === 0) return;

        const nextState = stack[stack.length - 1];
        redoStack.update((s) => s.slice(0, -1));
        undoStack.update((s) => [...s, nextState]);

        ctx.putImageData(nextState, 0, 0);
        imageData = ctx.getImageData(0, 0, width, height);
        saveToLocalStorage();
        updateCurrentImage();
    }

    $effect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    $effect(() => {
        handleUndo = undo;
        handleRedo = redo;
    });
</script>

<canvas
    bind:this={canvas}
    {width}
    {height}
    onmousedown={startDrawing}
    onmousemove={draw}
    onmouseup={stopDrawing}
    onmouseleave={stopDrawing}
    oncontextmenu={handleContextMenu}
    class="tool-{$currentTool}"
    use:initCanvas
></canvas>

<style>
    canvas {
        display: block;
        background: #7853cd;
        border: 1px solid #808080;
        image-rendering: pixelated;
        image-rendering: crisp-edges;
        -webkit-image-rendering: pixelated;
        -moz-image-rendering: crisp-edges;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
    }
</style>
