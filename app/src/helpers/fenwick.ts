type Fenwick = {
    tree: number[];
    touches: number[];
    update(index: number, value: number): void;
    query(index: number): number;
}

export const Fenwick: Fenwick = {
    tree: [],
    touches: [],
    update(index: number, value: number) {
        for (let i = index + 1; i < this.tree.length; i += i & -i) {
            this.tree[i] += value;
        }
    },
    query(index: number) {
        let sum = 0;
        for (let i = index + 1; i < this.tree.length; i -= i & -i) {
            sum += this.tree[i];
        }
        return sum;
    }   
}