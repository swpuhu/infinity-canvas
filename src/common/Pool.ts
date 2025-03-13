// 定义构造函数类型
type ContFunc<T, Args extends any[] = any[]> = new (...args: Args) => T;

export class Pool<T, Args extends any[] = any[]> {
    private _pool: T[] = [];
    private cont: ContFunc<T, Args>;
    private constructorArgs: Args;

    constructor(initNum: number, cont: ContFunc<T, Args>, ...args: Args) {
        this.cont = cont;
        this.constructorArgs = args;

        for (let i = 0; i < initNum; i++) {
            this._pool.push(new this.cont(...this.constructorArgs));
        }
    }

    public get(...args: Args): T {
        if (this._pool.length > 0) {
            return this._pool.pop()!;
        } else {
            return new this.cont(...args);
        }
    }

    public put(item: T): void {
        this._pool.push(item);
    }
}
