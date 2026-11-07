"use strict";

const CAMPUS = [
  { id: "barn", sign: "BARN", name: "The Stall Map", color: "#efad74" },
  { id: "bones", sign: "BONES", name: "Spare Parts", color: "#b9d3af" },
  { id: "gait", sign: "GAIT", name: "Ghost Hoofbeats", color: "#d2b2f4" },
  { id: "gut", sign: "GUT", name: "Gut Check", color: "#8bd8cb" },
  { id: "exam", sign: "EXAM", name: "The Night Practical", color: "#ffce7e" },
];

const LANDMARKS = [
  { name: "Poll", where: "Top of the head", x: 37, y: 13, text: "The poll is at the top of the head between and just behind the ears." },
  { name: "Withers", where: "Base of the neck", x: 66, y: 31, text: "The withers form the ridge where the neck meets the back, between the shoulder blades." },
  { name: "Barrel", where: "Rib cage", x: 85, y: 51, text: "The barrel is the rounded middle of the body, around the ribs." },
  { name: "Croup", where: "Top of the rump", x: 113, y: 35, text: "The croup is the top of the hindquarters, between the loin and the tail." },
];

const JOINTS = [
  { name: "Knee", slot: 0, clue: "The carpus is the prominent upper joint on the lower foreleg. Its everyday name is the knee." },
  { name: "Hock", slot: 3, clue: "The hock, or tarsus, is the angular joint on the hind leg above the fetlock." },
  { name: "Fore fetlock", slot: 1, clue: "The fetlock is below the knee and above the pastern and hoof. This one goes on the foreleg." },
  { name: "Hind fetlock", slot: 4, clue: "The hind fetlock is below the hock and above the pastern and hoof." },
  { name: "Fore hoof", slot: 2, clue: "The hoof is at the end of the limb. This one belongs on the foreleg." },
  { name: "Hind hoof", slot: 5, clue: "The hoof is at the end of the limb. This one belongs on the hind leg." },
];

const FEET = ["Left fore", "Right fore", "Left hind", "Right hind"];
const GAITS = [
  { name: "Walk", beats: [4, 1, 8, 2], clue: "Four separate beats. Start on the left hind, then land the left fore, right hind, and right fore." },
  { name: "Trot", beats: [6, 9, 6, 9], clue: "Two alternating diagonal pairs. Left hind lands with right fore, then right hind with left fore." },
  { name: "Right-lead canter", beats: [4, 9, 2], clue: "Three beats. Left hind, then right hind and left fore together, then right fore." },
  { name: "Canter twice", beats: [4, 9, 2, 4, 9, 2], clue: "Ride two strides on the right lead. The right fore closes each three-beat stride." },
];

const BARN_MAP = [
  "########################",
  "#S....#.....#........A.#",
  "#..##.#.##..#.####.##..#",
  "#.....#..B..#....#.....#",
  "#..##.###.#.#.##.##.#..#",
  "#.........#...#.....#..#",
  "####.#.####.#.#.#####..#",
  "#..C.#......#.#........#",
  "#...##.###.....###.#...#",
  "#.....M..#..D..#.....X.#",
  "########################",
];

const GUT = [
  {
    name: "Stomach",
    route: "Mouth → esophagus → stomach",
    lesson: "The mouth chews the feed. The esophagus carries it to the stomach, where acid and enzymes begin to break it down.",
    map: [
      "###########",
      "#.........#",
      "#.###.....#",
      "#.@.b.#...#",
      "#.....#.x.#",
      "#..#......#",
      "#.........#",
      "###########",
    ],
  },
  {
    name: "Cecum",
    route: "Stomach → small intestine → cecum",
    lesson: "Much digestion and nutrient absorption happens in the small intestine. In the cecum, microbes ferment plant fiber.",
    map: [
      "###########",
      "#....#....#",
      "#.x#.#....#",
      "#..#...b..#",
      "#..####...#",
      "#.........#",
      "#......@..#",
      "###########",
    ],
  },
  {
    name: "Large colon",
    route: "Cecum → large colon",
    lesson: "Fiber fermentation continues in the large colon. The colon also absorbs water and electrolytes.",
    map: [
      "###########",
      "#....#....#",
      "#.x..#..@##",
      "#....#..b.#",
      "###.##.#..#",
      "#.......#.#",
      "#.........#",
      "###########",
    ],
  },
];

const EXAM = [
  { question: "Point to the withers.", answer: 1, map: true, hint: "Look at the ridge where the neck meets the back." },
  { question: "Point to the poll.", answer: 0, map: true, hint: "Look near the ears at the very top of the head." },
  { question: "Point to the barrel.", answer: 2, map: true, hint: "Look at the rounded middle around the ribs." },
  { question: "Point to the croup.", answer: 3, map: true, hint: "Look along the top of the hindquarters." },
  { question: "Which joint is the hock?", answer: 3, legs: true, hint: "It's the angular hind-leg joint above the fetlock." },
  { question: "Which pin shows the fore fetlock?", answer: 1, legs: true, hint: "Follow the foreleg down past the knee. Stop just above the pastern and hoof." },
  { question: "At a trot, which foot lands with the left fore?", answer: 3, options: FEET, hint: "The trot uses opposite-side fore and hind feet together." },
  { question: "Where does feed go immediately after the stomach?", answer: 2, options: ["Esophagus", "Cecum", "Small intestine", "Large colon"], hint: "Look for the section where much nutrient absorption takes place, before the hindgut." },
  { question: "Which chamber receives feed from the small intestine and ferments fiber?", answer: 0, options: ["Cecum", "Stomach", "Esophagus", "Mouth"], hint: "It's the first chamber of the hindgut." },
];

const JOURNAL = {
  barn: LANDMARKS.map(({ name, text }) => [name, text]),
  bones: [
    ["Knee (carpus)", "The joint on the foreleg above the cannon region."],
    ["Hock (tarsus)", "The angular joint on the hind leg above the cannon region."],
    ["Fetlock", "The joint below the cannon region and above the pastern on each leg."],
    ["Hoof", "The hard capsule at the end of each limb."],
  ],
  gait: GAITS.slice(0, 3).map(({ name, clue }) => [name, clue]),
  gut: GUT.map(({ route, lesson }) => [route, lesson]),
};
