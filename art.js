"use strict";

const Art = (() => {
  const WIDTH = 384;
  const HEIGHT = 216;
  const ctx = document.getElementById("screen").getContext("2d", { alpha: false });
  const cream = "#f9e3b7";
  const gold = "#ffc979";
  const lilac = "#cba9f3";
  const mint = "#99dbc1";
  const dark = "#1d1628";
  const tiles = { barn: 16, barnY: 29, gut: 20, gutX: 82, gutY: 37 };
  const doors = [43, 118, 193, 269, 343];
  const slots = [
    [133, 78], [133, 126], [133, 171],
    [265, 78], [265, 126], [265, 171],
  ];
  const footPads = [53, 130, 254, 331].map(x => [x, 164]);
  const chart = { x: 86, y: 43, scale: 1.52 };
  const pins = LANDMARKS.map(({ x, y }) => [
    Math.round(chart.x + x * chart.scale),
    Math.round(chart.y + y * chart.scale),
  ]);
  const glyphs = {
    A: "25755", B: "65656", C: "34443", D: "65556", E: "74647",
    F: "74644", G: "34553", H: "55755", I: "72227", J: "11152",
    K: "55655", L: "44447", M: "57755", N: "57775", O: "25552",
    P: "65644", Q: "25573", R: "65655", S: "34216", T: "72222",
    U: "55557", V: "55552", W: "55775", X: "55255", Y: "55222",
    Z: "71247", 0: "75557", 1: "26227", 2: "61247", 3: "61216",
    4: "55711", 5: "74616", 6: "34653", 7: "71244", 8: "25252",
    9: "35616", "-": "00700", "+": "02720", "/": "11244", ".": "00002",
    ":": "02020", "!": "22202", " ": "00000",
  };
  const cowboySprite = [
    "................", ".....hhh.hh.....", ".....hHHhHh.....",
    ".....hHHHHh.....", "..hhhhbbbbhhhh..", ".hHHHHHHHHHHHh.",
    "..hhhhhhhmmmmh..", ".....mffmf......", ".....mfffe......",
    "......fff.......", ".....rrrrr......", "....rrjjjrr.....",
    "...rjjjjjjjr....", "...fjjBjjjff....", ".....BBBb.......",
    ".....pPPp.......", ".....p..p.......", "....bb..bb......",
  ];
  const cowboyColors = {
    h: "#8f534a", H: "#f7b768", b: "#704437", m: "#b87156",
    f: "#ffc590", e: "#211a28", r: "#f08272", j: "#578c8d",
    B: "#624447", p: "#484d66", P: "#7a7884",
  };
  const mothSprite = [
    "w................w", "ww....m....m....ww", "wWw....mmmm....wWw",
    "wWWw..mmmmmm..wWWw", "wwWWwmrmmrmmwWWww",
    ".wwWWmHmmHmmWWww.", "..wwWmmmmmmWww...",
    "...wwWmmmmWww....", "....wmmmmmmw.....",
    "......m..m.......", ".....mm..mm......",
  ];
  const ghostSprite = [
    "......ggggg......", "....ggGGGGGgg....", "...gGGGGGGGGGg...",
    "..gGGGkGGGkGGGg..", "..gGGGKGGGKGGGg..", ".gGGGGGGGGGGGGGg.",
    ".gGGGGGGkGGGGGGg.", "gGGGGGGGGGGGGGGGg", "gGGgGGGGGGGgGGGGg",
    ".gg.gGGgGGg.gGGg.", ".....gg.gg...gg..",
  ];
  const stars = Array.from({ length: 86 }, (_, i) => ({
    x: (i * 173 + i * i * 31) % WIDTH,
    y: (i * 47 + i * i * 3) % 122,
    color: ["#564363", "#825f83", "#af82a3", "#e9acb1"][i % 4],
  }));

  function box(x, y, w, h, color, context = ctx) {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function polygon(points, color, context = ctx) {
    context.beginPath();
    points.forEach(([x, y], i) => {
      if (i) context.lineTo(x, y);
      else context.moveTo(x, y);
    });
    context.closePath();
    context.fillStyle = color;
    context.fill();
  }

  function label(value, x, y, color = cream, size = 1, align = "left", context = ctx) {
    const chars = String(value).toUpperCase();
    let start = x;
    const width = Math.max(0, (chars.length * 4 - 1) * size);
    if (align === "center") start -= Math.floor(width / 2);
    if (align === "right") start -= width;
    [...chars].forEach((char, index) => {
      const rows = glyphs[char] || glyphs[" "];
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 3; col++) {
          if (Number(rows[row]) & (4 >> col)) {
            box(start + (index * 4 + col) * size, y + row * size, size, size, color, context);
          }
        }
      }
    });
  }

  function sprite(rows, colors, x, y, scale = 1, flip = false) {
    rows.forEach((row, j) => {
      [...row].forEach((ch, i) => {
        if (colors[ch]) {
          box(x + (flip ? rows[0].length - 1 - i : i) * scale, y + j * scale, scale, scale, colors[ch]);
        }
      });
    });
  }

  function cowboy(x, y, scale, face = 1, walk = false, t = 0) {
    const step = walk && Math.floor(t * 10) % 2 === 1 ? 1 : 0;
    box(x + scale, y + 17 * scale, 14 * scale, 2 * scale, "#100e1b");
    sprite(cowboySprite, cowboyColors, x, y - step * scale, scale, face < 0);
  }

  function moth(x, y, t, scale = 1) {
    const hop = Math.floor(t * 6) % 3;
    sprite(mothSprite, {
      w: "#2b1c39", W: "#62415c", m: "#493147", r: "#f07173", H: "#ffc0a2",
    }, x, y + hop, scale);
  }

  function ghost(x, y, t, scale = 1) {
    const bob = Math.floor(t * 4) % 4;
    sprite(ghostSprite, { g: "#629f9b", G: "#b9dec5", k: "#305758", K: "#24444b" }, x, y + bob, scale);
  }

  function horse(x, y, scale, ghostly = true, context = ctx) {
    const shades = ghostly
      ? ["#38324e", "#7c739f", "#baacd9", "#ded1ef", "#504560", "#e8fff0"]
      : ["#513347", "#936776", "#c59c91", "#efd4ad", "#654455", "#2b2038"];
    const [shade, mid, body, light, mane, eye] = shades;
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    polygon([[63,49],[78,52],[74,73],[76,85],[71,91],[61,91],[61,87],[65,83],[64,71]], shade, context);
    polygon([[112,47],[127,49],[126,60],[115,70],[116,82],[120,86],[119,91],[109,91],[107,87],[107,70],[114,59]], shade, context);
    polygon([[121,38],[131,37],[139,43],[144,56],[148,76],[141,74],[136,64],[133,55],[124,50]], mane, context);
    polygon([[37,10],[44,14],[51,20],[58,28],[66,31],[82,34],[100,34],[112,33],[123,36],[129,41],[131,49],[126,58],[119,62],[101,62],[87,58],[73,60],[63,60],[53,54],[49,46],[44,30],[39,27],[35,33],[30,35],[21,42],[14,42],[10,38],[11,32],[18,28],[23,23],[28,16],[29,7],[34,9],[37,14],[41,6],[45,5],[44,14]], body, context);
    polygon([[42,13],[49,16],[59,24],[67,30],[61,34],[53,27],[49,23],[46,29],[45,25]], mane, context);
    polygon([[56,46],[70,48],[69,62],[63,72],[62,84],[65,89],[65,94],[53,94],[53,89],[56,83],[55,68]], body, context);
    polygon([[105,51],[123,51],[118,62],[110,69],[115,78],[111,86],[111,93],[100,93],[100,89],[104,82],[106,77],[100,67],[102,57]], body, context);
    polygon([[57,52],[68,54],[69,61],[65,65],[57,63]], mid, context);
    polygon([[74,54],[86,55],[101,51],[104,58],[90,60],[73,59]], mid, context);
    polygon([[116,39],[124,42],[125,50],[119,56],[115,54],[119,45]], mid, context);
    polygon([[14,33],[19,31],[22,35],[21,40],[14,42],[10,38]], mid, context);
    polygon([[28,19],[36,15],[40,18],[33,24],[24,28],[22,26]], light, context);
    polygon([[50,27],[61,34],[76,38],[99,38],[110,36],[113,38],[100,42],[73,41],[60,38],[54,34]], light, context);
    box(30, 22, 3, 3, eye, context);
    box(13, 36, 2, 2, shade, context);
    box(53, 90, 12, 4, shade, context);
    box(100, 90, 11, 4, shade, context);
    context.restore();
  }

  function sky(t) {
    box(0, 0, WIDTH, HEIGHT, "#211b35");
    box(0, 33, WIDTH, 42, "#2c2241");
    box(0, 75, WIDTH, 26, "#3d2b4b");
    box(0, 101, WIDTH, 25, "#55364e");
    box(0, 126, WIDTH, 33, "#734550");
    stars.forEach(({ x, y, color }, i) => box(x, y, i % 11 ? 1 : 2, 1, color));
    [23, 107, 185, 348].forEach((x, i) => {
      const y = 22 + ((i * 31) % 77);
      const bright = Math.floor(t + i) % 4 === 0;
      box(x, y, 1, 5, bright ? "#f5cfac" : "#ad7a93");
      box(x - 2, y + 2, 5, 1, bright ? "#f5cfac" : "#ad7a93");
    });
    box(24, 86, 80, 2, "#69506b");
    box(164, 97, 73, 1, "#966079");
    box(208, 102, 54, 2, "#664258");
    box(275, 117, 77, 2, "#996174");
    polygon([[0,144],[30,126],[44,126],[61,118],[80,129],[105,129],[124,120],[151,120],[173,136],[193,133],[218,146],[251,139],[275,121],[303,121],[339,141],[365,131],[384,137],[384,170],[0,170]], "#4b3651");
    polygon([[0,154],[28,145],[51,150],[74,137],[104,137],[135,155],[169,147],[184,150],[197,145],[221,156],[244,148],[281,151],[303,141],[336,150],[353,143],[384,150],[384,185],[0,185]], "#30273e");
  }

  function ring(x, y, rx, ry, color, width, phase = 0, skip = 0) {
    for (let i = 0; i < 100; i++) {
      if (skip && (i + Math.floor(phase * 5)) % skip < 2) continue;
      const a = (i / 100) * Math.PI * 2 + phase;
      box(x + Math.cos(a) * rx - width / 2, y + Math.sin(a) * ry - width / 2, width, width, color);
    }
  }

  function rift(x, y, t, scale = 1, examiner = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    polygon([[-39,-7],[-29,-28],[-11,-39],[10,-39],[29,-27],[38,-13],[39,12],[29,27],[10,38],[-12,38],[-30,25],[-40,9]], "#372747");
    ring(0, 0, 41, 39, "#5d3c75", 3, t * .08, 7);
    ring(0, 0, 36, 35, "#86569f", 4, -t * .1, 13);
    ring(0, 0, 31, 30, "#c17fca", 2, t * .14, 14);
    ring(0, 0, 26, 25, "#563466", 2, -t * .12, 6);
    ring(0, 0, 19, 17, "#6c477d", 1, t * .08, 8);
    polygon([[-10,-17],[10,-17],[21,-4],[14,14],[-4,20],[-18,9],[-21,-6]], "#211a32");
    const eyes = examiner ? [[-9,-10],[7,-10],[-14,-3],[12,-3],[-5,4],[3,4]] : [[-6,-2],[5,-2]];
    eyes.forEach(([ex, ey]) => {
      box(ex - 1, ey - 1, 5, 4, "#694360");
      box(ex, ey, 3, 2, "#f1aed9");
    });
    ctx.restore();
  }

  function tower(x, floor, w, h, glow = "#c48173") {
    const top = floor - h;
    box(x, top, w, h, "#33263b");
    polygon([[x-4,top],[x+w/2,top-19],[x+w+4,top],[x+w+4,top+3],[x-4,top+3]], "#211a2d");
    box(x + 3, top + 6, 2, h - 6, "#59364b");
    box(x + w - 4, top + 4, 3, h - 4, "#201a2c");
    for (let row = top + 10; row < floor - 10; row += 14) {
      box(x + 8, row, 5, 8, "#211a2d");
      box(x + 9, row + 1, 3, 6, glow);
      box(x + w - 13, row, 5, 8, "#211a2d");
      box(x + w - 12, row + 1, 3, 6, glow);
    }
  }

  function fence(x, y, width, col = "#4b3547") {
    box(x, y + 5, width, 2, col);
    box(x, y + 12, width, 2, col);
    for (let n = x; n < x + width; n += 13) box(n, y + 1, 2, 17, col);
  }

  function ground(y) {
    box(0, y, WIDTH, HEIGHT - y, "#272033");
    box(0, y + 2, WIDTH, 1, "#75515d");
    box(0, y + 13, WIDTH, 15, "#3d2e42");
    box(0, y + 12, WIDTH, 1, "#514054");
    box(0, y + 28, WIDTH, 1, "#503a49");
    for (let i = 0; i < 70; i++) {
      box((i * 79 + i * i * 11) % WIDTH, y + 5 + (i * 7) % (HEIGHT - y - 7), i % 3 + 1, 1, i % 2 ? "#69505a" : "#181827");
    }
  }

  function title(t) {
    sky(t);
    rift(312, 62, t, 1.12);
    tower(173, 169, 24, 35);
    tower(197, 169, 32, 59);
    tower(222, 169, 21, 30, "#ac7067");
    tower(348, 167, 22, 64);
    tower(371, 167, 19, 49);
    box(336, 137, 21, 30, "#3a2c42");
    fence(134, 154, 251);
    ground(171);
    for (let i = 0; i < 24; i++) {
      box(215 + i * 7, 194 + (i % 4) * 3, 2, 4 + i % 5, "#3d3d4c");
    }
    box(265, 176, 92, 3, "#47334e");
    horse(246, 94 + Math.floor(Math.sin(t * 1.7) * 2), .84);
    for (let i = 0; i < 9; i++) {
      box(248 + (i * 29) % 114, 100 + (i * 23 + Math.floor(t * 5)) % 73, 1, 2, i % 3 ? "#805f9c" : "#ead6f4");
    }
    cowboy(209, 153, 1.55);
    box(208, 183, 28, 1, "#9c6266");
    for (let i = 0; i < 10; i++) {
      const x = 3 + i * 43;
      box(x, 197 - i % 3, 2, 12, "#302a3e");
      box(x - 2, 201 - i % 3, 6, 2, "#41364a");
    }
  }

  function plate(x, y, w, h, border, fill = "#292037") {
    box(x + 2, y + 3, w, h, "#110f1c");
    box(x, y, w, h, border);
    box(x + 1, y + 1, w - 2, h - 2, fill);
  }

  function hud(left, right, color = gold) {
    box(0, 0, WIDTH, 24, "#1a1525");
    box(0, 23, WIDTH, 1, "#594059");
    box(11, 9, 5, 5, color);
    label(left, 22, 9, color);
    label(right, WIDTH - 11, 9, cream, 1, "right");
  }

  function hub(t, state, completed, finished) {
    sky(t);
    rift(334, 71, t, .72);
    tower(17, 150, 22, 55);
    tower(144, 152, 29, 62, "#be8577");
    tower(237, 152, 20, 52, "#8c858d");
    tower(353, 150, 21, 56, "#8975a6");
    CAMPUS.forEach((course, i) => {
      const x = doors[i];
      const done = i === 4 ? finished : completed.includes(course.id);
      const open = i < 4 || completed.length === 4;
      const focused = state.near === i;
      const bricks = ["#56394a", "#3c3a4d", "#49354e", "#34404a", "#493450"][i];
      const roof = ["#9b5e62", "#72707f", "#835678", "#587788", "#7e5987"][i];
      const w = i === 4 ? 56 : 61;
      box(x - w / 2, 102, w, 56, bricks);
      polygon([[x-w/2-3,104],[x-15,83-i%2*5],[x+17,83-i%2*5],[x+w/2+3,104]], roof);
      box(x - w / 2 - 2, 102, w + 4, 3, "#261d33");
      box(x - w / 2 + 4, 108, 2, 48, roof);
      for (let row = 110; row < 155; row += 7) {
        box(x - 23 + (row % 2) * 6, row, 11, 1, "#655268");
        box(x + 12, row, 10, 1, "#655268");
      }
      plate(x - 13, 119, 26, 40, focused ? course.color : roof, "#242033");
      box(x - 10, 123, 20, 25, open ? "#31293d" : "#252032");
      if (open) {
        box(x - 5, 133, 2, 9, course.color);
        box(x + 3, 133, 2, 9, course.color);
      }
      box(x + 5, 146, 2, 2, open ? cream : "#635a71");
      plate(x - 17, 107, 34, 11, focused ? course.color : "#71516e");
      label(course.sign, x, 110, course.color, 1, "center");
      if (done) {
        box(x + 20, 107, 8, 8, "#3d725e");
        label("+", x + 24, 108, "#ddffe5", 1, "center");
      }
      if (focused) box(x - 12, 161, 24, 2, course.color);
    });
    fence(0, 141, 14);
    fence(370, 141, 14);
    ground(168);
    cowboy(state.x - 12, 147, 1.5, state.face, state.walking, t);
    box(state.x - 12, 177, 24, 1, "#a67177");
    if (state.near !== -1) {
      const x = doors[state.near];
      const y = 66 + Math.floor(Math.sin(t * 3) * 2);
      polygon([[x-4,y],[x+4,y],[x,y+5]], gold);
    }
    hud("CAMPUS / NIGHT SHIFT", completed.length + "/4 STAMPS");
    label("THE QUAD", 13, 200, "#b7889a");
    label(finished ? "DIPLOMA EARNED" : "ANATOMY 101", WIDTH - 13, 200, "#b7889a", 1, "right");
  }

  function barn(t, state) {
    box(0, 0, WIDTH, HEIGHT, "#231b2b");
    BARN_MAP.forEach((row, y) => {
      [...row].forEach((tile, x) => {
        const xx = x * tiles.barn;
        const yy = tiles.barnY + y * tiles.barn;
        if (tile === "#") {
          box(xx, yy, 16, 16, "#513342");
          box(xx, yy + 1, 16, 3, "#825046");
          box(xx + 1, yy + 5, 14, 8, (x + y) % 2 ? "#654251" : "#603d49");
          box(xx + 2, yy + 5, 2, 9, "#785051");
          box(xx, yy + 14, 16, 2, "#312137");
          box(xx + 11, yy + 7, 2, 1, "#a06a53");
        } else {
          box(xx, yy, 16, 16, y % 2 ? "#352737" : "#3d2b3a");
          box(xx, yy + 8, 16, 1, "#2d2233");
          if ((x * 3 + y * 7) % 5 === 0) {
            box(xx + 4, yy + 3, 3, 1, "#845b57");
            box(xx + 8, yy + 12, 4, 1, "#695050");
          }
        }
        if ("ABCD".includes(tile) && !state.collected["ABCD".indexOf(tile)]) {
          const bob = Math.floor(t * 4 + x) % 2;
          box(xx + 2, yy + 3 + bob, 12, 11, "#a66c59");
          box(xx + 3, yy + 3 + bob, 9, 9, "#ffcd83");
          box(xx + 5, yy + 5 + bob, 5, 1, "#976453");
          box(xx + 5, yy + 7 + bob, 3, 1, "#976453");
        }
        if (tile === "X") {
          const col = state.count === 4 ? mint : "#8f708f";
          plate(xx + 1, yy + 2, 14, 13, col, "#2a2635");
          label("X", xx + 8, yy + 6, col, 1, "center");
        }
      });
    });
    const p = state.player;
    const m = state.hunter;
    moth(m.x * 16 - 1, tiles.barnY + m.y * 16 + 1, t);
    if (state.safe <= 0 || t === 0 || Math.floor(t * 13) % 2) cowboy(p.x * 16 + 2, tiles.barnY + p.y * 16 - 1, .82, state.face, true, t);
    hud("BARN / THE STALL MAP", state.count + "/4 PAGES", CAMPUS[0].color);
    label(state.count === 4 ? "EXIT IS OPEN" : "KEEP THE PAGES OUT OF ITS MOUTH", 10, 209, "#cda28e");
  }

  function room(t, primary, secondary) {
    box(0, 0, WIDTH, HEIGHT, "#21192d");
    for (let y = 24; y < HEIGHT; y += 14) {
      box(0, y, WIDTH, 1, "#30233c");
      for (let x = (y % 3) * 14; x < WIDTH; x += 43) box(x, y, 1, 14, "#30233c");
    }
    box(0, 191, WIDTH, 25, "#2e2539");
    box(0, 191, WIDTH, 2, "#55415e");
    for (let i = 0; i < 35; i++) {
      box((i * 97 + 23) % WIDTH, 194 + (i * 13) % 20, 2, 1, i % 3 ? "#4c3a52" : secondary);
    }
    [17, 367].forEach(x => {
      box(x - 3, 54, 7, 19, "#64465f");
      box(x - 2, 55, 5, 13, primary);
      box(x - 1, 55, 3, 5 + Math.floor(t * 3 + x) % 4, secondary);
      box(x - 5, 69, 11, 3, "#875871");
    });
  }

  function pin(x, y, value, active, complete = false) {
    const color = complete ? mint : active ? gold : "#9175a8";
    plate(x - 8, y - 8, 17, 17, color, active ? "#5e434f" : "#2c2239");
    label(value, x + 1, y - 4, complete ? mint : active ? cream : lilac, 2, "center");
  }

  function bones(t, state, isExam = false) {
    room(t, "#678883", "#9ed1b3");
    plate(45, 36, 126, 151, "#5b5371", "#272239");
    plate(180, 36, 126, 151, "#5b5371", "#272239");
    label("FORELEG", 107, 43, "#c0baa6", 1, "center");
    label("HIND LEG", 243, 43, "#c0baa6", 1, "center");
    const line = "#8fa795";
    const edge = "#486e6d";
    polygon([[98,53],[107,53],[108,72],[111,78],[107,84],[106,120],[108,126],[106,133],[100,156],[104,165],[102,173],[83,173],[83,168],[90,162],[95,150],[99,132],[95,127],[98,120],[99,84],[96,78],[99,71]], edge);
    polygon([[101,55],[105,55],[105,72],[108,77],[104,83],[103,123],[105,127],[102,133],[97,158],[99,164],[95,166],[88,167],[93,159],[98,133],[98,127],[101,120],[102,82],[99,77],[102,71]], line);
    polygon([[86,166],[101,164],[103,169],[101,172],[85,172]], "#c5baa2");
    polygon([[208,52],[218,52],[234,73],[234,81],[223,103],[220,119],[224,125],[221,133],[216,156],[219,164],[218,173],[200,173],[199,169],[206,161],[211,145],[215,132],[211,126],[215,117],[217,100],[225,79],[223,75]], edge);
    polygon([[211,54],[216,54],[232,75],[231,81],[222,100],[217,123],[221,126],[219,131],[214,155],[215,163],[207,166],[205,167],[209,159],[216,132],[214,126],[216,120],[219,99],[227,78]], line);
    polygon([[203,167],[216,164],[219,170],[216,173],[200,173]], "#c5baa2");
    slots.forEach(([x, y], i) => {
      box(x - (i % 3 === 2 ? 34 : 25), y, i % 3 === 2 ? 26 : 17, 1, "#736784");
      pin(x, y, i + 1, state.selected === i, Boolean(state.placed?.includes(i)));
    });
    ghost(326, 77, t, 2);
    label(isExam ? "PRACTICAL" : "PROF.", 343, 108, "#b0d2c2", 1, "center");
    label(isExam ? "PIN TEST" : "RATTLE", 343, 116, "#b0d2c2", 1, "center");
    if (!isExam) hud("BONE ROOM / SPARE PARTS", (state.index + 1) + "/6 LABELS", CAMPUS[1].color);
  }

  function gait(t, state) {
    room(t, "#9572ab", "#d4a8ed");
    box(50, 46, 284, 1, "#4b375b");
    box(50, 133, 284, 1, "#4b375b");
    for (let i = 0; i < 20; i++) {
      const x = 30 + (i * 83) % 318;
      const y = 50 + (i * 21 + Math.floor(t * 4)) % 79;
      box(x, y, 2, 2, i % 5 ? "#79568d" : "#e6a9eb");
    }
    horse(123, 47 - (state.glow ? 1 : 0), .9);
    const mask = state.phase === "demo" ? state.glow : state.selected | state.glow;
    footPads.forEach(([x, y], i) => {
      const on = mask & (1 << i);
      plate(x - 21, y - 15, 42, 31, on ? "#e2a4ee" : "#6d537b", on ? "#604276" : "#30243f");
      box(x - 9, y - 9, 3, 11, on ? cream : "#a486b6");
      box(x + 6, y - 9, 3, 11, on ? cream : "#a486b6");
      box(x - 6, y + 2, 12, 3, on ? cream : "#a486b6");
      label((i + 1) + " " + ["LF", "RF", "LH", "RH"][i], x, y + 8, on ? cream : lilac, 1, "center");
    });
    const beats = GAITS[state.round].beats.length;
    for (let i = 0; i < beats; i++) {
      const color = i < state.beat ? mint : i === state.beat && state.phase !== "demo" ? gold : "#6f577d";
      box(193 - beats * 8 + i * 16, 29, 12, 4, color);
    }
    label(state.phase === "demo" ? "WATCH THE LIGHTS" : "ECHO THE FOOTFALLS", 192, 201, lilac, 1, "center");
    hud("GAIT LAB / GHOST HOOFBEATS", (state.round + 1) + "/4 PHRASES", CAMPUS[2].color);
  }

  function gut(t, state) {
    room(t, "#5b9c98", "#a6e2d1");
    [30, 338].forEach((x, i) => {
      box(x, 42, 18, 137, "#39314b");
      box(x + 2, 44, 4, 131, "#765880");
      box(x + 9, 46, 5, 126, "#543e68");
      for (let y = 57 + 12 * i; y < 177; y += 27) {
        box(x - 3, y, 24, 6, "#4e435e");
        box(x - 2, y + 1, 22, 2, "#8c6c8e");
      }
    });
    GUT[state.room].map.forEach((row, y) => {
      [...row].forEach((tile, x) => {
        const xx = tiles.gutX + x * tiles.gut;
        const yy = tiles.gutY + y * tiles.gut;
        if (tile === "#") {
          box(xx, yy, 20, 20, "#4c3a60");
          box(xx, yy, 19, 2, "#8d659b");
          box(xx + 2, yy + 3, 15, 12, "#5f4a76");
          box(xx + 3, yy + 5, 2, 9, "#755684");
          box(xx + 17, yy + 2, 3, 18, "#322740");
        } else {
          box(xx, yy, 20, 20, (x + y) % 2 ? "#32273e" : "#3a2c48");
          if ((x + y * 2) % 4 === 0) box(xx + 5, yy + 13, 4, 1, "#645070");
        }
        if (tile === "x") {
          box(xx + 2, yy + 2, 16, 16, "#367d72");
          box(xx + 4, yy + 4, 12, 12, "#264d51");
          label("+", xx + 10, yy + 5, mint, 2, "center");
        }
      });
    });
    const b = state.bale;
    const x = tiles.gutX + b.x * 20 + 3;
    const y = tiles.gutY + b.y * 20 + 3;
    plate(x, y, 14, 14, "#a66f4b", "#dda953");
    box(x + 4, y + 1, 2, 12, "#ffe0a1");
    box(x + 9, y + 1, 2, 12, "#ffe0a1");
    box(x + 2, y + 3, 10, 1, "#fff0b1");
    cowboy(tiles.gutX + state.player.x * 20 + 3, tiles.gutY + state.player.y * 20 + 2, .92, state.face, false, t);
    hud("RIFT LAB / GUT CHECK", (state.room + 1) + "/3 CHAMBERS", CAMPUS[3].color);
    label("PUSH HAY TO THE GREEN CROSS", 192, 205, mint, 1, "center");
  }

  function exam(t, question, state) {
    if (question.legs) {
      bones(t, state, true);
    } else {
      room(t, "#a876a0", "#e6a9d2");
      if (question.map) rift(340, 81, t, .69, true);
      else rift(192, 110, t, 1.37, true);
      if (question.map) {
        plate(67, 38, 250, 158, "#6a507d", "#30253e");
        horse(chart.x, chart.y, chart.scale);
        pins.forEach(([x, y], i) => pin(x, y, i + 1, state.selected === i));
        label("EXTERNAL ANATOMY", 192, 187, lilac, 1, "center");
      } else {
        horse(128, 70, .85);
        label("ORAL EXAM", 192, 180, lilac, 1, "center");
      }
    }
    hud("THE NIGHT PRACTICAL", (state.index + 1) + "/" + EXAM.length, CAMPUS[4].color);
  }

  function diploma(t, score) {
    sky(t);
    ground(170);
    fence(0, 151, WIDTH);
    rift(315, 75, t, .65);
    horse(236, 105, .7);
    cowboy(37, 145, 1.55);
    plate(82, 46, 220, 124, "#c79b69", "#e7c494");
    plate(88, 52, 208, 112, "#977365", "#f5dfae");
    label("HORSE UNIVERSITY", 192, 64, "#81585c", 1, "center");
    label("DIPLOMA", 192, 80, "#4c304b", 3, "center");
    label("EQUINE ANATOMY 101", 192, 105, "#6e4355", 1, "center");
    label("COWBOYBOY", 192, 120, "#4c304b", 2, "center");
    label(score + "/" + EXAM.length + " FIRST TRY", 192, 145, "#6e4355", 1, "center");
    for (let i = 0; i < 24; i++) {
      box((i * 97 + 11) % WIDTH, (i * 41 + Math.floor(t * (8 + i % 4))) % HEIGHT, 2, 3, [mint, gold, lilac][i % 3]);
    }
    hud("HORSE UNIVERSITY", "COURSE COMPLETE");
  }

  function field(canvas, index) {
    const context = canvas.getContext("2d", { alpha: false });
    const { x, y } = LANDMARKS[index];
    box(0, 0, 172, 113, "#211a2c", context);
    horse(10, 5, 1.03, false, context);
    ringForCard(context, 10 + x * 1.03, 5 + y * 1.03);
    label(LANDMARKS[index].name, 86, 104, gold, 1, "center", context);
  }

  function ringForCard(context, x, y) {
    for (let i = 0; i < 22; i++) {
      const angle = i * Math.PI * 2 / 22;
      box(x + Math.cos(angle) * 6, y + Math.sin(angle) * 6, 2, 2, gold, context);
    }
  }

  return { doors, slots, footPads, pins, tiles, title, hub, barn, bones, gait, gut, exam, diploma, field };
})();
