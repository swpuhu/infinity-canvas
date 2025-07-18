<template>
    <teleport to="body">
        <div v-if="visible" class="floating-toolbar" :style="toolbarStyle" ref="toolbarRef">
            <div class="toolbar-container">
                <!-- 解锁按钮 - 只在节点被锁定时显示 -->
                <div v-if="selectedNodesLocked" class="tool-group">
                    <a-button type="text" size="small" class="tool-button" @click="handleUnlock">
                        <UnlockOutlined />
                    </a-button>
                </div>

                <!-- 成组工具栏 - 只在节点成组时显示 -->
                <template v-else-if="selectedNodesGrouped">
                    <div class="tool-group">
                        <a-button type="text" size="small" class="tool-button" @click="handleUngroup">
                            <DisconnectOutlined />
                            解组
                        </a-button>
                    </div>

                </template>

                <!-- 当节点被锁定或成组时，隐藏默认工具栏 -->
                <template v-else-if="!selectedNodesLocked && !selectedNodesGrouped">
                    <!-- 形状选择工具 -->
                    <div class="tool-group">
                        <a-dropdown placement="bottomLeft" :trigger="['click']">
                            <a-button type="text" size="small" class="tool-button">
                                <BorderOutlined />
                                <DownOutlined class="dropdown-icon" />
                            </a-button>
                            <template #overlay>
                                <a-menu @click="handleShapeSelect">
                                    <a-menu-item key="rectangle">
                                        <BorderOutlined />
                                        矩形
                                    </a-menu-item>
                                    <a-menu-item key="circle">
                                        <StopOutlined />
                                        圆形
                                    </a-menu-item>
                                    <a-menu-item key="triangle">
                                        <CaretUpOutlined />
                                        三角形
                                    </a-menu-item>
                                </a-menu>
                            </template>
                        </a-dropdown>
                    </div>

                    <!-- 填充颜色 -->
                    <div class="tool-group">
                        <a-dropdown placement="bottomLeft" :trigger="['click']">
                            <a-button type="text" size="small" class="tool-button color-button">
                                <div class="color-preview" :style="{ backgroundColor: fillColor }"></div>
                                <DownOutlined class="dropdown-icon" />
                            </a-button>
                            <template #overlay>
                                <div class="color-picker-panel">
                                    <div class="color-grid">
                                        <div v-for="color in commonColors" :key="color" class="color-item"
                                            :style="{ backgroundColor: color }" @click="handleFillColorSelect(color)">
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </a-dropdown>
                    </div>

                    <!-- 边框颜色 -->
                    <div class="tool-group">
                        <a-dropdown placement="bottomLeft" :trigger="['click']">
                            <a-button type="text" size="small" class="tool-button color-button">
                                <div class="color-preview stroke" :style="{ backgroundColor: strokeColor }"></div>
                                <DownOutlined class="dropdown-icon" />
                            </a-button>
                            <template #overlay>
                                <div class="color-picker-panel">
                                    <div class="color-grid">
                                        <div v-for="color in commonColors" :key="color" class="color-item"
                                            :style="{ backgroundColor: color }" @click="handleStrokeColorSelect(color)">
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </a-dropdown>
                    </div>

                    <!-- 文字工具 -->
                    <div class="tool-group">
                        <a-dropdown placement="bottomLeft" :trigger="['click']">
                            <a-button type="text" size="small" class="tool-button text-button">
                                <span class="text-icon">A</span>
                                <DownOutlined class="dropdown-icon" />
                            </a-button>
                            <template #overlay>
                                <a-menu @click="handleTextTool">
                                    <a-menu-item key="addText">
                                        <EditOutlined />
                                        添加文本
                                    </a-menu-item>
                                    <a-menu-item key="bold">
                                        <BoldOutlined />
                                        粗体
                                    </a-menu-item>
                                    <a-menu-item key="italic">
                                        <ItalicOutlined />
                                        斜体
                                    </a-menu-item>
                                </a-menu>
                            </template>
                        </a-dropdown>
                    </div>

                    <!-- 字体大小 -->
                    <div class="tool-group">
                        <a-dropdown placement="bottomLeft" :trigger="['click']">
                            <a-button type="text" size="small" class="tool-button">
                                <span class="font-size-text">{{ fontSize }}</span>
                                <DownOutlined class="dropdown-icon" />
                            </a-button>
                            <template #overlay>
                                <a-menu @click="handleFontSizeSelect">
                                    <a-menu-item v-for="size in fontSizes" :key="size" :value="size">
                                        {{ size }}
                                    </a-menu-item>
                                </a-menu>
                            </template>
                        </a-dropdown>
                    </div>

                    <!-- 对齐工具 -->
                    <div class="tool-group">
                        <a-dropdown placement="bottomLeft" :trigger="['click']">
                            <a-button type="text" size="small" class="tool-button">
                                <AlignLeftOutlined />
                                <DownOutlined class="dropdown-icon" />
                            </a-button>
                            <template #overlay>
                                <a-menu @click="handleAlignSelect">
                                    <a-menu-item key="left">
                                        <AlignLeftOutlined />
                                        左对齐
                                    </a-menu-item>
                                    <a-menu-item key="center">
                                        <AlignCenterOutlined />
                                        居中对齐
                                    </a-menu-item>
                                    <a-menu-item key="right">
                                        <AlignRightOutlined />
                                        右对齐
                                    </a-menu-item>
                                </a-menu>
                            </template>
                        </a-dropdown>
                    </div>

                    <!-- 评论工具 -->
                    <div class="tool-group">
                        <a-button type="text" size="small" class="tool-button" @click="handleComment">
                            <CommentOutlined />
                        </a-button>
                    </div>

                    <!-- 更多选项 -->
                    <div class="tool-group">
                        <a-dropdown placement="bottomLeft" :trigger="['click']">
                            <a-button type="text" size="small" class="tool-button">
                                <MoreOutlined />
                            </a-button>
                            <template #overlay>
                                <a-menu @click="handleMoreOptions">
                                    <a-menu-item key="copy">
                                        <CopyOutlined />
                                        复制
                                    </a-menu-item>
                                    <a-menu-item key="paste">
                                        <FileAddOutlined />
                                        粘贴
                                    </a-menu-item>
                                    <a-menu-item key="delete">
                                        <DeleteOutlined />
                                        删除
                                    </a-menu-item>
                                </a-menu>
                            </template>
                        </a-dropdown>
                    </div>
                </template>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick, type Ref } from 'vue'
