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
import { Renderer } from './renderer/renderer';
import SNode from './renderer/SNode';
import { SGraphics } from './renderer/SGraphics';
import { createNodeFromConfig, SNodeConfig } from './renderer/util';
import { SScene } from './renderer/SScene';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const designSize = { width: 375, height: 667 }; // 设计稿尺寸（示例值）
const sideSize = 200; // 侧边栏宽度

onMounted(async () => {
    try {
        await CanvasKitModule.init();
        const renderer = new Renderer(canvasRef.value!);
        const canvasSize = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        // 创建基础布局
        const scene = new SScene({
            canvasSize,
            designSize: { width: 1920, height: 1080 },
            sideWidth: 200,
        });

        console.log(scene.rootNode);

        // 添加示例元素

        renderer.render(scene.rootNode);
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
