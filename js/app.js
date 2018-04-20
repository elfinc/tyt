
var width = $d.pageWidth, height = self.innerHeight / self.innerWidth * width;
document.querySelector('[name="viewport"]')
  .setAttribute('content', 'width=' + width + ', user-scalable=no');

var game = new Phaser.Game(width, height, Phaser.AUTO, '', { preload, create, update });
var ease = Phaser.Easing;

function preload() {
  var load = game.load;
  load.spritesheet('p', $d.poi.url, $d.poi.w, $d.poi.h);
  Object.keys($d.ef).forEach(k => {
    load.image('e_' + k, $d.ef[k].url);
  });
  Object.keys($d.sound).forEach(k => {
    load.audio('s_' + k, $d.sound[k].url);
  })
  $d.box = $d.box.filter(v => {
    if (v.test) return;
    load.image(v.url, v.url);
    return true;
  });
}

function create() {
  initWorld();
  gameReady();
  test();
}

function update() {
  if (isFocusOn) focusAning();
}

function test() {
  var l0 = new Phaser.Line(0, height / 2, width, height / 2);
  var l1 = new Phaser.Line(width / 2, 0, width / 2, height);
  // game.debug.geom(l0, '#fff');
  // game.debug.geom(l1, '#fff');
}





var poi;                              // 跳子
var boxs = [];                        // 盒子们
var step = 0;                         // 当前第几步
var world;                            // 世界容器
var ui;                               // UI容器
var isGameOn;                         // 状态：游戏开始 T|F
var isFocusOn;                        // 状态：聚能中 T|F
var isJumpOn;                         // 状态：飞在天上 2|1|0
var isBaoliClick = 0;                 // 状态：暴力点击BUG
var focusPower = 0;                   // 聚集的能量点
var nextPoi = { x: 0, y: 0 };         // 下一步坐标
var cameraTween;                      // 镜头跟踪器
var poiOffset = -210;                 // 跳子Y方向偏移修复
var parcir;                           // 粒子贴图
var boxRing;                          // 聚能屁
var startBtn;                         // 开始按钮
var sounds = {                        // 音效
  focus: {},
  combo: {},
  drop: {},
};

/** 场景初始化 */
function initWorld() {
  createBG();
  // 世界
  world = game.add.group();
  world.position.set(game.world.centerX, game.world.centerY + 200);
  // 游戏输入
  game.input.onDown.add(gameInput, { down: true });
  game.input.onUp.add(gameInput, { up: true });
  // 跳子初始化
  poi = game.add.sprite(0, poiOffset, 'p', null, world);
  poi.anchor.set(0.5, 0.5);
  var poiJumAni = poi.animations.add('j', null, 30);
  poiJumAni.onComplete.add(() => {
    poi.scale.x = 1;
    poiJumAni.frame = 0;
    jumpOver();
  });
  // 什么鬼乱七八糟特效初始化
  parcir = {
    w: game.add.bitmapData(10, 10).circle(5, 5, 5, '#fff'),
    g: game.add.bitmapData(10, 10).circle(5, 5, 5, '#5a5')
  }
  boxRing = game.add.sprite(0, -110, 'e_ring', null, world);
  boxRing.alpha = 0;
  // UI初始化
  ui = game.add.group();
  // 开始按钮初始化
  startBtn = game.add.button(width / 2, height - 200, 'e_startBtn', function () {
    startBtn.inputEnabled = false;
    game.add.tween(startBtn)
      .to({ alpha: 0 }, 500, ease.Circular.InOut)
      .start();
    gameStart();
  }, null, null, null, null, null, ui);
  startBtn.anchor.set(0.5);
  startBtn.inputEnabled = false;
  startBtn.alpha = 0;
  // 音效初始化
  var focuSound = game.add.audio('s_focus');
  focuSound.addMarker('start', 0, 2.16, 1, false);
  focuSound.addMarker('loop', 2.25, 0.6, 1, true);
  focuSound.onMarkerComplete.add(function (a, b) {
    if (a == 'start' && !b.d_d) setTimeout(() => {
      focuSound.play('loop');
    }, 0);
  })
  sounds.focus = focuSound;
  sounds.combo = game.add.audio('s_combo');
  sounds.drop = game.add.audio('s_drop');
}

/** 创建背景 */
function createBG() {
  var bmd = game.add.bitmapData(width, height);
  bmd.addToWorld();
  for (var i = 0; i < height; i++) {
    var co = Phaser.Color.interpolateColor(0xd6f0e5, 0xb1c5ce, height, i);
    bmd.rect(0, i, width, 1, Phaser.Color.getWebRGB(co));
  }
  return bmd;
}

/** 游戏准备 */
function gameReady() {
  var box = createBox(0);
  step = 0;
  isBaoliClick = 0;
  boxs = [box];
  box.bog.add(poi);
  nextPoi = { x: box.bog.x, y: box.bog.y };
  var btw = game.add.tween(startBtn);
  btw.to({ alpha: 1 }, 300, ease.Circular.InOut);
  btw.onComplete.add(f => {
    startBtn.inputEnabled = true;
  });
  btw.start();
}

