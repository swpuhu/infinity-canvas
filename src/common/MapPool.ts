export class MapPool<K, V> {
    private _map: Map<K, V> = new Map();

    private _idleObjects: V[] = [];

    private _createFunc: () => V;

    constructor(initialSize: number, createFunc: () => V) {
        this._createFunc = createFunc;
        for (let i = 0; i < initialSize; i++) {
            this._idleObjects.push(createFunc());
        }
    }

    public get(key: K): V {
        let obj = this._map.get(key);
        if (!obj) {
            obj = this._idleObjects.pop();
            if (!obj) {
                const newObj = this._createFunc();
                this._map.set(key, newObj);
                return newObj;
            }
            this._map.set(key, obj);
        }
        return obj;
    }

    public release(key: K): void {
        const obj = this._map.get(key);
        if (obj) {
            this._idleObjects.push(obj);
            this._map.delete(key);
        }
    }
}