import { useNodeInfoStore } from '@/store/NodeInfoStore'
import type { CSSProperties } from 'vue'
import { getNodesByNodeIds } from '@/common/util'
import { getWorldRect } from '@/renderer/util'
import type { CanvasEditor } from '@/renderer/Editor'
import {
    BorderOutlined,
    DownOutlined,
    StopOutlined,
    CaretUpOutlined,
    EditOutlined,
    BoldOutlined,
    ItalicOutlined,
    AlignLeftOutlined,
    AlignCenterOutlined,
    AlignRightOutlined,
    CommentOutlined,
    MoreOutlined,
    CopyOutlined,
    FileAddOutlined,
    DeleteOutlined,
    UnlockOutlined,
    DisconnectOutlined,
    LockOutlined
} from '@ant-design/icons-vue'
import { useEditorModeStore, EditorMode } from '@/store/EditorModeStore'

// Props
interface FloatingToolbarProps {
    getEditor: () => CanvasEditor | null,
    headerToolbarRef?: HTMLElement | null
}

const props = defineProps<FloatingToolbarProps>()

const nodeInfoStore = useNodeInfoStore()
const editorModeStore = useEditorModeStore()

// 响应式数据
const visible = ref(false)
const toolbarPosition = ref({ x: 0, y: 0 })
const fillColor = ref('#ffffff')
const strokeColor = ref('#000000')
const fontSize = ref(14)
const toolbarRef = ref<HTMLElement | null>(null)
let toolbarHeight = 50;

// 常用颜色
const commonColors = [
    '#ffffff', '#f5f5f5', '#d9d9d9', '#bfbfbf', '#8c8c8c', '#595959', '#262626', '#000000',
    '#ff4d4f', '#ff7a45', '#ffa940', '#ffec3d', '#bae637', '#73d13d', '#40a9ff', '#1890ff',
    '#722ed1', '#eb2f96', '#fa541c', '#faad14', '#fadb14', '#a0d911', '#52c41a', '#13c2c2',
    '#1677ff', '#2f54eb', '#9254de', '#f759ab'
]

// 字体大小选项
const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96]

// 计算工具栏样式
const toolbarStyle = computed((): CSSProperties => {
    return {
        position: 'fixed' as const,
        left: '0px',
        top: '0px',
        zIndex: 10000,
        transform: `translate(${toolbarPosition.value.x}px, ${toolbarPosition.value.y}px)`
    }
})

