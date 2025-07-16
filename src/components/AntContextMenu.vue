<template>
    <!-- 使用绝对定位的菜单，而不是dropdown -->
    <teleport to="body">
        <div v-if="visible" class="context-menu-overlay" @click="hide" @contextmenu.prevent>

            <a-menu :style="menuStyle" @click="handleMenuClick" :selectable="false" class="context-menu-wrapper"
                @contextmenu.stop>

                <!-- 导出为图片 -->
                <a-menu-item v-if="hasSelectedNodes" key="exportImage" class="context-menu-item">
                    <template #icon>
                        <ExportOutlined />
                    </template>
                    <span>导出为图片</span>
                </a-menu-item>
                <!-- 复制到剪切板 -->
                <a-menu-item v-if="hasSelectedNodes" key="copyToClipboard" class="context-menu-item">
                    <template #icon>
                        <CopyFilled />
                    </template>
                    <span>复制到剪切板</span>
                </a-menu-item>
                <!-- 粘贴 -->
                <a-menu-item key="paste" class="context-menu-item">
                    <template #icon>
                        <CopyOutlined />
                    </template>
                    <div class="menu-item-content">
                        <span>粘贴</span>
                        <span class="shortcut">Ctrl + V</span>
                    </div>
                </a-menu-item>

                <a-menu-divider />

                <!-- 添加文字 -->
                <a-menu-item key="addText" class="context-menu-item">
                    <template #icon>
                        <EditOutlined />
                    </template>
                    <div class="menu-item-content">
                        <span>添加文字</span>
                        <span class="shortcut">T</span>
                    </div>
                </a-menu-item>

                <!-- 层级菜单 - 支持子菜单 -->
                <a-menu-item v-if="hasSelectedNodes" key="layer" class="context-menu-item submenu-item"
                    @mouseenter="showSubmenu" @mouseleave="hideSubmenuDelayed">
                    <template #icon>
                        <BarsOutlined />
                    </template>
                    <div class="menu-item-content">
                        <span>层级</span>
                        <RightOutlined class="submenu-arrow" />
                    </div>
                </a-menu-item>

                <!-- 隐藏网格 -->
                <a-menu-item key="toggleGrid" class="context-menu-item">
                    <template #icon>
                        <BorderOutlined />
                    </template>
                    <div class="menu-item-content">
                        <span>隐藏网格</span>
                        <span class="shortcut">Shift + G</span>
                    </div>
                </a-menu-item>

                <a-menu-divider />

                <!-- 放大 -->
                <a-menu-item key="zoomIn" class="context-menu-item">
                    <template #icon>
                        <PlusOutlined />
                    </template>
                    <span>放大</span>
                </a-menu-item>

                <!-- 缩小 -->
                <a-menu-item key="zoomOut" class="context-menu-item">
                    <template #icon>
                        <MinusOutlined />
                    </template>
                    <span>缩小</span>
                </a-menu-item>

                <!-- 缩放至 100% -->
                <a-menu-item key="actualSize" class="context-menu-item">
                    <template #icon>
                        <OneToOneOutlined />
                    </template>
                    <div class="menu-item-content">
                        <span>缩放至 100%</span>
                        <span class="shortcut">⌘ + 0</span>
                    </div>
                </a-menu-item>

                <!-- 画布全览 -->
                <a-menu-item key="fitWindow" class="context-menu-item">
                    <template #icon>
                        <ExpandOutlined />
                    </template>
                    <div class="menu-item-content">
                        <span>画布全览</span>
                        <span class="shortcut">Shift + 1</span>
                    </div>
                </a-menu-item>
            </a-menu>

            <!-- 子菜单 -->
            <div v-if="submenuVisible && hasSelectedNodes" :style="submenuStyle" class="context-submenu-wrapper"
                @mouseenter="clearSubmenuTimer" @mouseleave="hideSubmenuDelayed">
                <a-menu @click="handleSubmenuClick" :selectable="false" class="context-menu-wrapper">

                    <!-- 上移一层 -->
                    <a-menu-item key="bringForward" class="context-menu-item">
                        <template #icon>
                            <UpOutlined />
                        </template>
                        <span>上移一层</span>
                    </a-menu-item>

                    <!-- 下移一层 -->
                    <a-menu-item key="sendBackward" class="context-menu-item">
                        <template #icon>
                            <DownOutlined />
                        </template>
                        <span>下移一层</span>
                    </a-menu-item>
                    <!-- 置于顶层 -->
                    <a-menu-item key="bringToFront" class="context-menu-item">
                        <template #icon>
                            <VerticalAlignTopOutlined />
                        </template>
                        <span>置于顶层</span>
                    </a-menu-item>

                    <!-- 置于底层 -->
                    <a-menu-item key="sendToBack" class="context-menu-item">
                        <template #icon>
                            <VerticalAlignBottomOutlined />
                        </template>
                        <span>置于底层</span>
                    </a-menu-item>
                </a-menu>
            </div>
        </div>
    </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
    EditOutlined,
    PlusOutlined,
    MinusOutlined,
    ExpandOutlined,
    OneToOneOutlined,
    CopyFilled,
    CopyOutlined,
    ExportOutlined,
    BorderOutlined,
    BarsOutlined,
    RightOutlined,
    VerticalAlignTopOutlined,
    VerticalAlignBottomOutlined,
    UpOutlined,
    DownOutlined
} from '@ant-design/icons-vue'
import { useNodeInfoStore } from '@/store/NodeInfoStore'
import eventBus from '@/common/eventBus'

