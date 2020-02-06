
const brick_hit = new Audio();
brick_hit.src = 'sounds/brick_hit.mp3';

const life_lost = new Audio();
life_lost.src = 'sounds/life_lost.mp3';

const paddle_wall_hit = new Audio();
paddle_wall_hit.src = 'sounds/paddle_wall_hit.mp3';

const level_cleared = new Audio();
level_cleared.src = 'sounds/level_cleared.mp3';

const game_over_sound = new Audio();
game_over_sound.src = 'sounds/sonic_game_over.mp3';

const happy_end = new Audio();
happy_end.src = 'sounds/happy_end.mp3';


const config = {
  renderer: Phaser.CANVAS,
  width: 1200,
  height: 850,
  state: {
    preload,
    create,
    update,
  },
  transparent: false,
  antialias: true,
}

let game = new Phaser.Game(config);

let ballVelocityX = -0;
let ballVelocityY = -300;

let paddle;
let paddleInfo = {
  width: 200,
  height: 20,
  speed: 20
}

let ball;
let ballInfo = {
  radius: 16
}

let brickInfo = {
  width: 95,
  height: 25,
  count: {
    rows: 1,
    columns: 10
  },
  offset: {
    top: 8
  },
  marginTop: config.height * 0.08,
  padding: 15
}
let bricks; //brick group
let newBrick;

const pdlStPosX = config.width * 0.5 - paddleInfo.width / 2;
const pdlStPosY = config.height - 20;
const ballStPosX = config.width * 0.5;
const ballStPosY = config.height - paddleInfo.height - ballInfo.radius - 11;

let currentVelX;
let currentVelY;

let score = 0;
let scoreText;
let score_img;
let scoreTextFin;

let lives = 3;
let lifeText;
let lifeLostText;
let life_img;

let level = 1;
const maxLevel = 8;
let levelText;
let level_img;

let inputPos;
let cursors;
let rightOrLeft = false;

let ballOnPaddle = true;
let afterRestart = true;
const textStyle = { font: '600 40px Alegreya, serif', fill: 'white' };

let gamePaused = true;
let spaceHasBeenPressed = false;

let sound;
let pausePlay;
const bigIconImgSize = 50;

const pausePlayIcon = {
  x: 15 + bigIconImgSize + 15,
  y: config.height - bigIconImgSize - 10
}

const soundIcon = {
  x: 15,
  y: config.height - bigIconImgSize - 10
}
let transparent;
let layer_1;
let layer_2;
let layer_3;

let playAgain;
let playAgainSetUp = {
  x: config.width * 0.5,
  y: config.height * 0.8,
  textStyle: {
    font: '600 73px Alegreya, serif',
    fill: 'white'
  }
}

//  The Google WebFont Loader will look for this object, so create it before loading the script.
WebFontConfig = {
  //  'active' means all requested fonts have finished loading
  //  We set a 1 second delay before calling 'createText'.
  //  For some reason if we don't the browser cannot render the text the first time it's created.
  //active: function () { createText(); },
  //  The Google Fonts we want to load (specify as many as you like in the array)
  google: {
    families: ['Alegreya']
  }
};


function preload() { //preloading 
  game.load.script('webfont', 'http://ajax.googleapis.com/ajax/libs/webfont/1.6.16/webfont.js');

  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL; //object scale, scales the canvas, but keeps the aspect ratio untouched
  game.scale.pageAlignHorizontally = true; //canvas is centered
  game.scale.pageAlignVertically = true;

  game.load.image('ball', 'img/ball.png');
  game.load.image('paddle', 'img/paddle.png');
  game.load.image('brick', 'img/brick.png');
  game.load.image('bg', 'img/bg3.png');
  game.load.image('pause', 'img/pause.png');
  game.load.image('play', 'img/play.png');
  game.load.image('life_img', 'img/life.png');
  game.load.image('score_img', 'img/score.png');
  game.load.image('level_img', 'img/flag.png');
  game.load.image('sound_on', 'img/SOUND_ON.png');
  game.load.image('sound_off', 'img/SOUND_OFF.png');
  game.load.image('transparent', 'img/transparent.png');
  game.load.image('win', 'img/youwon.png');  
  game.load.image('lose', 'img/gameover.png');

}


