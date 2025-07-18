<template>
    <div class="vertical-toolbar">
        <div class="toolbar-item shape-tool" :class="{ active: isShapeToolActive }"
            @click="setActiveTool(EditorMode.SHAPE_INSERT)" @mouseenter="handleShapeHoverEnter"
            @mouseleave="handleShapeHoverLeave">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect v-if="editorModeStore.getCurrentInsertShape === SNodeConfig.NodeType.RECT" x="3" y="3" width="18"
                    height="18" rx="2" ry="2">
                </rect>
                <circle v-if="editorModeStore.getCurrentInsertShape === SNodeConfig.NodeType.ELLIPSE" cx="12" cy="12"
                    r="8"></circle>
                <polygon v-if="editorModeStore.getCurrentInsertShape === SNodeConfig.NodeType.TRI"
                    points="12,2 22,20 2,20">
                </polygon>
                <polygon v-if="editorModeStore.getCurrentInsertShape === SNodeConfig.NodeType.DIAMOND"
                    points="12,3 21,12 12,21 3,12"></polygon>
                <polygon v-if="editorModeStore.getCurrentInsertShape === SNodeConfig.NodeType.PARALLELOGRAM"
                    points="4,18 8,6 20,6 16,18"></polygon>
                <polygon v-if="editorModeStore.getCurrentInsertShape === SNodeConfig.NodeType.PENTAGON"
                    points="12,2 22,8 18,20 6,20 2,8"></polygon>
                <polygon v-if="editorModeStore.getCurrentInsertShape === SNodeConfig.NodeType.HEXAGON"
                    points="12,2 22,7 22,17 12,22 2,17 2,7">
                </polygon>
                <polygon v-if="editorModeStore.getCurrentInsertShape === SNodeConfig.NodeType.STAR"
                    points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"></polygon>

            </svg>

            <!-- 形状选择菜单 -->
            <div v-if="showShapeMenu" class="shape-menu" @mouseenter="handleShapeMenuEnter"
                @mouseleave="handleShapeMenuLeave">
                <div class="shape-menu-grid">
                    <div v-for="shape in shapes" :key="shape.type" class="shape-menu-item" :title="shape.name"
                        @click="handleShapeSelect(shape.type)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect v-if="shape.type === SNodeConfig.NodeType.RECT" x="3" y="6" width="18" height="12"
                                rx="2"></rect>
                            <circle v-if="shape.type === SNodeConfig.NodeType.ELLIPSE" cx="12" cy="12" r="8"></circle>
                            <polygon v-if="shape.type === SNodeConfig.NodeType.TRI" points="12,2 22,20 2,20"></polygon>
                            <polygon v-if="shape.type === SNodeConfig.NodeType.DIAMOND" points="12,3 21,12 12,21 3,12">
                            </polygon>
                            <polygon v-if="shape.type === SNodeConfig.NodeType.PARALLELOGRAM"
                                points="4,18 8,6 20,6 16,18"></polygon>
                            <polygon v-if="shape.type === SNodeConfig.NodeType.PENTAGON"
                                points="12,2 22,8 18,20 6,20 2,8"></polygon>
                            <polygon v-if="shape.type === SNodeConfig.NodeType.HEXAGON"
                                points="12,2 22,7 22,17 12,22 2,17 2,7"></polygon>
                            <polygon v-if="shape.type === SNodeConfig.NodeType.STAR"
                                points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"></polygon>
                        </svg>
                    </div>
                    <div class="shape-menu-more">
                        更多图形
                    </div>
                </div>
            </div>
        </div>

        <div class="toolbar-item" :class="{ active: editorModeStore.isToolActive(EditorMode.TEXT_INSERT) }"
            @click="setActiveTool(EditorMode.TEXT_INSERT)">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <text x="6" y="16" font-family="sans-serif" font-size="14" font-weight="bold">
                    T
                </text>
            </svg>
        </div>

    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useEditorModeStore, EditorMode } from '../store/EditorModeStore';
