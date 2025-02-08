<template>
    <div class="app">
        <div class="editor-container">
            <canvas ref="canvasRef"></canvas>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { CanvasKitModule } from '@/lib/canvaskit';

const canvasRef = ref<HTMLCanvasElement | null>(null);

onMounted(async () => {
    try {
        await CanvasKitModule.init();
        console.log(CanvasKitModule.CanvasKit);
    } catch (error) {
        console.error('应用启动失败:', error);
    }
});
</script>

<style>
.app {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f0f0f0;
}

.editor-container {
    width: 800px;
    height: 600px;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

canvas {
    width: 100%;
    height: 100%;
}
</style>
