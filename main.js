(async () => {

    try {
        const globalBrainzResult = await fetch('/api/brainz');

        if(globalBrainzResult.ok) {
            const globalBrainz = await globalBrainzResult.json();
            const json = localStorage.getItem("table") || "[]";
            let table = [...JSON.parse(json), ...globalBrainz].sort((a,b) => b.score - a.score).slice(0,50);
            localStorage.setItem("table",JSON.stringify(table));      
            localStorage.setItem("bestBrain",JSON.stringify(table[0].brain));
        }
        
        const canvas=document.getElementById("game");
        canvas.width=window.innerWidth;
        canvas.height=window.innerHeight;
        
        const ctx = canvas.getContext("2d");
    
        const dish=new Dish(canvas.width/2,window.innerWidth, window.innerHeight * 0.95);
        
        const maxCells = 150;
        let spawns = 0;
        let cells= [];
        
        cells.push(new Cell(canvas.width / 2, canvas.height / 2, 200,200, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        cells.push(new Cell(canvas.width / 2, canvas.height / 1.2, 100,100, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        cells.push(new Cell(canvas.width / 8, canvas.height / 2, 100,100, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        cells.push(new Cell(canvas.width / 8, canvas.height / 1.2, 100,100, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        cells.push(new Cell(canvas.width / 2, canvas.height / 8, 100,100, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        cells.push(new Cell(canvas.width / 8, canvas.height / 8, 100,100, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        cells.push(new Cell(canvas.width / 1.15, canvas.height / 8, 100,100, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        cells.push(new Cell(canvas.width / 1.15, canvas.height / 2, 100,100, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        cells.push(new Cell(canvas.width / 1.15, canvas.height / 1.2, 100,100, { weight : 1000, colour : "black"}, 0.01, 0.00001, 0.00000001, true));
        
        generateCells(maxCells);
        let best=cells[0];
        
        animate();
        
        function save(force) {
        
            const currentBest = cells
            .filter(c => !c.dumb && !c.damaged && !c.stuck)
            .sort((a,b) => b.score - a.score)[0];
        
            const bestAge = (new Date().getTime() - currentBest.birth) / 1000;
        
            if(force || (bestAge > 45 && currentBest.score > 20000)) {
                const json = localStorage.getItem("table") || "[]";
                let table = JSON.parse(json);
            
                if(table.filter(x => x.id == currentBest.id || x.brain.hash == currentBest.brain.hash).length <= 0) {
                    
                    const newItem = { 
                        id : currentBest.id,
                        age : new Date().getTime() - currentBest.birth,
                        movements : currentBest.movements,
                        travelled : currentBest.travelled,
                        brain : currentBest.brain,
                        height : currentBest.height,
                        width : currentBest.width,
                        fitness : currentBest.fitness,
                        kills : currentBest.kills,
                        score : currentBest.score
                    };

                    table.push(newItem);
                
                    table = table.sort((a,b) => b.score - a.score).slice(0,50);
                
                    localStorage.setItem("table",JSON.stringify(table));
            
                    localStorage.setItem("bestBrain",JSON.stringify(table[0].brain));
            
                    document.getElementById("lblTable").innerText = `Table(${table.length}) : Age ${(table[0].age / 1000).toFixed(0)}`

                    if(table.filter(x => x.id == newItem.id).length > 0) {
                        fetch('/api/brainz', { method : "POST", body : JSON.stringify(newItem), headers : { "Content-Type" : "application/json" }});
                    }
                }    
            }
        }
        
        document.body.onkeyup = function(e) {
            if (e.key == " " ||
                e.code == "Space" ||      
                e.keyCode == 32      
            ) {
              save(true);
            }
        }
        
        function discard(){
            localStorage.removeItem("bestBrain");
            localStorage.removeItem("table");
        }
        
        function getSafeLocation() {
            
            let location = { 
                x : getRndInteger(canvas.width * 0.05,canvas.width * 0.95),
                y : getRndInteger(canvas.height * 0.05,canvas.height  * 0.95)
            }
        
            while(cells.filter(c => 
                !c.damaged && 
                c.x <= location.x + c.width &&
                c.x >= location.x - c.width &&
                c.y <= location.y + c.height &&
                c.y >= location.y - c.height).length > 0) {
                    location = { 
                        x : getRndInteger(canvas.width * 0.05,canvas.width * 0.95),
                        y : getRndInteger(canvas.height * 0.05,canvas.height  * 0.95)
                    }
                
                }
        
            return location;
        }
        
        function generateCells(count){
        
            const families = cells.filter(c => !c.dumb).reduce((p, c) => {
                if(p[c.family.weight]) {
                    p[c.family.weight]++;
                }
                else {
                    p[c.family.weight] = 1;
                }
                return p;
            },{});
        
            const rare = Object.getOwnPropertyNames(families)
                .map(x => { return { family : Cell.families.find(f => f.weight == x), count : families[x]}; })
                .sort((a, b) => a.count - b.count)[0];
        
        
            let table = [];
            if(localStorage.getItem("table")) {
                table = JSON.parse(localStorage.getItem("table"))
            }
        
            for(let i = 0; i <= count; i++){
        
                const location = getSafeLocation();
        
                const newCell = new Cell(
                    location.x,
                    location.y
                );
        
                if(rare) {
                    newCell.family = { weight : rare.family.weight, colour : rare.family.colour };
                }
        
                if(table.length > 0 && spawns % 2 == 0) {
        
                    const index = (spawns % table.length);
        
                    newCell.brain = table[index].brain;
                
                    if(i != 0 || count != maxCells){
                        NeuralNetwork.mutate(newCell.brain,0.1);
                    }
                }
                
                cells.push(newCell);
                spawns++;
            }
        }
        
        setInterval(() => {
            save();
        },[2000]);
        
        function animate(time){
        
            cells = cells
                .filter(c => !c.damaged && c.mutates < 20)
                .sort((a,b) => b.fitness - a.fitness);
        
            const newCells = [];
            for(let i = 0; i < cells.length; i++) {
        
                if(cells[i].dumb) {
                    continue;
                }
        
                if(cells[i].stuck) {
                    cells[i].mutate();
                }
        
                const kills = cells[i].update(dish.borders,cells);
                if(kills > 0 && cells.filter(c => c.family.weight == cells[i].family.weight).length < (maxCells / 3)) {
                    newCells.push(Cell.clone(cells[i]));
                }
            }
        
            for(let i = 0; i < newCells.length; i++) {
                cells.push(newCells[i]);
            }
        
            const missing = maxCells - cells.length;
            if(missing > 0) {
                generateCells(missing);   
            }
        
            best = cells
                .filter(c => !c.dumb && !c.damaged && !c.stuck)
                .sort((a,b) => b.score - a.score)[0];
        
            canvas.height=window.innerHeight;
        
            dish.draw(ctx);
         
            const fitness = cells.map(c => c.fitness).sort((a, b) => a - b);
            const average = fitness.reduce((a, b) => a + b, 0) / fitness.length;
            const p90 = quantile(fitness, 0.9);
        
            for(let i=0;i<cells.length;i++){
                const f = cells[i].fitness;
                ctx.globalAlpha= f > p90 ? 0.9 : f > average ? 0.5 : 0.25;
                cells[i].draw(ctx,false);
            }
        
            ctx.globalAlpha=1;
            best.draw(ctx,true);
        
            document.getElementById("lblCells").innerText = `Cells : ${cells.length} Spawns ${spawns}.`;
            document.getElementById("lblBest").innerText = 
                `Score : ${best.score} Fitness : ${best.fitness.toFixed(2)} Age : ${((new Date().getTime() - best.birth) / 1000).toFixed(0)} Speed : ${Math.abs(best.speed).toFixed(2)} Travelled : ${best.travelled.toFixed(2)} Distance : ${best.distance.toFixed(2)}  Movements : ${best.movements}  Kills : ${best.kills} Brain : ${best.brain.hash}.`;
        
            requestAnimationFrame(animate);
        }

        document.getElementById("btnSave").onclick = () => { save(true) };
        document.getElementById("btnClear").onclick = discard;
    }
    catch(e) {
        console.error(e);
    }

})();