/** 游戏开始 */
function gameStart() {
  isGameOn = true;
  initNextBox();
}

/** 游戏结束 */
function gameOver() {
  isGameOn = false;
  var b0 = boxs.shift();
  var b0x = b0.bog.x, b0y = b0.bog.y;
  // 清理方块
  boxs.forEach((b, i) => {
    var tw = game.add.tween(b.bog).to({ alpha: 0 }, 1000, null, null);
    tw.onComplete.add(f => {
      b.bog.destroy(true);
    });
    tw.start();
  });
  boxs = [b0];
  // 移动摄像头
  if (cameraTween) cameraTween.stop();
  cameraTween = game.add.tween(world);
  cameraTween.to({ x: -b0x + width / 2, y: -b0y + height / 2 + 200 }, 1500, ease.Quadratic.InOut);
  cameraTween.onComplete.add(f => {
    // 循环游戏
    world.add(poi);
    poi.position.set(0, poiOffset);
    b0.bog.alpha = 0;
    b0.bog.destroy(true);
    world.position.set(game.world.centerX, game.world.centerY + 200);
    gameReady();
  });
  cameraTween.start();
}





/** 建立下一个方块 */
function initNextBox() {
  if ($d.overStep && $d.overStep <= step) {
    gameOver();
    return;
  }
  step++;
  var bog0 = boxs[0].bog;
  var box = createBox(step, true);
  var pos = getBoxPos(bog0.x, bog0.y, box.bog.d_d.dir, box.bog.d_d.len);
  box.bog.position.set(pos.x, pos.y);
  boxs.unshift(box);
  nextPoi = pos;
  moveCamera();
  isBaoliClick = 0;
  if (boxs.length > 6) boxs.pop().bog.destroy(true);
  sounds.combo.play();
}

/** 创建方块 */
function createBox(step, inAni) {
  var bog = game.add.group(world);
  bog.d_d = getBoxData(step);
  var bos = game.add.sprite(0, 0, 'e_bshadow', null, bog);
  bos.anchor.set(0.62, 0.62);
  bos.alpha = 0.2;
  var box = game.add.sprite(0, 0, bog.d_d.url, null, bog);
  box.anchor.set(0.5, 0.73);
  world.sendToBack(bog);
  if (inAni) {
    game.add.tween(box)
      .from({ y: box.y - height / 2 }, 400, ease.Bounce.Out)
      .start();
    var shapos = getBoxPos(bos.x, bos.y, -1, 5);
    game.add.tween(bos)
      .from({ x: shapos.x, y: shapos.y }, 400, ease.Bounce.Out)
      .start();
  }
  return { bog, bos, box };
}

/** 获取方块数据 */
function getBoxData(step) {
  var bs = $d.box.filter(b => {
    var into = b.into instanceof Array ? b.into : [+b.into];
    if (isNaN(into[0])) return;
    if (b.intoFn !== '>') return into.some(n => step == n);
    else if (b.intoFn === '<' && step <= into.shift()) return true;
    else for (var i = 0; i < into.length; i += 2) {
      var i0 = into[i];
      var i1 = into[i + 1] || Infinity;
      if (step >= i0 && step <= i1) return true;
    }
  });
  if (!bs.length) bs = $d.box;
  var bb = bs[Math.random() * bs.length >> 0];
  var lensc = isFinite(bb.len) ? bb.len : Math.random() + 0.5 + Math.random() * Math.random();
  lensc = Math.min(Math.max(lensc, 0.5), 3);
  var dirsc;
  if (bb.dir === '左') dirsc = -1;
  else if (bb.dir === '右') dirsc = 1;
  else dirsc = Math.random() > 0.5 ? 1 : -1;
  return {
    url: bb.url,
    len: lensc,
    dir: dirsc,
  }
}

/** 获取方新块坐标 (原方块坐标, 新方向, 距离) */
function getBoxPos(x, y, dir, len) {
  dir *= len;
  len = (len + 1) * $d.boxLen;
  dir = (dir + (dir > 0 ? 1 : -1)) * $d.boxLen;
  var o = { x: 0.8660254, y: -0.5 };
  o.x = o.x * dir + x;
  o.y = o.y * len + y;
  return o;
}





/** 游戏控制 */
function gameInput() {
  if (!isGameOn) {
    return;
  }
  if (this.down) {
    if (isBaoliClick) return;
    isBaoliClick++;
    if (!isJumpOn) focusStart();
  }
  else if (this.up) {
    if (isFocusOn && !isJumpOn) {
      isFocusOn = false;
      focusOver();
    }
  }
}

var focusTw = {};

/** 开始聚能 */
function focusStart() {
  isFocusOn = true;
  var bo1 = boxs[1].bog;
  bo1.scale.y = 0.97;
  focusTw = game.add.tween(bo1.scale);
  focusTw.to({ y: 0.7 }, 6000, ease.Quadratic.Out);
  focusTw.start();
  sounds.focus.d_d = false;
  sounds.focus.play('start');
}

