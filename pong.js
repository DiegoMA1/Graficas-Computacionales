let index = 0;
let keysDown = {
    'w': false,
    's': false,
    'ArrowUp': false,
    'ArrowDown': false,
};
class barra
{
    constructor(x, y, width, height, keyUp, keyDown, speed=2)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.keyUp = keyUp;
        this.keyDown = keyDown;
    }

    moveUp()
    {
        this.y -= this.speed;
    }

    moveDown()
    {
        this.y += this.speed;
    }

    draw(context)
    {
        context.fillStyle = 'white';
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    update()
    {
        if(keysDown[this.keyUp])
            this.moveUp();
        if(keysDown[this.keyDown])
            this.moveDown();
    }
}

class pelota
{
    constructor(x, y, radio, speed=1.5)
    {
        this.x = x;
        this.y = y;
        this.radio = radio;
        this.speed = speed;

        this.up = true;
        this.right = true;
    }

    draw(context)
    {
        context.fillStyle = 'white';
        context.beginPath();
        context.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        context.closePath();
        context.fill();
    }

    update(up, down, left, right)
    {
        if(this.up)
            this.y -= this.speed;
        else
            this.y += this.speed;

        if(this.right)
            this.x += this.speed;
        else
            this.x -= this.speed;

        if((this.y - this.radio) <= up){
            this.up = false;
            //console.log(this.y);
        }
        if((this.y + this.radio) >= down){
            this.up = true;
            //console.log(this.y)
        }
        if((this.x + this.radio) >= right){
            this.right = false;
            //console.log(this.x)
        }
        if((this.x - this.radio) <= left){
            this.right = true;
            //console.log(this.x)
        }
    }
}

function update(canvas,context, barras, bola)
{
    requestAnimationFrame(()=>update(canvas, context, barras, bola));
    context.clearRect(0,0,canvas.width,canvas.height);

    barras.forEach(bola =>{
        bola.draw(context);
        bola.update();
    });

    bola.update(0, canvas.height, 0, canvas.width);
}
function main()
{
    const canvas = document.getElementById("pongCanvas");
    const context = canvas.getContext("2d");
    let barraIzq = new barra(10,120,20,60,'w','s');
    let barraDer = new barra(570,120,20,60,'ArrowUp','ArrowDown');
    let bola = new pelota(canvas.width/2,canvas.height/2,10);

    let barras = [];

    barras.push(barraIzq, barraDer, bola);
    document.addEventListener('keydown', event => keysDown[event.key]= true);
    document.addEventListener('keyup', event => keysDown[event.key] = true);
    update(canvas, context, barras, bola);
}
