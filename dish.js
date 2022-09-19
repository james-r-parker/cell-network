class Dish{
    constructor(x,width,height){
        this.x=x;
        this.width=width;
        this.height=height;

        this.left=x-width/2;
        this.right=x+width/2;

        this.top=0;
        this.bottom=height;

        const topLeft={x:this.left,y:this.top};
        const topRight={x:this.right,y:this.top};
        const bottomLeft={x:this.left,y:this.bottom};
        const bottomRight={x:this.right,y:this.bottom};

        this.borders=[
            [topLeft,topRight],
            [topLeft,bottomLeft],
            [topRight,bottomRight],
            [bottomLeft,bottomRight],
        ];
    }

    draw(ctx){
        ctx.lineWidth=5;
        ctx.strokeStyle="white";

        ctx.setLineDash([]);
        
        this.borders.forEach(border=>{
            ctx.beginPath();
            ctx.moveTo(border[0].x,border[0].y);
            ctx.lineTo(border[1].x,border[1].y);
            ctx.stroke();
        });
    }
}