<template>
    <AntContextMenu v-model:visible="contextMenuVisible" :position="contextMenuPosition"
        @menuClick="handleContextMenuClick" ref="contextMenuRef" />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Vec2 } from '@/common/Vec2'
import eventBus from '@/common/eventBus'
import AntContextMenu from './AntContextMenu.vue'
import { VueCompConsts } from '@/common/const'

interface ContextMenuHandlerProps {
    editor?: any
    zoomStore?: any
    editorModeStore?: any
    uiStore?: any
}

const props = defineProps<ContextMenuHandlerProps>()

// 右键菜单状态
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
const contextMenuRef = ref()



// 右键菜单点击处理
function handleContextMenuClick(key: string) {
    console.log('菜单项点击:', key)

    const { editor, zoomStore, editorModeStore, uiStore } = props
    console.log('key', key)
    switch (key) {
        case VueCompConsts.ContextMenuKeys.PASTE:
            // TODO: 实现粘贴功能
            console.log('执行粘贴操作')
            break

        case VueCompConsts.ContextMenuKeys.ADD_TEXT:
            if (editor && uiStore) {
                uiStore.setWillAddText(true)
            }
            break

        case VueCompConsts.ContextMenuKeys.TOGGLE_GRID:
            // TODO: 实现网格显示/隐藏功能
            console.log('切换网格显示')
            break

        case VueCompConsts.ContextMenuKeys.ZOOM_IN:
            if (zoomStore) {
                zoomStore.zoomIn()
                applyZoom()
            }
            break

        case VueCompConsts.ContextMenuKeys.ZOOM_OUT:
            if (zoomStore) {
                zoomStore.zoomOut()
                applyZoom()
            }
            break

        case VueCompConsts.ContextMenuKeys.ACTUAL_SIZE:
            if (zoomStore) {
                zoomStore.setZoomValue(0) // 0 对应 100%
                applyZoom()
            }
            break

        case VueCompConsts.ContextMenuKeys.FIT_WINDOW:
            if (zoomStore) {
                zoomStore.resetZoom()
                applyZoom()
            }
            break

        case VueCompConsts.ContextMenuKeys.HAND_TOOL:
            if (editorModeStore) {
                const isActive = !editorModeStore.isHandToolMode
                handleHandToolChange(isActive)
            }
            break

        case VueCompConsts.ContextMenuKeys.CENTER_CANVAS:
            handleCenterCanvas()
            break

        case VueCompConsts.ContextMenuKeys.SAVE:
            handleSave()
            break
        case VueCompConsts.ContextMenuKeys.BRING_FORWARD:
            // TODO: 上移一层
            eventBus.modifyNodeLayer(VueCompConsts.ContextMenuKeys.BRING_FORWARD as 'bringForward')
            break
        case VueCompConsts.ContextMenuKeys.SEND_BACKWARD:
            // TODO: 下移一层
            eventBus.modifyNodeLayer(VueCompConsts.ContextMenuKeys.SEND_BACKWARD as 'sendBackward')
            break
        case VueCompConsts.ContextMenuKeys.BRING_TO_FRONT:
            // TODO: 置于顶层
            eventBus.modifyNodeLayer(VueCompConsts.ContextMenuKeys.BRING_TO_FRONT as 'bringToFront')
            break
        case VueCompConsts.ContextMenuKeys.SEND_TO_BACK:
            // TODO: 置于底层
            eventBus.modifyNodeLayer(VueCompConsts.ContextMenuKeys.SEND_TO_BACK as 'sendToBack')
            break
    }
}

// 应用缩放
function applyZoom() {
    const { editor, zoomStore } = props
    if (!editor || !zoomStore) return

    editor.setZoomValue(zoomStore.zoomValue)
}

// 手势工具切换
function handleHandToolChange(active: boolean) {
    const { editorModeStore } = props
    if (!editorModeStore) return

    editorModeStore.setHandToolActive(active)
}

// 居中画布
function handleCenterCanvas() {
    const { editor } = props
    if (!editor) return

    // 重置画布位置到中心
    const scene = editor.scene
    const canvasContainer = scene.rootNode.getNodeByName('canvas-container')

    if (canvasContainer) {
        // 获取当前缩放比例
        const scale = canvasContainer.scale

        // 重置位置到中心，保持缩放比例
        canvasContainer.setTransform({
            position: new Vec2(0, 0),
            scale: scale,
        })

        // 触发重绘
        eventBus.reDraw()
    }
}

// 保存图片
function handleSave() {
    const { editor } = props
    if (!editor) return

    try {
        editor.saveToImage()
    } catch (error) {
        console.error('保存失败:', error)
    }
}

// 右键菜单事件处理
function handleCanvasContextMenu(event: MouseEvent) {
    console.log('右键点击事件触发', event)
    event.preventDefault()
    contextMenuPosition.x = event.clientX
    contextMenuPosition.y = event.clientY
    contextMenuVisible.value = true
    console.log('菜单位置:', contextMenuPosition)
    console.log('菜单可见性:', contextMenuVisible.value)
}

// 暴露方法给父组件
defineExpose({
    handleCanvasContextMenu
})
</script>