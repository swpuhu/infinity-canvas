<template>
    <AntContextMenu v-model:visible="contextMenuVisible" :position="contextMenuPosition"
        @menuClick="handleContextMenuClick" ref="contextMenuRef" />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Vec2 } from '@/common/Vec2'
import eventBus from '@/common/eventBus'
import AntContextMenu from './AntContextMenu.vue'

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

    switch (key) {
        case 'paste':
            // TODO: 实现粘贴功能
            console.log('执行粘贴操作')
            break

        case 'addText':
            if (editor && uiStore) {
                uiStore.setWillAddText(true)
            }
            break

        case 'toggleGrid':
            // TODO: 实现网格显示/隐藏功能
            console.log('切换网格显示')
            break

        case 'zoomIn':
            if (zoomStore) {
                zoomStore.zoomIn()
                applyZoom()
            }
            break

        case 'zoomOut':
            if (zoomStore) {
                zoomStore.zoomOut()
                applyZoom()
            }
            break

        case 'actualSize':
            if (zoomStore) {
                zoomStore.setZoomValue(0) // 0 对应 100%
                applyZoom()
            }
            break

        case 'fitWindow':
            if (zoomStore) {
                zoomStore.resetZoom()
                applyZoom()
            }
            break

        case 'handTool':
            if (editorModeStore) {
                const isActive = !editorModeStore.isHandToolMode
                handleHandToolChange(isActive)
            }
            break

        case 'centerCanvas':
            handleCenterCanvas()
            break

        case 'save':
            handleSave()
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