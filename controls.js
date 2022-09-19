class Controls{
    constructor(){
        this.forward=randomBool();
        this.left=randomBool();
        this.right=randomBool();
        this.reverse=randomBool();
    }

    toNumber() {
        const a = [this.forward, this.left, this.right, this.reverse];
        return a.reduce((res, x) => res << 1 | x);
    }
}