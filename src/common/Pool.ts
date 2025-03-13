// 定义构造函数类型
type ContFunc<T, Args extends any[] = any[]> = new (...args: Args) => T;

export class Pool<T, Args extends any[] = any[]> {
    private _pool: T[] = [];
    private cont: ContFunc<T, Args>;
    private constructorArgs: Args;

    constructor(
        initNum: number,
        cont: ContFunc<T, Args>,
        private _afterGet?: (item: T) => void,
        private _beforePut?: (item: T) => void,
        ...args: Args
    ) {
        this.cont = cont;
        this.constructorArgs = args;

        for (let i = 0; i < initNum; i++) {
            this._pool.push(new this.cont(...this.constructorArgs));
        }
    }

    public get(...args: Args): T {
        let item: T;
        console.log('this._pool.length', this._pool.length);
        if (this._pool.length > 0) {
            item = this._pool.pop()!;
        } else {
            item = new this.cont(...args);
        }
        this._afterGet?.(item);

        return item;
    }

    public put(item: T): void {
        const index = this._pool.indexOf(item);
        if (index < 0) {
            this._beforePut?.(item);
            this._pool.push(item);
        } else {
            throw new Error('item already in pool');
        }
    }
}
