import SNode from '@/renderer/SNode';
import EventEmitter from 'eventemitter3';

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
};

export default eventBus;
