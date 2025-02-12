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
};

export default eventBus;