interface ContextMenuProps {
    visible?: boolean
    position?: { x: number; y: number }
}

const props = withDefaults(defineProps<ContextMenuProps>(), {
    visible: false,
    position: () => ({ x: 0, y: 0 })
})

const emit = defineEmits<{
    'update:visible': [visible: boolean]
    'menuClick': [key: string]
}>()

const visible = ref(false)
const submenuVisible = ref(false)
let submenuTimer: number | null = null

// 获取节点信息状态
const nodeInfoStore = useNodeInfoStore()

// 计算是否显示层级菜单 - 只有在有选中节点时才显示
const hasSelectedNodes = computed(() => {
    return nodeInfoStore.currentSelectedNodeIds.length > 0
})


// 监听外部 visible 变化
watch(() => props.visible, (newVal) => {
    console.log('AntContextMenu visible 变化:', newVal);
    visible.value = newVal
    if (!newVal) {
        submenuVisible.value = false // 主菜单隐藏时同时隐藏子菜单
    }
}, { immediate: true })

// 监听内部 visible 变化，同步到外部
watch(visible, (newVal) => {
    console.log('内部 visible 变化:', newVal);
    emit('update:visible', newVal)
})

// 监听选中节点变化，当没有选中节点时隐藏子菜单
watch(hasSelectedNodes, (newVal) => {
    if (!newVal && submenuVisible.value) {
        submenuVisible.value = false
        clearSubmenuTimer()
    }
})

// 计算菜单样式
const menuStyle = computed(() => {
    if (!props.position) return {}

    const menuWidth = 160
    const menuHeight = 250

    let x = props.position.x
    let y = props.position.y

    // 边界检测
    if (x + menuWidth > window.innerWidth) {
        x = props.position.x - menuWidth
    }
    if (y + menuHeight > window.innerHeight) {
        y = props.position.y - menuHeight
    }

    return {
        position: 'fixed' as const,
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 9999
    }
})