function create() { //executing once after ready
  const backgound = game.add.image(0, 0, 'bg');
  backgound.width = game.width;
  backgound.height = game.height;
  //layer_0 = background
  layer_1 = game.add.group(); //all buttons and things 
  layer_2 = game.add.group(); //transparent bg
  layer_3 = game.add.group(); //win, lose, playAgain
  createText();

  game.physics.startSystem(Phaser.Physics.ARCADE); //ARCADE physics mode -- the easiest
  game.physics.arcade.checkCollision.down = false; //ball wont collide when moving down

  paddle = layer_1.create(pdlStPosX, pdlStPosY, 'paddle');
  paddle.width = paddleInfo.width;
  paddle.height = paddleInfo.height;
  //to the center of world //here, the world is the same size as canvas
  game.physics.enable(paddle, Phaser.Physics.ARCADE);

  paddle.body.immovable = true; //wont move
  paddle.body.collideWorldBounds = true;
  paddle.checkWorldBounds = true;
  paddle.body.bounce.set(1);
  paddle.anchor.set(0.5, 0.5);

  ball = layer_1.create(ballStPosX, ballStPosY, 'ball'); //'ball' is a reference to Cache assets storage
  ball.width = ballInfo.radius * 2;
  ball.height = ballInfo.radius * 2;
  ball.anchor.set(0.5, 0.5);
  game.physics.enable(ball, Phaser.Physics.ARCADE);

  ball.body.collideWorldBounds = true; //world boundaries are defined by canvas of sprite object
  ball.body.bounce.set(1); //wont lose speed and energy
  ball.body.onWorldBounds = new Phaser.Signal();
  ball.body.onWorldBounds.add(function () { paddle_wall_hit.play(); }, this);
  ball.checkWorldBounds = true; //check if its within the bounds --if not -> onOutOfBounds

  ball.events.onOutOfBounds.add(function () {
    lifeLost();
  }, this);
  
  createBricks();
  life_img = layer_1.create(game.world.width * 0.944, game.world.height * 0.04, 'life_img');
  life_img.scale.setTo(0.11, 0.11);
  life_img.anchor.set(0.5, 0.5);

  level_img = layer_1.create(game.world.width * 0.48, game.world.height * 0.0388, 'level_img');
  level_img.scale.setTo(0.07, 0.07);
  level_img.anchor.set(0.5, 0.5);

  score_img = layer_1.create(game.world.width * 0.025, game.world.height * 0.04, 'score_img');
  score_img.scale.setTo(0.28, 0.28);
  score_img.anchor.set(0.5, 0.5);

  sound = layer_1.create(soundIcon.x, soundIcon.y, 'sound_on');
  sound.width = bigIconImgSize;
  sound.height = bigIconImgSize;
  sound.inputEnabled = true;
  sound.input.useHandCursor = true;
  sound.events.onInputDown.add(audioManager, this);

  pausePlay = layer_1.create(pausePlayIcon.x, pausePlayIcon.y, 'play');
  pausePlay.width = bigIconImgSize;
  pausePlay.height = bigIconImgSize;
  pausePlay.inputEnabled = true;
  pausePlay.input.useHandCursor = true;
  pausePlay.events.onInputDown.add(function() {
    spaceHasBeenPressed = true;
    pausePlayManager();
    spaceHasBeenPressed = false;
  }, this);

  transparent = game.add.image(0, 0, 'transparent');
  layer_2.add(transparent);
  transparent.visible = false;
  
  scoreTextFin = game.add.text(game.world.width * 0.5, game.world.height * 0.7, `Your score:  ${score}`, { font: '600 45px Alegreya, serif', fill: 'white' });
  scoreTextFin.anchor.setTo(0.5, 0.5);
  layer_3.add(scoreTextFin);
  scoreTextFin.visible = false;

  playAgain = game.add.text(playAgainSetUp.x, playAgainSetUp.y, 'Play again', playAgainSetUp.textStyle);
  playAgain.anchor.set(0.5, 0.5);
  playAgain.visible = false;
  playAgain.inputEnabled = true;
  playAgain.events.onInputOver.add(function () { playAgain.fill = '#A0DB8E'; }, this);
  playAgain.events.onInputOut.add(function () { playAgain.fill = '#FFF'; }, this);
  playAgain.events.onInputDown.add(function () { location.reload(); });
  layer_3.add(playAgain);

  game.input.keyboard.enabled = true;
  game.input.keyboard.onUpCallback = function (e) {
    if (e.keyCode == Phaser.Keyboard.SPACEBAR) {
      spaceHasBeenPressed = true;
      pausePlayManager();
      spaceHasBeenPressed = false;
    }
  }
  cursors = game.input.keyboard.createCursorKeys();
}
function createText() {
  scoreText = game.add.text(game.world.width * 0.064, game.world.height * 0.04, `${score}`, textStyle);
  scoreText.anchor.set(0.5, 0.5);
  layer_1.add(scoreText);

  levelText = game.add.text(game.world.width * 0.52, game.world.height * 0.04, `${level}`, textStyle);
  levelText.anchor.set(0.5, 0.5);
  layer_1.add(levelText);

  lifeText = game.add.text(game.world.width * 0.983, game.world.height * 0.04, `${lives}`, textStyle);
  lifeText.anchor.set(0.5, 0.5);
  layer_1.add(lifeText);

  lifeLostText = game.add.text(game.world.width * 0.5, game.world.height * 0.5, 'Press space to start', { font: '600 40px Alegreya, serif', fill: '#0095DD' });
  lifeLostText.anchor.set(0.5, 0.5);
  lifeLostText.visible = true;
  layer_1.add(lifeLostText);
}


