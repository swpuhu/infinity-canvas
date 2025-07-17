<template>
    <div class="app">
        <div class="editor-container">
            <div class="toolbar" ref="headerToolbarRef">
                <div class="toolbar-head">
                    <UButton type="primary" @click="handleSave">保存</UButton>
                    <UButton type="primary" @click="handleAddText" :selected="uiStore.willAddText">添加文字</UButton>
                </div>
                <div class="toolbar-right">
                    <!-- 右侧工具按钮预留位置 -->
                </div>
            </div>
            <div class="canvas-container" @contextmenu="contextMenuHandler?.handleCanvasContextMenu">
                <canvas ref="canvasRef">
                </canvas>
                <ZoomControls ref="zoomControlsRef" />
                <VerticalToolbar ref="verticalToolbarRef" />
                <FloatingToolbar :get-editor="() => editor" :header-toolbar-ref="headerToolbarRef" />

            </div>
        </div>

        <!-- 右键菜单处理器 -->
        <ContextMenuHandler ref="contextMenuHandler" :get-editor="() => editor" :zoom-store="zoomStore"
            :editor-mode-store="editorModeStore" :ui-store="uiStore" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, } from 'vue';
import UButton from './components/UButton.vue';
import VerticalToolbar from './components/VerticalToolbar.vue';
import ZoomControls from './components/ZoomControls.vue';
import FloatingToolbar from './components/FloatingToolbar.vue';
import { CanvasEditor } from './renderer/Editor';
import { useEditorModeStore } from './store/EditorModeStore';
import { useUIStore } from './store/UIStore';
import { useZoomStore } from './store/ZoomStore';
import ContextMenuHandler from './components/ContextMenuHandler.vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const zoomControlsRef = ref<InstanceType<typeof ZoomControls> | null>(null);
const verticalToolbarRef = ref<InstanceType<typeof VerticalToolbar> | null>(
    null
);
const contextMenuHandler = ref<InstanceType<typeof ContextMenuHandler> | null>(null);

const uiStore = useUIStore();
const zoomStore = useZoomStore();
const editorModeStore = useEditorModeStore();
const headerToolbarRef = ref<HTMLElement | null>(null);

let editor: CanvasEditor | null = null;

onMounted(async () => {
    try {
        const canvasEle = canvasRef.value!;
        // canvasEle.width = window.innerWidth;
        // canvasEle.height = window.innerHeight;
        editor = new CanvasEditor(canvasEle);
        await editor.init();

    } catch (error) {
        console.error('应用启动失败:', error);
    }
});

onUnmounted(() => {
    editor?.destroy();
    editor = null;
});


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