// 计算是否应该显示工具栏
const shouldShowToolbar = computed(() => {
    // 明确依赖 currentSelectedNodeIds
    const currentSelectedNodeIds = nodeInfoStore.currentSelectedNodeIds
    const hasSelectedNodes = currentSelectedNodeIds.length > 0
    const isDefaultMode = (editorModeStore.currentMode & EditorMode.DEFAULT) !== 0
    return hasSelectedNodes && isDefaultMode
})

// 计算当前选中的节点是否被锁定
const selectedNodesLocked = computed(() => {
    // 明确依赖 currentSelectedNodeIds
    const currentSelectedNodeIds = nodeInfoStore.currentSelectedNodeIds
    const id = currentSelectedNodeIds[0]


    // 首先检查是否应该显示工具栏
    if (!shouldShowToolbar.value) return false

    if (currentSelectedNodeIds.length === 0) return false

    // 找到包含当前选中的节点的锁定组
    const lockedNodeGroup = nodeInfoStore.lockedNodeGroup;
    for (const lockedGroup of lockedNodeGroup) {
        if (lockedGroup.includes(id)) {
            return true;
        }
    }
    return false;
})

// 计算当前选中的节点是否成组
const selectedNodesGrouped = ref(false)

// 监听工具栏显示状态变化
watch(
    shouldShowToolbar,
    (shouldShow) => {
        if (shouldShow) {
            // 先显示工具栏
            visible.value = true
            // 延迟一帧执行，确保DOM更新完成后再计算位置
            nextTick(() => {
                updateToolbarPosition()
            })
        } else {
            visible.value = false
        }
    },
    { immediate: true }
)

onMounted(() => {
})

// 监听编辑器变化
watch(
    () => props.getEditor(),
    () => {
        if (shouldShowToolbar.value) {
            nextTick(() => {
                updateToolbarPosition()
            })
        }
    }
)

// 监听节点锁定状态变化
watch(
    selectedNodesLocked,
    () => {
        if (shouldShowToolbar.value) {
            // 锁定状态变化会影响工具栏宽度，需要重新计算位置
            nextTick(() => {
                updateToolbarPosition()
            })
        }
    }
)

// 监听选中节点变化
watch(
    () => nodeInfoStore.currentSelectedNodeIds,
    (currentSelectedNodeIds) => {
        // 更新成组状态
        selectedNodesGrouped.value = nodeInfoStore.isGrouped(currentSelectedNodeIds)

        if (shouldShowToolbar.value) {
            // 选中节点变化时重新计算位置
            nextTick(() => {
                updateToolbarPosition()
            })
        }
    },
    { deep: true, immediate: true }
)

// 更新工具栏位置
const updateToolbarPosition = () => {
    const editor = props.getEditor();
    const toolbar = toolbarRef.value;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const headerToolBarHeight = props.headerToolbarRef?.clientHeight ?? 0;

    let toolbarWidth = 500;
    let toolbarHeight = 50;
    if (toolbar) {
        toolbarWidth = toolbar.clientWidth;
        toolbarHeight = toolbar.clientHeight;
    }

    console.log('toolbarWidth', toolbarWidth, 'toolbarHeight', toolbarHeight)
    if (!editor || !editor.scene) {
        // 如果没有编辑器引用，使用默认位置
        toolbarPosition.value = {
            x: window.innerWidth / 2,
            y: 80
        }
        return
    }

    const currentNodeIds = nodeInfoStore.currentSelectedNodeIds
    if (currentNodeIds.length === 0) {
        return
    }

    try {
        // 获取画布节点
        const canvasNode = editor.scene.getCanvasNode()
        if (!canvasNode) {
            return
        }

        // 根据节点ID获取节点实例
        const selectedNodes = getNodesByNodeIds(currentNodeIds, canvasNode)
        if (selectedNodes.length === 0) {
            return
        }

        // 获取所有选中节点的世界坐标边界 [minX, minY, maxX, maxY]
        const worldRect = getWorldRect(selectedNodes)
        const [minX, minY, maxX, maxY] = worldRect

        const margin = 16;


        // 计算节点的中心点和尺寸
        const nodeCenterX = (minX + maxX) / 2
        const nodeCenterY = (minY + maxY) / 2

        let x = nodeCenterX - toolbarWidth / 2;
        let y = maxY + headerToolBarHeight + margin;

        if (y > (windowHeight - headerToolBarHeight) / 2) {
            y = minY + headerToolBarHeight - margin - toolbarHeight;
        }

        const toolbarLeft = x;
        const toolbarTop = y;
        const toolbarRight = toolbarLeft + toolbarWidth;
        const toolbarBottom = toolbarTop + toolbarHeight;
        if (toolbarLeft < 0) {
            x -= toolbarLeft - margin;
        }
        if (toolbarTop < 0) {
            y -= toolbarTop;
        }
        if (toolbarRight > windowWidth) {
            x -= toolbarRight - windowWidth + margin;
        }
        if (toolbarBottom > windowHeight) {
            y -= toolbarBottom - windowHeight;
        }


        toolbarPosition.value = {
            x: x,
            y: y
        }
    } catch (error) {
        console.error('更新工具栏位置时出错:', error)
        // 使用默认位置
        toolbarPosition.value = {
            x: window.innerWidth / 2,
            y: 80
        }
    }
}