function update() { //executed on every frame
  game.physics.arcade.collide(ball, paddle, ballHitPaddle);
  game.physics.arcade.collide(ball, bricks, ballHitBrick); // third parameter is a function executed when occured

  if (gamePaused == false) {
    if (game.input.activePointer) {
      if (cursors.right.isDown || cursors.left.isDown) {
        rightOrLeft = true;
        if (cursors.right.isDown) {
          paddle.x += paddleInfo.speed;
        }
        if (cursors.left.isDown) {
          paddle.x -= paddleInfo.speed;
        }
        inputPos = game.input.x;
      }
      else if (game.input.x != inputPos) {
        paddle.x = game.input.x;
      }
    }
    if ((cursors.right.isDown == false && cursors.left.isDown == false) && game.input.x == 0 && rightOrLeft == false) {
      paddle.x = game.world.width * 0.5;
      rightOrLeft = false;
    }
  }

  if (paddle.x < paddle.width / 2) {
    paddle.x = paddle.width / 2;
  }
  if (paddle.x > game.world.width - paddle.width / 2) {
    paddle.x = game.world.width - paddle.width / 2;
  }

  if (ballOnPaddle) {
    paddle.x = game.world.width * 0.5;
  }
}

function createBricks() {
  brickInfo.offset.left = ((game.world.width / brickInfo.count.columns) - brickInfo.width) / 2;
  bricks = game.add.group();
  layer_1.add(bricks);

  for (c = 0; c < brickInfo.count.columns; c++) {
    for (r = 0; r < brickInfo.count.rows; r++) {
      let brickX = c * (brickInfo.width + 2 * brickInfo.offset.left) + brickInfo.offset.left; //souřadnice x pro jednotlivý brick
      let brickY = (r * (brickInfo.offset.top * 2 + brickInfo.height)) + brickInfo.offset.top + brickInfo.marginTop; //souřadnice y pro jednotlivý brick
      newBrick = game.add.sprite(brickX, brickY, 'brick');
      newBrick.width = brickInfo.width;
      newBrick.height = brickInfo.height;
      game.physics.enable(newBrick, Phaser.Physics.ARCADE);
      newBrick.body.immovable = true;
      bricks.add(newBrick); //nový brick se přidá do skupiny
    }
  }
}
function ballHitPaddle() {
  paddle_wall_hit.play();
  if (!ballOnPaddle) {
    ball.body.velocity.x = -1 * 5 * (paddle.x - ball.x);
  }
}
function ballHitBrick(ball, brick) {
  brick_hit.play();
  brick.kill();
  score += 1;
  scoreText.setText(`${score}`);

  let aliveBricks = 0;
  for (i = 0; i < bricks.children.length; i++) { // group.children == all bricks
    if (bricks.children[i].alive == true) {
      aliveBricks++;
    }
  }
  if (aliveBricks == 0) {
    levelUp();
  }
}