// 计算子菜单样式
const submenuStyle = computed(() => {
    if (!props.position) return {}

    const mainMenuWidth = 160
    const submenuWidth = 140
    const submenuHeight = 160

    let x = props.position.x + mainMenuWidth
    let y = props.position.y + 60

    // 边界检测 - 如果右侧空间不够，显示在左侧
    if (x + submenuWidth > window.innerWidth) {
        x = props.position.x - submenuWidth
    }

    // 垂直边界检测
    if (y + submenuHeight > window.innerHeight) {
        y = window.innerHeight - submenuHeight - 10
    }

    return {
        position: 'fixed' as const,
        left: `${x}px`,
        top: `${y}px`,
        zIndex: 10000
    }
})

// 显示子菜单
const showSubmenu = () => {
    clearSubmenuTimer()
    submenuVisible.value = true
}

// 延迟隐藏子菜单
const hideSubmenuDelayed = () => {
    submenuTimer = window.setTimeout(() => {
        submenuVisible.value = false
    }, 200)
}

// 清除子菜单定时器
const clearSubmenuTimer = () => {
    if (submenuTimer) {
        clearTimeout(submenuTimer)
        submenuTimer = null
    }
}

// 处理主菜单点击
const handleMenuClick = ({ key }: { key: string }) => {
    console.log('菜单项被点击:', key);
    // 层级菜单项不处理点击，只显示子菜单
    if (key === 'layer') {
        return
    } else if (key === 'exportImage') {
        const currentNodeIds = nodeInfoStore.currentSelectedNodeIds;

        eventBus.saveToImage(currentNodeIds);
        return
    } else if (key === 'copyToClipboard') {
        const currentNodeIds = nodeInfoStore.currentSelectedNodeIds;
        eventBus.saveImageToClipboard(currentNodeIds);
        return
    }
    emit('menuClick', key)
    hide()
}

// 处理子菜单点击
const handleSubmenuClick = ({ key }: { key: string }) => {
    console.log('子菜单项被点击:', key);
    emit('menuClick', key)
    hide()
}

// 显示菜单的方法
const show = (x: number, y: number) => {
    console.log('显示菜单:', x, y);
    visible.value = true
}

// 隐藏菜单的方法
const hide = () => {
    console.log('隐藏菜单');
    visible.value = false
    submenuVisible.value = false
    clearSubmenuTimer()
}

// 暴露方法
defineExpose({
    show,
    hide
})
</script>

<style scoped>
.context-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9998;
    background: transparent;
}

.context-menu-wrapper {
    min-width: 140px;
    border-radius: 6px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
    background: white;
    border: 1px solid #e8e8e8;
    padding: 4px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.context-submenu-wrapper {
    min-width: 120px;
}

:deep(.context-menu-item) {
    padding: 4px 12px !important;
    font-size: 13px !important;
    line-height: 16px !important;
    margin: 0 2px !important;
    border-radius: 4px !important;
    color: #374151;
    display: flex !important;
    align-items: center !important;
    min-height: 24px !important;
    height: 32px !important;
}

:deep(.context-menu-item .ant-menu-item-icon) {
    margin-right: 8px !important;
    font-size: 12px !important;
    color: #6b7280;
    width: 14px !important;
    height: 14px !important;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

}

:deep(.context-menu-item:hover) {
    background-color: #f3f4f6 !important;
}

:deep(.context-menu-item .ant-menu-title-content) {
    flex: 1;
    display: flex !important;
    align-items: center !important;
}

.menu-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    flex: 1;
}

.shortcut {
    font-size: 11px;
    color: #9ca3af;
    margin-left: auto;
    font-weight: 400;
    padding-left: 12px;
}

.submenu-arrow {
    font-size: 10px;
    color: #9ca3af;
    margin-left: auto;
}

.submenu-item .menu-item-content {
    position: relative;
}

/* 分割线样式 */
:deep(.ant-menu-divider) {
    margin: 3px 8px !important;
    background-color: #e5e7eb;
}

/* 确保菜单项内容正确对齐 */
:deep(.ant-menu-item-only-child) {
    display: flex !important;
    align-items: center !important;
}
</style>