# 组件架构说明

## 📁 组件结构

### 基础UI组件
- **UButton.vue** - 通用按钮组件
- **VerticalToolbar.vue** - 垂直工具栏
- **ZoomControls.vue** - 缩放控制组件

### 右键菜单系统
- **AntContextMenu.vue** - 基于 ant-design-vue 的右键菜单UI组件
- **ContextMenuHandler.vue** - 右键菜单逻辑处理器

## 🎯 设计原则

### 关注点分离
- **UI组件（AntContextMenu）**: 只负责界面展示和用户交互
- **逻辑处理器（ContextMenuHandler）**: 处理所有业务逻辑和状态管理
- **主应用（App.vue）**: 保持简洁，只负责组件组合

### 组件职责

#### AntContextMenu.vue
```vue
<!-- 纯UI组件，负责：-->
- 菜单项渲染
- 样式和布局
- 基础交互（点击、悬停）
- 位置计算
```

#### ContextMenuHandler.vue
```vue
<!-- 逻辑处理器，负责：-->
- 右键事件处理
- 菜单状态管理
- 业务逻辑调用
- Store 状态更新
```

#### App.vue
```vue
<!-- 主应用，只负责：-->
- 组件引入和组合
- 基础配置传递
- 清晰的数据流
```

## 🚀 使用方式

### 在 App.vue 中的使用
```vue
<template>
  <div class="canvas-container" @contextmenu="contextMenuHandler?.handleCanvasContextMenu">
    <!-- 画布内容 -->
  </div>

  <!-- 右键菜单处理器 -->
  <ContextMenuHandler
    ref="contextMenuHandler"
    :editor="editor"
    :zoom-store="zoomStore"
    :editor-mode-store="editorModeStore"
    :ui-store="uiStore"
  />
</template>
```

### 数据流
```
用户右键点击 
    ↓
ContextMenuHandler.handleCanvasContextMenu()
    ↓
AntContextMenu 显示菜单
    ↓
用户选择菜单项
    ↓
ContextMenuHandler.handleContextMenuClick()
    ↓
调用对应的业务逻辑（缩放、保存等）
```

## ✨ 优势

1. **代码组织清晰** - 每个文件职责单一，易于维护
2. **复用性强** - AntContextMenu 可以在其他地方独立使用
3. **测试友好** - 逻辑和UI分离，便于单元测试
4. **扩展性好** - 新增菜单项只需修改 ContextMenuHandler
5. **类型安全** - 完整的 TypeScript 支持

## 🔧 扩展指南

### 添加新菜单项
1. 在 `AntContextMenu.vue` 中添加菜单项UI
2. 在 `ContextMenuHandler.vue` 的 `handleContextMenuClick` 中添加对应逻辑

### 添加新功能
1. 在 `ContextMenuHandler.vue` 中添加新的处理函数
2. 通过 props 传入需要的 store 或 editor 实例
3. 保持 App.vue 的简洁性，避免在其中添加业务逻辑

这种架构确保了代码的可维护性和可扩展性！🎉 