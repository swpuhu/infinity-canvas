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

const canvasRef = ref<HTMLCanvasElement | null>(null);

onMounted(async () => {
    try {
        await CanvasKitModule.init();

        const renderer = new Renderer(canvasRef.value!);

        // 声明式UI配置
        const config: SNodeConfig = {
            type: 'container',
            children: [
                {
                    type: 'rect',
                    props: { x: 0, y: 0, width: 100, height: 100 },
                    style: { fill: 0xff0000 },
                },
                {
                    type: 'rect',
                    props: { x: 50, y: 10, width: 100, height: 100 },
                    children: [
                        // 可以继续嵌套子元素
                    ],
                },
            ],
        };

        // 创建根节点并解析配置
        const rootNode = createNodeFromConfig(config);
        renderer.render(rootNode);
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
