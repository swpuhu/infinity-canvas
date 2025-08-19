# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

- **Build**: `npm run build` - Build the project
- **Dev**: `npm run dev` - Start development server
- **Preview**: `npm run preview` - Preview built application

## Architecture Overview

This is a canvas-based whiteboard/editor application built with:
- **Frontend**: Vue.js (Vue 3) with TypeScript
- **Canvas Engine**: Custom WebGL-based rendering engine using CanvasKit
- **State Management**: Pinia stores for managing editor state
- **Architecture**: Entity-Component-System (ECS) pattern with SNode as base entity

## Key Components

### Core Types & Interfaces
- **SNode**: Base entity class for all canvas objects
- **SNodeConfig**: Configuration system for creating nodes from declarative configs
- **CanvasEditor**: Main editor class managing the canvas and interactions
- **EditorModeStore**: Pinia store managing editor modes (insert, resize, rotate, etc.)

### Node Types
- **Rect/Ellipse/Triangle/Diamond**: Basic shapes via SGeo components
- **Paragraph**: Text rendering via SParagraph component
- **Sprite**: Image rendering via SSprite component
- **IArrow**: Interactive arrow component for connecting nodes
- **DashLine**: Dashed line rendering

### Event System
- **CanvasEventSystem**: Manages pointer events on canvas
- **SEventManager**: System-level event handling
- **SNodeEvents**: Standardized event types (pointerdown, pointermove, dblclick, etc.)

### Creator Classes
- **ShapeCreator**: Handles shape insertion workflow
- **TextCreator**: Handles text insertion workflow
- **IArrowCreator**: Handles arrow insertion workflow
- **PresetShapes**: Predefined shape configurations

### Resizer System
- **IArrowResizer**: Specialized arrow resizing with control points
- **ResizeGizmo**: Visual feedback for resize operations
- **DragEventsHandler/ResizeEventsHandler**: Event handling for interactions

## File Structure

```
src/
├── common/           # Shared types, constants, utilities
├── store/            # Pinia stores (EditorModeStore, etc.)
├── renderer/         # Core canvas engine
│   ├── components/   # Creator classes and managers
│   ├── Geometry/     # Shape rendering components
│   └── RenderComponents/ # UI components (text, sprites, etc.)
└── components/       # Vue components
```

## Node Creation Pattern

Nodes are created using configuration objects with `createNodeFromConfig()`:
```typescript
const config: SNodeConfig.IArrowConfig = {
  type: SNodeConfig.NodeType.IARROW,
  points: [[0, 0], [100, 0]],
  style: { stroke: [0, 0, 0, 1], strokeWidth: 2 }
};
```

## Editor Modes

Defined in `EditorModeStore.ts`:
- `DEFAULT`: Standard interaction mode
- `SHAPE_INSERT`: Inserting predefined shapes
- `TEXT_INSERT`: Inserting text elements
- `ARROW_INSERT`: Inserting arrows
- `RESIZING/ROTATING/DRAGGING`: Transform modes

## Development Setup

The application uses Vite for development with hot module replacement. All rendering is done via WebGL/WebGPU through CanvasKit for performance.