function lifeLost() {
  life_lost.play();
  lives--;
  lifeText.text = lives;

  if (!lives) {
    youLose();
  }
  else {
    resetBall();
  }
  pausePlayManager();
}

function releaseBall(velX, velY) {
  paused();
  if (ballOnPaddle) {
    ball.body.x = paddle.x;
    ballOnPaddle = false;
  }
  if (gamePaused) {
    currentVelX = ball.body.velocity.x;
    currentVelY = ball.body.velocity.y;
    ball.body.velocity.setTo(0, 0);
  }
  else {
    ball.body.velocity.setTo(velX, velY);
  }
  lifeLostText.visible = false;
}

function resetBall() {
  afterRestart = true;
  ball.body.velocity.setTo(0, 0);
  ball.reset(ballStPosX, ballStPosY);
  paddle.reset(pdlStPosX, pdlStPosY);
  ballOnPaddle = true;
  gamePaused = true;
}

function paused() {
  gamePaused = !gamePaused;
}

function levelUp() {
  level_cleared.play();
  if (level >= maxLevel) {
    youWin();
    pausePlayManager();
    return;
  }
  else {
    level++;
    levelText.setText(`${level}`);
    ballVelocityX += 30;
    ballVelocityY += 30;
    if (paddleInfo.width > 50) {
      paddleInfo.width -= 15;
    }
  }
  brickInfo.count.rows++;
  createBricks();
  resetBall();
  pausePlayManager();
}

function audioManager() {
  let soundNewKey = sound.key == 'sound_on' ? 'sound_off' : 'sound_on';
  sound.kill();
  sound = game.add.sprite(soundIcon.x, soundIcon.y, soundNewKey, true);
  layer_1.add(sound);

  sound.width = bigIconImgSize;
  sound.height = bigIconImgSize;
  sound.inputEnabled = true;
  sound.input.useHandCursor = true;
  sound.events.onInputDown.add(audioManager, this);

  paddle_wall_hit.muted = paddle_wall_hit.muted ? false : true;
  brick_hit.muted = brick_hit.muted ? false : true;
  level_cleared.muted = level_cleared.muted ? false : true;
  life_lost.muted = life_lost.muted ? false : true;
  happy_end.muted = happy_end.muted ? false : true;
  game_over_sound.muted = game_over_sound.muted ? false : true;
}

function pausePlayManager() {
  let pausePlayNewKey = pausePlay.key == 'play' ? 'pause' : 'play';
  pausePlay.kill();
  pausePlay = layer_1.create(pausePlayIcon.x, pausePlayIcon.y, pausePlayNewKey, true);

  pausePlay.width = bigIconImgSize;
  pausePlay.height = bigIconImgSize;
  pausePlay.inputEnabled = true;
  pausePlay.input.useHandCursor = true;
  pausePlay.events.onInputDown.add(function() {
    spaceHasBeenPressed = true;
    pausePlayManager();
    spaceHasBeenPressed = false;
  }, this);

  if (spaceHasBeenPressed == true) {
    if (afterRestart == true) {
      releaseBall(ballVelocityX, ballVelocityY);
      afterRestart = false;
    }
    else {
      releaseBall(currentVelX, currentVelY);
    }
  }
  if (spaceHasBeenPressed == false) {
    afterRestart == true;
  }
}

function youLose() {
  resetBall();
  game_over_sound.play();
  transparent.visible = true;
  let lose = game.add.image(game.world.width * 0.5, game.world.height * 0.57, 'lose');
  layer_3.add(lose);
  lose.anchor.setTo(0.5, 0.5);
  lose.scale.setTo(2.2, 2.2);
  playAgain.visible = true;
  game.input.keyboard.enabled = false;
  scoreTextFin.setText(`Your score:  ${score}`);
  scoreTextFin.visible = true;
  
};

function youWin() {
  resetBall();
  happy_end.play();
  let win = game.add.image(game.world.width * 0.5, game.world.height * 0.38, 'win');
  layer_3.add(win);
  win.anchor.setTo(0.5, 0.5);
  win.scale.setTo(0.8, 0.8);
  transparent.visible = true;
  playAgain.visible = true;
  game.input.keyboard.enabled = false;
  scoreTextFin.setText(`Your score:  ${score}`);
  scoreTextFin.visible = true;
}