var focuParts = {};
/** 聚能动画 */
function focusAning() {
  focusPower += 3;
  var foId = focusPower;
  if (20 / foId > Math.random()) return;
  var bmd = Math.random() > 0.2 ? parcir.w : parcir.g;
  var x = boxs[1].bog.x, y = boxs[1].bog.y - 110;
  var rand = { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 };
  var part = game.add.sprite(x + rand.x, y + rand.y, bmd, null, world);
  part.anchor.set(0.5);
  part.alpha = Math.random() * 0.3 + 0.7;
  var tw = game.add.tween(part).to({ x, y, alpha: 1 }, 500, ease.Circular.In);
  focuParts[foId] = tw;
  tw.onComplete.add(function () {
    part.destroy(true);
    delete focuParts[foId];
  });
  tw.start();
}

/** 聚能结束 */
function focusOver() {
  isJumpOn = 2;
  world.add(poi);
  var bo1 = boxs[1].bog;
  focusTw.pause();
  bo1.scale.y *= 0.9;
  focusTw = game.add.tween(bo1.scale);
  focusTw.to({ y: 1 }, 150, ease.Back.Out);
  focusTw.start();
  poi.position.set(bo1.x, bo1.y + poiOffset);
  poi.scale.y = 1;
  makeBoomShakaLaka(0, -110, bo1);
  sounds.focus.fadeOut(Math.max(80, 200 - focusPower));
  sounds.focus.d_d = true;
  // 聚能爆炸
  Object.keys(focuParts).forEach(k => {
    var fp = focuParts[k];
    fp.reverse = true;
  })
  jumpStart();
}

/** 开始跳跃 */
function jumpStart() {
  // 移动跳子
  poi.scale.x = boxs[0].bog.d_d.dir < 0 ? -1 : 1;
  var h = boxs[0].bog.d_d.len * 200 + Math.min(focusPower, 500);
  poi.animations.play('j', 15000 / (h + 300) >> 0);
  var tw = game.add.tween(poi);
  tw.to({ x: nextPoi.x }, 250 + h / 1.5, ease.Linear.None);
  tw.onComplete.addOnce(jumpOver);
  var tw2 = game.add.tween(poi);
  focusPower = 0;
  tw2.to({ y: poi.y - h }, 100 + h / 2.5, ease.Quintic.Out)
    .to({ y: nextPoi.y + poiOffset }, 50 + h / 2.5, ease.Quartic.In);
  tw2.onComplete.addOnce(jumpOver);
  tw.start();
  tw2.start();
  sounds.drop.play();
}

/** 跳跃结束 */
function jumpOver() {
  if (isJumpOn > 0) {
    isJumpOn--;
    return;
  }
  var b = boxs[0];
  b.bog.add(boxRing);
  boxRing.position.set(0, -120);
  boxRing.anchor.set(0.5);
  boxRing.scale.set(0.3);
  game.add.tween(boxRing)
    .to({ alpha: 0.8 }, 150, ease.Quadratic.Out)
    .to({ alpha: 0 }, 300, ease.Quadratic.Out)
    .start();
  game.add.tween(boxRing.scale)
    .to({ x: 0.9, y: 0.9 }, 500, ease.Quadratic.Out)
    .start();
  b.bog.add(poi);
  poi.position.set(0, poiOffset);
  makeBoomShakaLaka(0, - 110, b.bog);
  initNextBox();
}

function makeBoomShakaLaka(x, y, group) {
  var length = Math.random() * 20;
  for (var i = 0; i < length; i++) {
    var sp = game.add.sprite(x + Math.random() * 10 - 5, y + Math.random() * 6 - 3, parcir.w, null, group);
    sp.alpha = Math.random() * 0.3 + 0.7;
    sp.anchor.set(0.5);
    sp.scale.set(Math.random() * 2);
    var time = 200 + Math.random() * 700;
    var tw = game.add.tween(sp.scale).to({ x: 0, y: 0 }, time);
    var tw2 = game.add.tween(sp).to({
      x: x + Math.random() * 200 - 100,
      y: y + Math.random() * -100
    }, time + 100, ease.Circular.Out);
    tw2.onChildComplete.add(f => { sp.destroy(true) });
    tw.start();
    tw2.start();
  }
}

/** 移动镜头 */
function moveCamera(toX, toY) {
  if (cameraTween) cameraTween.stop();
  cameraTween = game.add.tween(world);
  var bo0 = boxs[0].bog, bo1 = boxs[1].bog;
  var x0 = bo0.x, y0 = bo0.y, x1 = bo1.x, y1 = bo1.y;
  cameraTween.to({
    x: -x0 - (x1 - x0) * 0.5 + width / 2,
    y: -y0 - (y1 - y0) * 0.5 + height / 2 + 200
  }, 1200, ease.Quadratic.Out);
  cameraTween.start();
}





var log = (...arg) => {
  console.log.apply(console, arg);
  self['lol'] = arg[1] !== undefined ? arg : arg[0];
}