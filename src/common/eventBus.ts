import SNode from '@/renderer/SNode';
import EventEmitter from 'eventemitter3';
import { SNodeConfig } from './types';

const eventEmitter = new EventEmitter();
const eventBus = {
    reDraw() {
        eventEmitter.emit('reDraw');
    },

    onReDraw(callback: () => void) {
        eventEmitter.on('reDraw', callback);
    },

    offReDraw(callback: () => void) {
        eventEmitter.off('reDraw', callback);
    },

    enterEditMode(node: SNode) {
        eventEmitter.emit('enterEditMode', node);
    },

    exitEditMode() {
        eventEmitter.emit('exitEditMode');
    },

    onEnterEditMode(callback: (node: SNode) => void) {
        eventEmitter.on('enterEditMode', callback);
    },

    onExitEditMode(callback: () => void) {
        eventEmitter.on('exitEditMode', callback);
    },

    cancelSnapGuide() {
        eventEmitter.emit('cancelSnapGuide');
    },
    onCancelSnapGuide(callback: () => void) {
        eventEmitter.on('cancelSnapGuide', callback);
    },
    destroy() {
        eventEmitter.removeAllListeners();
    },

    modifyNodeLayer(
        method: 'bringForward' | 'sendBackward' | 'bringToFront' | 'sendToBack'
    ) {
        eventEmitter.emit('modifyNodeLayer', method);
    },

    onModifyNodeLayer(
        callback: (
            method:
                | 'bringForward'
                | 'sendBackward'
                | 'bringToFront'
                | 'sendToBack'
        ) => void
    ) {
        eventEmitter.on('modifyNodeLayer', callback);
    },
    panCanvasStart() {
        eventEmitter.emit('panCanvasStart');
    },
    onPanCanvasStart(callback: () => void) {
        eventEmitter.on('panCanvasStart', callback);
    },

    panCanvas(
        screenX: number,
        screenY: number,
        startScreenX: number,
        startScreenY: number
    ) {
        eventEmitter.emit(
            'panCanvas',
            screenX,
            screenY,
            startScreenX,
            startScreenY
        );
    },

    onPanCanvas(
        callback: (
            screenX: number,
            screenY: number,
            startScreenX: number,
            startScreenY: number
        ) => void
    ) {
        eventEmitter.on('panCanvas', callback);
    },

    zoomCanvas(offsetX: number, offsetY: number, deltaY: number) {
        eventEmitter.emit('zoomCanvas', offsetX, offsetY, deltaY);
    },

    onZoomCanvas(
        callback: (offsetX: number, offsetY: number, deltaY: number) => void
    ) {
        eventEmitter.on('zoomCanvas', callback);
    },

    insertPresetNodeIntoScene(
        type: SNodeConfig.NodeType,
        props: any,
        replyFunc: (node: SNode) => void
    ) {
        eventEmitter.emit('insertPresetNodeIntoScene', type, props, replyFunc);
    },

    onInsertPresetNodeIntoScene(
        callback: (
            type: SNodeConfig.NodeType,
            props: any,
            replyFunc: (node: SNode) => void
        ) => void
    ) {
        eventEmitter.on('insertPresetNodeIntoScene', callback);
    },
};

export default eventBus;
