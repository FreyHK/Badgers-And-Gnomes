
var deltaT = 1 / 60;
var entities = [];

var worldWidth = 600;
var worldHeight = 600;

function setup() {
    createCabbage(200, 400);
    createGnome(500, 400);
    createBadger(300, 200);

    frameRate(60);
    createCanvas(worldWidth, worldHeight);
}

var isPaused = false;
var spawning = 'cabbage';

function keyPressed() {
    if (key === ' ') {
        isPaused = !isPaused;
        if (isPaused) {
            noLoop();
        }else {
            loop();
        }
    } else if (key === '1') {
        spawning = 'cabbage';
    } else if (key === '2') {
        spawning = 'gnome';
    } else if (key === '3') {
        spawning = 'badger';
    } else if (key === 'r') {
        entities = [];
    }

    drawFrame ();
}

function mouseClicked() {
    switch (spawning) {
        case 'cabbage':
            createCabbage(mouseX, mouseY);
            break;
        case 'gnome':
            createGnome(mouseX, mouseY);
            break;
        case 'badger':
            createBadger(mouseX, mouseY);
            break;
        default:
            break;
    }
    drawFrame ();
    // prevent default
    return false;
}

function createCabbage(x, y) {
    let b = new Entity('cabbage', new Victor(x, y), 12, 0, 100, '#2ecc71', []);
    entities.push(b);
}

function createBadger(x, y) {
    let behaviors = [new HuntBehavior('gnome'), new WanderBehavior()];
    let b = new Entity('badger', new Victor(x, y), 25, 65, 10, '#d35400', behaviors);
    entities.push(b);
}

function createGnome(x,  y) {
    let behaviors = [new HuntBehavior('cabbage'), new FleeBehavior('badger'), new WanderBehavior()];
    let b = new Entity('gnome', new Victor(x, y), 20, 65, 10, '#3498db', behaviors);
    entities.push(b);
}

function draw() {
    entities.forEach(e => {
        e.update();
    });

    drawFrame ();

    //Filter dead from array
    entities = entities.filter((e) => {
        return e.health > 0;
    });
}

function drawFrame () {
    background('#16a085');

    entities.forEach(e => {
        e.draw();
    });

    //Bottom UI
    fill('black')
    textFont('Georgia');
    textSize(20);
    text("Creating " + spawning, 0, worldHeight-25, 300, 50);
}

class Entity {
    constructor(type, position, radius, speed, health, color, behaviors) {
        this.type = type;
        this.position = position;
        this.radius = radius;
        this.speed = speed;        
        this.health = health;
        this.maxHealth = health;
        this.color = color;
        this.behaviors = behaviors;
    }

    takeDamage(dmg) {
        this.health -= dmg;
    }

    gainHealth(hp) {
        this.health = clamp(this.health + hp, 0, this.maxHealth);
    }

    update() {
        //Lose a little health
        this.health -= .75 * deltaT;

        let vec = new Victor(0, 0);

        this.behaviors.forEach(b => {
            vec.add(b.getWeightedDir(this));
        });
        if (this.behaviors.length > 0) {
            vec.normalize();
        }
        this.position.add(vec.multiplyScalar(this.speed * deltaT));
    }

    draw() {
        //Draw body
        fill(color(this.color));
        
        stroke('#2c3e50');
        ellipse(this.position.x, this.position.y, this.radius, this.radius);

        //Todo: Draw health
        noStroke();
        fill('#c0392b');
        let x = this.position.x - this.radius / 2;
        let y = this.position.y - this.radius;
        rect(x, y, this.radius * this.health/this.maxHealth, 5);
    }
}

class HuntBehavior {

    constructor(target) {
        this.target = target;
        this.priority = 15;
    }

    getWeightedDir(self) {
        let closest = null;
        let dist = 999999;
        entities.forEach(e => {
            if (e.type === this.target) {
                let d = self.position.distance(e.position);
                if (d < dist) {
                    closest = e;
                    dist = d;
                }
            }
        });

        //Can we eat this?
        if (dist <= self.radius) {
            closest.takeDamage(5 * deltaT);
            self.gainHealth(5 * deltaT);
        }

        let vec = new Victor(0, 0);
        if (dist > self.radius/2 && closest !== null) {
            vec = new Victor(closest.position.x - self.position.x, closest.position.y - self.position.y);
            vec.normalize();
            vec.multiplyScalar(this.priority);
        }
        return vec;
    }
}

class FleeBehavior {

    constructor(target) {
        this.target = target;
        this.priority = 25;
        this.range = 150;
    }

    getWeightedDir(self) {
        let vec = new Victor(0, 0);
        entities.forEach(e => {
            if (e.type === this.target) {
                let delta = new Victor(self.position.x - e.position.x, self.position.y - e.position.y);
                let distWeight = Math.max(this.range - delta.length(), 0) / this.range;
                delta.normalize();
                delta.multiplyScalar(distWeight * this.priority);
                vec.add(delta);
            }
        });

        if (vec.x === 0 && vec.y === 0) {
            return vec;
        }
        vec.normalize();
        vec.multiplyScalar(this.priority);
        return vec;
    }
}

class WanderBehavior {

    constructor() {
        this.priority = .1;
        this.angle = Math.random() * Math.PI * 2;
    }

    getWeightedDir(self) {
        let t = new Date().getTime();
        let n = noise(t, 0, 0) * 2 - 1;
        console.log(n);
        this.angle = (this.angle + n * 10 * deltaT) % (Math.PI * 2);

        let vec = new Victor(Math.cos(this.angle), Math.sin(this.angle));
        
        vec.multiplyScalar(this.priority);
        return vec;
    }
}