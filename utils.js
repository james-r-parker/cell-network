function lerp(A,B,t){
    return A+(B-A)*t;
}

function getIntersection(A,B,C,D){ 
    const tTop=(D.x-C.x)*(A.y-C.y)-(D.y-C.y)*(A.x-C.x);
    const uTop=(C.y-A.y)*(A.x-B.x)-(C.x-A.x)*(A.y-B.y);
    const bottom=(D.y-C.y)*(B.x-A.x)-(D.x-C.x)*(B.y-A.y);
    
    if(bottom!=0){
        const t=tTop/bottom;
        const u=uTop/bottom;
        if(t>=0 && t<=1 && u>=0 && u<=1){
            return {
                x:lerp(A.x,B.x,t),
                y:lerp(A.y,B.y,t),
                offset:t
            }
        }
    }

    return null;
}

function polysIntersect(poly1, poly2){
    for(let i=0;i<poly1.length;i++){
        for(let j=0;j<poly2.length;j++){
            const touch=getIntersection(
                poly1[i],
                poly1[(i+1)%poly1.length],
                poly2[j],
                poly2[(j+1)%poly2.length]
            );
            if(touch){
                return true;
            }
        }
    }
    return false;
}

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function getRndFloat(min, max) {
    return Math.random() * (max - min + 1) + min;
}

function randomBool() {
    return Math.random() > 0.5;
}

function hashCode(str) {
    var hash = 0,
      i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

function quantile (arr, q) {
    const pos = (arr.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (arr[base + 1] !== undefined) {
        return arr[base] + rest * (arr[base + 1] - arr[base]);
    } else {
        return arr[base];
    }
};

function boundingBox(cell1, cell2) {
   
    const cell1Box = { 
        top : cell1.x + (cell1.sensor?.rayLength ?? (cell1.height / 2)),
        bottom : cell1.x - (cell1.sensor?.rayLength ?? (cell1.height / 2)),
        right : cell1.y - (cell1.sensor?.rayLength ?? (cell1.width / 2)),
        left : cell1.y + (cell1.sensor?.rayLength ?? (cell1.width / 2))
    };

    const cell2Box = { 
        top : cell2.x + (cell2.sensor?.rayLength ?? (cell2.height / 2)),
        bottom : cell2.x - (cell2.sensor?.rayLength ?? (cell2.height / 2)),
        right : cell2.y - (cell2.sensor?.rayLength ?? (cell2.width / 2)),
        left : cell2.y + (cell2.sensor?.rayLength ?? (cell2.width / 2))
    };
    
    return (
        cell1Box.top > cell2Box.bottom &&
        cell1Box.right < cell2Box.left &&
        cell1Box.bottom < cell2Box.top &
        cell1Box.left > cell2Box.right
    );
}