class Point{
    constructor(x,y){
      this.x =x;
      this.y=y
    }
}
function main(){
    var canvasElement = document.querySelector("canvas");
    var context = canvasElement.getContext("2d");

    let pointln = canvas.height * 2 /3;
    let length = pointln/ Math.sin(60 * Math.PI / 180);
    let v0 = new Point(canvas.width/2,(canvas.height - pointln)/2);
    let v1 = new Point((canvas.width- length)/2, v0.y + pointln);
    let v2 = new Point((v1.x + length),v1.y)
    drawTriangle(context, v0, v1, v2, "#DD0C97");
    sierpinski(context, v0, v1, v2, 1, 4);

}
function drawTriangle(context, v0, v1, v2, type) {

    context.save();
    context.fillStyle = type;
    context.beginPath();
    context.moveTo(v0.x, v0.y);
    context.lineTo(v1.x, v1.y);
    context.lineTo(v2.x, v2.y);
    context.fill();
    context.stroke();
    context.restore();
  }
  function sierpinski(context, v0, v1, v2, cont, steps){
      if(cont>=steps){
          return;
      }
      cont++;
      var mp = middlePoint(v0,v1);
      var mp2 = middlePoint(v1,v2);
      var mp3 = middlePoint(v0,v2);
      drawTriangle(context, mp, mp2, mp3, "white");

      sierpinski(context, v0,mp,mp3,cont,steps);
      sierpinski(context, mp,v1,mp2,cont,steps);
      sierpinski(context, mp3,mp2,v2,cont,steps);
      cont--;
  }
  function middlePoint(a,b){
      return new Point ((a.x + b.x)/2,(a.y + b.y)/2);
    let c = new point;
    c.x = (a.x + b.x)/2;
    c.y = (a.y + b.y)/2;
  }