// 处理形状选择
const handleShapeSelect = ({ key }: { key: string }) => {
    console.log('Shape selected:', key)
}

// 处理填充颜色选择
const handleFillColorSelect = (color: string) => {
    fillColor.value = color
    console.log('Fill color selected:', color)
}

// 处理边框颜色选择
const handleStrokeColorSelect = (color: string) => {
    strokeColor.value = color
    console.log('Stroke color selected:', color)
}

// 处理文字工具
const handleTextTool = ({ key }: { key: string }) => {
    console.log('Text tool:', key)
}

// 处理字体大小选择
const handleFontSizeSelect = ({ key }: { key: string }) => {
    fontSize.value = parseInt(key)
    console.log('Font size selected:', key)
}

// 处理对齐选择
const handleAlignSelect = ({ key }: { key: string }) => {
    console.log('Align selected:', key)
}

// 处理评论
const handleComment = () => {
    console.log('Comment clicked')
}

// 处理更多选项
const handleMoreOptions = ({ key }: { key: string }) => {
    console.log('More option:', key)
}

// 处理解锁操作
const handleUnlock = () => {
    const selectedIds = nodeInfoStore.currentSelectedNodeIds
    if (selectedIds.length > 0) {
        // 调用 store 的解锁方法，将当前选中的节点组解锁
        nodeInfoStore.setLockedNodeGroup(selectedIds, false)
    }
}

// 处理解组操作
const handleUngroup = () => {
    const selectedIds = nodeInfoStore.currentSelectedNodeIds
    if (selectedIds.length > 0) {
        nodeInfoStore.ungroupNodes(selectedIds)
    }
}

// 处理编辑组操作
const handleEditGroup = () => {
    const selectedIds = nodeInfoStore.currentSelectedNodeIds
    if (selectedIds.length > 0) {
        nodeInfoStore.editGroup(selectedIds)
    }
}

// 处理组选项
const handleGroupOptions = ({ key }: { key: string }) => {
    console.log('Group option:', key)
}

// 窗口大小改变时更新位置
const handleResize = () => {
    if (visible.value) {
        updateToolbarPosition()
    }
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.floating-toolbar {
    user-select: none;
    pointer-events: auto;
    z-index: 1;
}

.toolbar-container {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 12px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    border: 1px solid #e8e8e8;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 90vw;
    overflow: hidden;
}

.tool-group {
    display: flex;
    align-items: center;
}

.tool-button {
    height: 32px !important;
    min-width: 32px;
    padding: 0 8px !important;
    border-radius: 4px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px;
    color: #374151 !important;
    font-size: 13px;
    transition: all 0.2s ease;
}

.tool-button:hover {
    background-color: #f3f4f6 !important;
}

.dropdown-icon {
    font-size: 10px;
    color: #9ca3af;
}

.color-button {
    min-width: 40px !important;
}

.color-preview {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    border: 1px solid #e0e0e0;
}

.color-preview.stroke {
    background: none !important;
    border: 2px solid currentColor;
}

.text-button {
    font-weight: 600;
}

.text-icon {
    font-size: 14px;
    font-weight: 600;
    color: #f59e0b;
    background: #fef3c7;
    padding: 2px 6px;
    border-radius: 3px;
}

.font-size-text {
    font-size: 12px;
    font-weight: 500;
    min-width: 16px;
    text-align: center;
}

.color-picker-panel {
    padding: 8px;
    width: 200px;
}

.color-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
}

.color-item {
    width: 20px;
    height: 20px;
    border-radius: 2px;
    border: 1px solid #e0e0e0;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.color-item:hover {
    transform: scale(1.1);
}

/* 下拉菜单样式调整 */
:deep(.ant-dropdown-menu) {
    min-width: 120px;
}

:deep(.ant-dropdown-menu-item) {
    padding: 4px 12px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
}

:deep(.ant-dropdown-menu-item-icon) {
    font-size: 12px;
}
</style>