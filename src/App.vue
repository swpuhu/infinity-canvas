<template>
    <div class="app">
        <div class="editor-container">
            <canvas ref="canvasRef"></canvas>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { CanvasEditor } from './renderer/Editor';

const canvasRef = ref<HTMLCanvasElement | null>(null);

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
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

canvas {
    width: 100%;
    height: 100%;
    display: block;
}

body {
    margin: 0;
}
</style>