import { SNodeConfig } from '@/common/types';

const editorModeStore = useEditorModeStore();
const emit = defineEmits(['tool-selected', 'shape-selected']);

// 形状菜单显示状态
const showShapeMenu = ref(false);
let hoverTimer: number | null = null;

// 形状类型定义
const shapes: { type: SNodeConfig.NodeType, name: string }[] = [
    { type: SNodeConfig.NodeType.RECT, name: '矩形' },
    { type: SNodeConfig.NodeType.ELLIPSE, name: '椭圆' },
    { type: SNodeConfig.NodeType.TRI, name: '三角形' },
    { type: SNodeConfig.NodeType.DIAMOND, name: '菱形' },
    { type: SNodeConfig.NodeType.PARALLELOGRAM, name: '平行四边形' },
    { type: SNodeConfig.NodeType.PENTAGON, name: '五边形' },
    { type: SNodeConfig.NodeType.HEXAGON, name: '六边形' },
    { type: SNodeConfig.NodeType.STAR, name: '星形' },
];

// 计算shape工具的激活状态 - 需要同时满足工具类型和编辑模式
const isShapeToolActive = computed(() => {
    return editorModeStore.isShapeInsertMode;
});

// 处理形状工具hover进入
function handleShapeHoverEnter() {
    if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
    }
    showShapeMenu.value = true;
}

// 处理形状工具hover离开
function handleShapeHoverLeave() {
    hoverTimer = setTimeout(() => {
        showShapeMenu.value = false;
    }, 200);
}

// 处理形状菜单hover进入
function handleShapeMenuEnter() {
    if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
    }
}

// 处理形状菜单hover离开
function handleShapeMenuLeave() {
    hoverTimer = setTimeout(() => {
        showShapeMenu.value = false;
    }, 200);
}

// 处理形状选择
function handleShapeSelect(shapeType: SNodeConfig.NodeType) {
    showShapeMenu.value = false;

    // 发射形状选择事件
    emit('shape-selected', shapeType);


    // 设置形状插入模式，传递选中的形状
    editorModeStore.setShapeInsertMode(true, shapeType);
}

// Set active tool and emit event
function setActiveTool(currentEditorMode: EditorMode) {


    // editorModeStore.setMode(currentEditorMode);
    // Handle special tool cases
    if (currentEditorMode === EditorMode.SHAPE_INSERT) {
        editorModeStore.setShapeInsertMode(true);
    } else if (currentEditorMode === EditorMode.TEXT_INSERT) {
        editorModeStore.setTextInsertMode(true);
    }
}

// Initialize component
onMounted(() => {
    // Set initial tool
    // editorModeStore.setTool(ToolType.SELECT);
});

// Expose method to activate a tool programmatically
defineExpose({
    setActiveTool,
});
</script>

<style scoped>
.vertical-toolbar {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 8px;
    z-index: 100;
}

.toolbar-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 6px;
    cursor: pointer;
    color: #555;
    margin: 4px 0;
    transition: all 0.2s ease;
}

.toolbar-item:hover {
    background-color: #f0f0f0;
}

.toolbar-item.active {
    background-color: #e6f7ff;
    color: #1890ff;
}

.shape-tool {
    position: relative;
}

.shape-menu {
    position: absolute;
    left: 52px;
    top: 0;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 8px;
    z-index: 1000;
    min-width: 200px;
    opacity: 1;
    animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateX(-10px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.shape-menu-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
}

.shape-menu-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    color: #555;
    transition: all 0.2s ease;
}

.shape-menu-item:hover {
    background-color: #f0f0f0;
    color: #1890ff;
}

.shape-menu-more {
    grid-column: 1 / -1;
    text-align: center;
    padding: 8px;
    font-size: 12px;
    color: #888;
    border-top: 1px solid #eee;
    margin-top: 4px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.shape-menu-more:hover {
    background-color: #f0f0f0;
    color: #1890ff;
}
</style>
