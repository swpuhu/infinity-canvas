<template>
    <div class="app">
        <div class="editor-container">
            <div class="toolbar">
                <div class="toolbar-head">
                    <UButton type="primary" @click="handleSave">保存</UButton>
                    <UButton
                        type="primary"
                        @click="handleAddText"
                        :selected="uiStore.willAddText"
                        >添加文字</UButton
                    >
                </div>
                <div class="toolbar-right">
                    <!-- 右侧工具按钮预留位置 -->
                </div>
            </div>
            <div class="canvas-container">
                <canvas ref="canvasRef"></canvas>
                <ZoomControls
                    ref="zoomControlsRef"
                    @zoom-value-change="handleZoomValueChange"
                    @hand-tool-change="handleHandToolChange"
                    @canvas-drag="handleCanvasDrag"
                    @canvas-drag-start="handleCanvasDragStart"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { Vec2 } from './common/Vec2';
import eventBus from './common/eventBus';
import { IPoint } from './common/types';
import { isCtrlKey } from './common/util';
import UButton from './components/UButton.vue';
import ZoomControls from './components/ZoomControls.vue';
import { CanvasEditor } from './renderer/Editor';
import { useEditorModeStore } from './store/EditorModeStore';
import { useUIStore } from './store/UIStore';
import { useZoomStore } from './store/ZoomStore';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const zoomControlsRef = ref<InstanceType<typeof ZoomControls> | null>(null);

const uiStore = useUIStore();
const zoomStore = useZoomStore();
const editorModeStore = useEditorModeStore();

let editor: CanvasEditor | null = null;
onMounted(async () => {
    try {
        const canvasEle = canvasRef.value!;
        // canvasEle.width = window.innerWidth;
        // canvasEle.height = window.innerHeight;
        editor = new CanvasEditor(canvasEle);
        await editor.init();

        // Initialize zoom functionality
        initZoomFunctionality();
    } catch (error) {
        console.error('应用启动失败:', error);
    }
});

onUnmounted(() => {
    editor?.destroy();
    editor = null;
});

// Initialize zoom functionality
function initZoomFunctionality() {
    if (!editor) return;

    // Add wheel event listener for zooming with Ctrl+Wheel
    canvasRef.value?.addEventListener('wheel', handleWheel, { passive: false });

    // Set initial zoom value
    zoomStore.resetZoom();
    zoomControlsRef.value?.setZoomValue(0); // 0 corresponds to 100% scale
}

// Handle wheel events for zooming
function handleWheel(event: WheelEvent) {
    // If hand tool is active, don't zoom
    if (editorModeStore.isHandToolMode) return;

    if (isCtrlKey(event)) {
        event.preventDefault();

        // Get mouse position relative to the canvas
        const rect = canvasRef.value!.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Store the old zoom value
        const oldZoomValue = zoomStore.zoomValue;

        // Update zoom value in the store
        if (event.deltaY < 0) {
            zoomStore.zoomIn();
        } else {
            zoomStore.zoomOut();
        }

        // Apply zoom centered around mouse position
        applyZoomWithCenter(mouseX, mouseY);
    }
}

// Handle zoom value change from the ZoomControls component
function handleZoomValueChange(value: number) {
    zoomStore.setZoomValue(value);
    applyZoom();
}

// Apply zoom to the canvas (without specifying a center point)
function applyZoom() {
    if (!editor) return;

    // Use the editor's setZoomValue method to apply the zoom
    editor.setZoomValue(zoomStore.zoomValue);

    // Update the zoom controls display
    zoomControlsRef.value?.setZoomValue(zoomStore.zoomValue);
}

// Apply zoom to the canvas with a specific center point
function applyZoomWithCenter(centerX: number, centerY: number) {
    if (!editor) return;

    // Use the editor's setZoomValue method to apply the zoom centered around the specified point
    editor.setZoomValue(zoomStore.zoomValue, centerX, centerY);

    // Update the zoom controls display
    zoomControlsRef.value?.setZoomValue(zoomStore.zoomValue);
}

// Handle hand tool mode change
function handleHandToolChange(active: boolean) {
    // Update the editor mode store
    editorModeStore.setHandToolActive(active);

    // Update the ZoomControls component state if needed
    if (zoomControlsRef.value) {
        zoomControlsRef.value.setHandToolActive(active);
    }
}

let editorStartPos: IPoint = new Vec2(0);

function handleCanvasDragStart(startPos: { x: number; y: number }) {
    if (!editor || !editorModeStore.isHandToolMode) return;

    // Get the current canvas position
    editorStartPos = editor.getCanvasPosition().clone();
}

// Handle canvas drag event
function handleCanvasDrag(dragData: { deltaX: number; deltaY: number }) {
    if (!editor || !editorModeStore.isHandToolMode) return;

    // Get the current canvas position

    // Calculate the new position by adding the delta values
    const newX = editorStartPos.x + dragData.deltaX;
    const newY = editorStartPos.y + dragData.deltaY;

    // Apply the new position to the canvas container
    const scene = editor.scene;
    const canvasContainer = scene.rootNode.getNodeByName('canvas-container');

    if (canvasContainer) {
        // Get current scale to maintain it
        const scale = canvasContainer.scale;

        // Set the new position while keeping the same scale
        canvasContainer.setTransform({
            position: new Vec2(newX, newY),
            scale: scale,
        });

        // Trigger a redraw
        eventBus.reDraw();
    }
}

// Watch for changes in the zoom value
watch(
    () => zoomStore.zoomValue,
    (newZoomValue) => {
        zoomControlsRef.value?.setZoomValue(newZoomValue);
    }
);

const handleSave = () => {
    if (!editor) return;

    try {
        editor.saveToImage();
    } catch (error) {
        console.error('保存失败:', error);
    }
};

const handleAddText = () => {
    if (editor) {
        uiStore.setWillAddText(true);
    }
};
</script>

<style>
.app {
    width: 100vw;
    height: 100vh;
    display: flex;
    background-color: #f0f0f0;
}

.editor-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    position: relative;
}

.canvas-container {
    flex: 1;
    position: relative;
    overflow: hidden;
}

canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.toolbar {
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;
    box-sizing: border-box;
}

.toolbar-left,
.toolbar-right {
    display: flex;
    gap: 10px;
    align-items: center;
}

body {
    margin: 0;
}
</style>
