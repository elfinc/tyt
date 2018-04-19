var $d = {
  /** 页面宽度分辨率 */
  pageWidth: 800,
  /** 方块边长 */
  boxLen: 160,
  /** 结束步数 写0表示永不结束 */
  overStep: 0,

  /** 跳子 */
  poi: {
    url: 'img/poi.png',
    w: 276,
    h: 345,
  },

  /** 特效和控件 */
  ef: {
    // 落地效果
    ring: {
      url: 'img/ring.png',
    },
    // 聚能环
    part: {
      url: 'img/ring.png',
    },
    // 影子
    bshadow: {
      url: 'img/s2.png'
    },
    // 开始按钮
    startBtn: {
      url: 'img/start.png',
    },
  },

  /** 音效 */
  sound: {
    // 聚能音效
    focus: {
      url: 'voice/scale.mp3',
    },
    // 得分音效
    combo: {
      url: 'voice/combo.mp3',
    },
    // 落地音效
    drop: {
      url: 'voice/pop.mp3',
    },
  },

  /** 方块 */
  box: [
    {
      test: '说明',

      url: '这里写方块图片的路径',

      into: '这里写方块会在第几步出现，可以写一个数，也可以写数组，\
            例如写：“ [1,2,3] ”表示第1/2/3步都有可能出现，\
            不写就随机出现',

      intoFn: '这里写 into 的计算方法，不写默认是当前步数等于 into 时出现，\
            写“ < ”(小于号)表示在 into 之前(包含into)出现，\
            写“ > ”(大于号)表示在 into 之后(包含into)出现，\
            \
              *特殊用法：如果 into 是数组，例如 [5,10,20,33]，\
            写“ < ”(小于号)表示在5之前、10到20之间、以及33步之后出现，\
            写“ > ”(大于号)表示在5到10之间、20到33步之间出现，\
            也就是单双位交替，以此类推，基本可以涵盖所有情况，请确保数组是递增排序',

      dir: '这里写方块会在左还是右出现，不写就随机',

      len: '这里写方块出现的距离，有效值在 0.5 - 3 之间，不写就随机',
    },


    {
      url: 'img/c2.png',
      into: 0,
    },

    {
      url: 'img/c3.png',
      into: 6,
      intoFn: '<',
      dir: '右',
      len: 2,
    },

    {
      url: 'img/c5.png',
      into: 2,
      dir: '左',
      len: 0,
    },

    {
      url: 'img/c4.png',
      into: [3, 4, 8, 9],
      intoFn: '>',
    },

    {
      url: 'img/c6.png',
      into: [2, 6, 12],
      intoFn: '<',
      dir: '右',
    },

    {
      url: 'img/c7.png',
      into: 10,
      intoFn: '<',
    },


  ]
}