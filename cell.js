class Cell{
    constructor(x,y,width,height,family,maxSpeed,acceleration,friction, dumb){
        
        this.startX = x;
        this.startY = y;

        this.id = generateUUID();
        this.x=x;
        this.y=y;
        this.width=width || getRndInteger(5,15);
        this.height=height || getRndInteger(5,15);
        this.dumb = dumb || false;

        this.speed=0;
        this.acceleration=acceleration || 0.05;
        this.maxSpeed=maxSpeed || 1.25;
        this.friction=friction || 0.0055;
        this.angle=0;
        this.damaged=false;
        this.family= family || Cell.families[getRndInteger(0,4)];
        this.birth = new Date().getTime();
        this.movements = 0;
        this.kills = 0;
        this.distance = 0;
        this.travelled = 0;
        this.stuck = false;
        this.mutates = 0;
        this.polygon = this.#createPolygon();
        this.avgSpeed = 1;

        this.fitness = 1;
        this.score = 0;

        this.recentTravelDistances = [];
        this.recentControlInputs = [];
        this.recentDistances = [];
        this.recentSpeeds = [];

        if(!this.dumb) {
            this.sensor=new Sensor(this);
            this.#buildNewBrain();
        }

        this.controls=new Controls();
    }

    static families = [
        {
            weight : 2,
            colour : "#7F8487"
        },
        {
            weight : 3,
            colour : "#E80F88"
        },
        {
            weight : 5,
            colour : "#D49B54"
        },
        {
            weight : 7,
            colour : "#4E9F3D"
        },
        {
            weight : 11,
            colour : "#950101"
        }
    ];

    static clone(cell) {
        const newCell = new Cell(
            cell.x - cell.width,
            cell.y - cell.height,
            cell.width,
            cell.height,
            cell.family,
            cell.maxSpeed,
            cell.acceleration,
            cell.friction
        );
        
        newCell.movements = cell.movements;
        newCell.distance = cell.distance;
        newCell.travelled = cell.travelled;

        newCell.brain = JSON.parse(JSON.stringify(cell.brain));
        NeuralNetwork.mutate(newCell.brain,0.1);
        return newCell;
    }

    update(dishEdges,otherCells){

        const active = otherCells.filter(c => 
            !c.damaged && 
            c.family.weight != this.family.weight &&
            c.id != this.id &&
            boundingBox(this,c));
        
        let kills = 0;
        if(!this.damaged){
            this.#move();
            this.polygon=this.#createPolygon();
            kills = this.#assessDamage(dishEdges,active);
            this.kills+=kills;

            const travelledX = this.x - this.startX;
            const travelledY = this.y - this.startY;
            const d = Math.abs(travelledX + travelledY);

            this.distance = d;
            this.recentDistances.push(d.toFixed(1));
            this.recentDistances = this.recentDistances.slice(-500);
        }

        if(this.sensor){
            this.sensor.update(dishEdges,active);
            
            const offsets=this.sensor.readings.map(
                s=>s==null?0:(s.touch.offset)
            );
            
            const outputs=NeuralNetwork.feedForward(offsets,this.brain);

            if(this.controls.forward != outputs[0]) {
                this.movements++;
            }

            if(this.controls.left != outputs[1]) {
                this.movements++;
            }

            if(this.controls.right != outputs[2]) {
                this.movements++;
            }

            if(this.controls.reverse != outputs[3]) {
                this.movements++;
            }

            this.controls.forward=outputs[0];
            this.controls.left=outputs[1];
            this.controls.right=outputs[2];
            this.controls.reverse=outputs[3];
        }

        if(this.recentTravelDistances.length == 10) {
            const d = this.recentTravelDistances.reduce((p,c) => {
                return p+c;
            },0);

            if(d <= 0) {
                this.stuck = d <= 0;
            }
        }

        const uniqueDistancesSet = new Set(this.recentDistances);
        const uniqueDistancesCount = uniqueDistancesSet.size;
        const uniqueDistances = Array.from(uniqueDistancesSet);
        const maxDistance = parseFloat(uniqueDistances[uniqueDistances.length - 1]);

        const uniqueControls = new Set(this.recentControlInputs).size;
        const age = Math.max(1,((new Date().getTime() - this.birth) / 1000));
        const totalSpeed = this.recentSpeeds.reduce((a, b) => a + b, 0);
        this.avgSpeed = totalSpeed / this.recentSpeeds.length;

        if(!this.stuck &&
            this.recentDistances.length == 500 && 
            this.recentDistances.length - uniqueDistancesCount > 100) {
            this.stuck = true;
        }

        if(!this.stuck &&
            this.recentControlInputs.length == 1000 && 
            this.recentControlInputs.length - uniqueControls > 5) {
            this.stuck = true;
        }

        if(!this.stuck &&
            this.recentSpeeds.length > 450 && 
            this.avgSpeed < 0.2) {
            this.stuck = true;
        }

        this.fitness = (age + (this.movements + this.avgSpeed) * maxDistance) ^ -this.kills;
        this.score = Math.ceil((this.avgSpeed > (this.maxSpeed / 2)) ? (age * (uniqueControls + maxDistance + this.movements)) : 0);

        return kills;
    }

    mutate() {
        this.mutates++;
        this.stuck = false;
        this.recentTravelDistances = [];
        this.recentControlInputs = [];
        this.recentDistances = [];
        this.recentSpeeds = [];
        NeuralNetwork.mutate(this.brain,0.01);
    }

    #buildNewBrain(){
        this.brain=new NeuralNetwork(
            [this.sensor.rayCount,13,4]
        );
    }

    #assessDamage(dishEdges,otherCells){
        
        for(let i=0;i<dishEdges.length;i++){
            if(polysIntersect(this.polygon,dishEdges[i])){
                this.damaged = true;
            }
        }

        let kills = 0;
        const ticks = new Date().getTime()
        for(let i=0;i<otherCells.length;i++){

            if(ticks - otherCells[i].birth < 2500) {
                continue;
            }

            if(polysIntersect(this.polygon,otherCells[i].polygon)) {
                this.damaged = true;

                if(!otherCells[i].dumb) {
                    otherCells[i].damaged = true;
                }
                
                //if(this.fitness > otherCells[i].fitness) {
                //    otherCells[i].damaged = true;
                //    kills++;
                //}
            }
        }
        
        return kills;
    }

    #createPolygon(){
        const points=[];
        const rad=Math.hypot(this.width,this.height)/2;
        const alpha=Math.atan2(this.width,this.height);
        points.push({
            x:this.x-Math.sin(this.angle-alpha)*rad,
            y:this.y-Math.cos(this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(this.angle+alpha)*rad,
            y:this.y-Math.cos(this.angle+alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle-alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle-alpha)*rad
        });
        points.push({
            x:this.x-Math.sin(Math.PI+this.angle+alpha)*rad,
            y:this.y-Math.cos(Math.PI+this.angle+alpha)*rad
        });
        return points;
    }

    #move(){
        
        if(this.controls.forward){
            this.speed+=this.acceleration;
        }
        else if(this.controls.reverse){
            this.speed-=(this.acceleration * 1.1);
        }

        if(this.speed>this.maxSpeed){
            this.speed=this.maxSpeed;
        }
        if(this.speed<-this.maxSpeed){
            this.speed=-this.maxSpeed;
        }

        if(this.speed>0){
            this.speed-=this.friction;
        }
        if(this.speed<0){
            this.speed+=this.friction;
        }
        if(Math.abs(this.speed)<this.friction){
            this.speed=0;
        }

        if(this.speed!=0){
            const flip=this.speed>0?1:-1;
            if(this.controls.left){
                this.angle+=0.03*flip;
            }
            if(this.controls.right){
                this.angle-=0.03*flip;
            }
        }

        const xt = Math.sin(this.angle)*this.speed;
        const yt = Math.cos(this.angle)*this.speed;
        const t = Math.abs(xt + yt);

        this.x-=xt;
        this.y-=yt;
        this.travelled += t;

        this.recentTravelDistances.push(t);
        this.recentTravelDistances = this.recentTravelDistances.slice(-10);

        this.recentControlInputs.push(this.controls.toNumber());
        this.recentControlInputs = this.recentControlInputs.slice(-1000);

        this.recentSpeeds.push(Math.abs(this.speed));
        this.recentSpeeds = this.recentSpeeds.slice(-500);
    }

    draw(ctx,drawSensor=false){
        
        if(this.damaged){
            ctx.fillStyle="red";
        }
        else if(this.stuck){
            ctx.fillStyle="white";
        }
        else{
            ctx.fillStyle=this.family.colour;
        }

        if(this.sensor && drawSensor){
            this.sensor.draw(ctx);
        }

        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x,this.polygon[0].y);
        for(let i=1;i<this.polygon.length;i++){
            ctx.lineTo(this.polygon[i].x,this.polygon[i].y);
        }
        ctx.fill();
    }   
}