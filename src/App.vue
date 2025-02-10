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

const canvasRef = ref<HTMLCanvasElement | null>(null);

onMounted(async () => {
    try {
        await CanvasKitModule.init();

        const renderer = new Renderer(canvasRef.value!);
        const rootNode = new SNode();
        const secondNode = new SNode();

        const graphics = new SGraphics();
        const secondGraphics = new SGraphics();

        rootNode.addRenderComps(graphics);
        secondNode.addRenderComps(secondGraphics);
        secondNode.position.set(50, 10);

        graphics.rect(0, 0, 100, 100);
        graphics.fill({ color: 0xff0000 });

        secondGraphics.rect(0, 0, 100, 100);

        rootNode.addChild(secondNode);

        renderer.render(rootNode);
        // renderer.resizeSurface();
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
