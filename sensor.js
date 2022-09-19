class Sensor{
    constructor(cell){
        this.cell=cell;
        this.rayCount=29;
        this.rayLength=60;
        this.raySpread=Math.PI * 2;

        this.rays=[];
        this.readings=[];

        this.#castRays();
    }

    update(dishEdges,otherCells){
        this.#castRays();
        this.readings=[];
        for(let i=0;i<this.rays.length;i++){
            this.readings.push(
                this.#getReading(
                    this.rays[i],
                    dishEdges,
                    otherCells
                )
            );
        }
    }

    #getReading(ray,dishEdges,otherCells){
        let touches=[];

        for(let i=0;i<dishEdges.length;i++){
            const touch=getIntersection(
                ray[0],
                ray[1],
                dishEdges[i][0],
                dishEdges[i][1]
            );
            if(touch){
                touches.push({ weight : 3, touch : touch});
            }
        }

        for(let i=0;i<otherCells.length;i++){
            const poly=otherCells[i].polygon;
            for(let j=0;j<poly.length;j++){
                const value=getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j+1)%poly.length]
                );
                if(value){

                    const fitter = this.cell.fitness - otherCells[i].fitness >= 0;
                    touches.push({ 
                        weight : fitter ? 1 : 2, 
                        touch : value
                    });
                }
            }
        }

        if(touches.length==0){
            return null;
        }else{
            const offsets=touches.map(e=>e.touch.offset);
            const minOffset=Math.min(...offsets);
            return touches.find(e=>e.touch.offset==minOffset);
        }
    }

    #castRays(){
        this.rays=[];
        for(let i=0;i<this.rayCount;i++){
            const rayAngle=lerp(
                this.raySpread/2,
                -this.raySpread/2,
                this.rayCount==1?0.5:i/(this.rayCount-1)
            )+this.cell.angle;

            const start={x:this.cell.x, y:this.cell.y};
            const end={
                x:this.cell.x-
                    Math.sin(rayAngle)*this.rayLength,
                y:this.cell.y-
                    Math.cos(rayAngle)*this.rayLength
            };
            this.rays.push([start,end]);
        }
    }

    draw(ctx){
        for(let i=0;i<this.rayCount;i++){
            let end=this.rays[i][1];
            if(this.readings[i]){
                end=this.readings[i].touch;
            }

            ctx.beginPath();
            ctx.lineWidth=1;
            ctx.strokeStyle="white";
            ctx.moveTo(
                this.rays[i][0].x,
                this.rays[i][0].y
            );
            ctx.lineTo(
                end.x,
                end.y
            );
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth=2;
            ctx.strokeStyle="black";
            ctx.moveTo(
                this.rays[i][1].x,
                this.rays[i][1].y
            );
            ctx.lineTo(
                end.x,
                end.y
            );
            ctx.stroke();
        }
    }        
}