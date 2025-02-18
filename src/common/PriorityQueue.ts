export class PriorityQueue<T> {
    private heap: T[] = [];
    private compare: (a: T, b: T) => number;

    constructor(compare?: (a: T, b: T) => number) {
        this.compare = compare || ((a: T, b: T) => (a as any) - (b as any));
    }

    enqueue(value: T): void {
        this.heap.push(value);
        this.bubbleUp(this.heap.length - 1);
    }

    dequeue(): T | undefined {
        if (this.isEmpty()) return undefined;
        const root = this.heap[0];
        const last = this.heap.pop()!;
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }
        return root;
    }

    peek(): T | undefined {
        return this.heap[0];
    }

    size(): number {
        return this.heap.length;
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    clear(): void {
        this.heap = [];
    }

    remove(value: T): void {
        const index = this.heap.indexOf(value);
        if (index !== -1) {
            this.heap.splice(index, 1);
            this.bubbleUp(index);
        }
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parentIndex = this.parentIndex(index);
            if (this.compare(this.heap[index], this.heap[parentIndex]) <= 0)
                break;
            this.swap(index, parentIndex);
            index = parentIndex;
        }
    }

    private sinkDown(index: number): void {
        const lastIndex = this.heap.length - 1;
        while (true) {
            const leftChild = this.leftChildIndex(index);
            const rightChild = this.rightChildIndex(index);
            let targetIndex = index;

            if (
                leftChild <= lastIndex &&
                this.compare(this.heap[leftChild], this.heap[targetIndex]) > 0
            ) {
                targetIndex = leftChild;
            }

            if (
                rightChild <= lastIndex &&
                this.compare(this.heap[rightChild], this.heap[targetIndex]) > 0
            ) {
                targetIndex = rightChild;
            }

            if (targetIndex === index) break;
            this.swap(index, targetIndex);
            index = targetIndex;
        }
    }

    private swap(i: number, j: number): void {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    private parentIndex(index: number): number {
        return Math.floor((index - 1) / 2);
    }

    private leftChildIndex(index: number): number {
        return index * 2 + 1;
    }

    private rightChildIndex(index: number): number {
        return index * 2 + 2;
    }
}
