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
                    @zoom-change="handleZoomChange"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import UButton from './components/UButton.vue';
import ZoomControls from './components/ZoomControls.vue';
import { CanvasEditor } from './renderer/Editor';
import { useUIStore } from './store/UIStore';
import { useZoomStore } from './store/ZoomStore';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const zoomControlsRef = ref<InstanceType<typeof ZoomControls> | null>(null);

const uiStore = useUIStore();
const zoomStore = useZoomStore();

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

    // Set initial zoom level
    zoomStore.setZoom(100);
    zoomControlsRef.value?.setZoom(100);
}

// Handle wheel events for zooming
function handleWheel(event: WheelEvent) {
    if (event.ctrlKey) {
        event.preventDefault();
        console.log('handleWheel', event.deltaY);

        if (event.deltaY < 0) {
            zoomStore.zoomIn();
        } else {
            zoomStore.zoomOut();
        }

        applyZoom();
    }
}

// Handle zoom change from the ZoomControls component
function handleZoomChange(level: number) {
    zoomStore.setZoom(level);
    applyZoom();
}

// Apply zoom to the canvas
function applyZoom() {
    if (!editor) return;

    // Use the editor's setZoom method to apply the zoom
    editor.setZoom(zoomStore.zoomLevel);

    // Update the zoom controls display
    zoomControlsRef.value?.setZoom(zoomStore.zoomLevel);
}

// Watch for changes in the zoom level
watch(
    () => zoomStore.zoomLevel,
    (newZoomLevel) => {
        zoomControlsRef.value?.setZoom(newZoomLevel);
        if (editor) {
            editor.setZoom(newZoomLevel);
        }
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
