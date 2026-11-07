"use strict";

(() => {
  const byId = id => document.getElementById(id);
  const ui = {
    viewport: byId("viewport"), screen: byId("screen"), hero: byId("hero"),
    start: byId("start-button"), fresh: byId("new-button"), sound: byId("sound-button"),
    journal: byId("journal-button"), pause: byId("pause-button"), console: byId("console"),
    label: byId("section-label"), heading: byId("heading"), prompt: byId("prompt"),
    feedback: byId("feedback"), actions: byId("actions"), touchpad: byId("touchpad"),
    status: byId("status"), controls: byId("controls"), sheet: byId("sheet"),
    sheetLabel: byId("sheet-label"), sheetTitle: byId("sheet-title"),
    sheetBody: byId("sheet-body"), sheetActions: byId("sheet-actions"), close: byId("close-sheet"),
  };
  const saveKey = "cowboyboy.anatomy101.v1";
  const stamps = CAMPUS.slice(0, 4).map(({ id }) => id);
  const directions = {
    up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
    left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
  };
  const keys = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
  };
  const slotLabels = ["Fore upper", "Fore middle", "Fore hoof", "Hind upper", "Hind middle", "Hind hoof"];
  const moves = new Map();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let save = loadSave();
  let scene = "title";
  let state = {};
  let onSheetClose = null;
  let resumeFocus = null;
  let previousFrame = 0;

  function blankSave(sound = false) {
    return { started: false, stamps: [], best: null, sound };
  }

  function loadSave() {
    try {
      const data = JSON.parse(localStorage.getItem(saveKey));
      if (!data || typeof data !== "object") return blankSave();
      const earned = stamps.filter(id => Array.isArray(data.stamps) && data.stamps.includes(id));
      const best = earned.length === 4 && Number.isInteger(data.best) && data.best >= 0 && data.best <= EXAM.length
        ? data.best : null;
      return {
        started: Boolean(data.started) || earned.length > 0,
        stamps: earned,
        best,
        sound: data.sound === true,
      };
    } catch {
      return blankSave();
    }
  }

  function storeSave() {
    try {
      localStorage.setItem(saveKey, JSON.stringify(save));
    } catch {
      // Keep the current run playable if storage is unavailable in an embed.
    }
  }

  function element(tag, value, className) {
    const item = document.createElement(tag);
    if (value) item.textContent = value;
    if (className) item.className = className;
    return item;
  }

  function action(text, fn, options = {}) {
    const button = element("button", "", options.kind || "quiet");
    button.type = "button";
    if (options.key) button.append(element("kbd", options.key));
    button.append(document.createTextNode(text));
    if (options.title) button.setAttribute("aria-label", options.title);
    if (options.pressed !== undefined) button.setAttribute("aria-pressed", String(options.pressed));
    button.disabled = Boolean(options.disabled);
    button.addEventListener("click", fn);
    return button;
  }

  function feedback(text = "", tone = "") {
    ui.feedback.textContent = text;
    ui.feedback.dataset.tone = tone;
  }

  function panel(label, heading, prompt, buttons = []) {
    ui.label.textContent = label;
    ui.heading.textContent = heading;
    ui.prompt.textContent = prompt;
    feedback();
    ui.actions.replaceChildren(...buttons);
  }

  function clearMovement() {
    moves.clear();
    ui.touchpad.querySelectorAll(".active").forEach(button => button.classList.remove("active"));
  }

  function sheet({ label, title, lines = [], nodes = [], buttons, onClose }) {
    clearMovement();
    resumeFocus = document.activeElement;
    onSheetClose = onClose || null;
    ui.sheetLabel.textContent = label;
    ui.sheetTitle.textContent = title;
    ui.sheetBody.replaceChildren(...nodes, ...lines.map(line => element("p", line)));
    ui.sheetActions.replaceChildren(...(buttons || [action("Continue", closeSheet, { kind: "gold" })]));
    ui.sheet.showModal();
    (ui.sheetActions.querySelector(".gold") || ui.close).focus();
  }

  function closeSheet() {
    if (!ui.sheet.open) return;
    const next = onSheetClose;
    const previous = resumeFocus;
    onSheetClose = null;
    resumeFocus = null;
    ui.sheet.close();
    if (previous?.isConnected) previous.focus({ preventScroll: true });
    next?.();
  }

  function setScene(next, data = {}) {
    clearMovement();
    scene = next;
    state = data;
    const title = scene === "title";
    ui.viewport.dataset.scene = next;
    ui.viewport.dataset.clickable = String(["hub", "bones", "gait", "exam"].includes(next));
    ui.hero.hidden = !title;
    ui.console.hidden = title;
    ui.pause.hidden = title || scene === "diploma";
    ui.journal.hidden = title && !save.stamps.length;
    ui.touchpad.hidden = !["hub", "barn", "gut"].includes(scene);
    const hub = scene === "hub";
    ui.touchpad.querySelector('[data-direction="up"]').hidden = hub;
    ui.touchpad.querySelector('[data-direction="down"]').hidden = hub;
    ui.touchpad.dataset.layout = hub ? "walk" : "grid";
    ui.touchpad.lastElementChild.textContent = hub ? "MOVE BETWEEN DOORS" : "HOLD TO MOVE";
    ui.status.textContent = title ? "ANATOMY 101" : save.stamps.length + "/4 COURSE STAMPS";
    ui.controls.textContent = {
      title: "10–15 MIN · KEYBOARD / TOUCH",
      hub: "A/D OR ←/→ · E TO ENTER",
      barn: "WASD OR ARROWS · Q FOR NOTES",
      bones: "1–6 OR TAP PINS · Q FOR NOTES",
      gait: "1–4 TO SELECT · SPACE TO PLAY",
      gut: "WASD OR ARROWS · Z UNDO · R RESET",
      exam: "NUMBER KEYS OR TAP · Q FOR NOTES",
      diploma: "THE NIGHT PRACTICAL · PASSED",
    }[next];
    ui.screen.setAttribute("aria-label", {
      title: "A cowboy and a ghost horse under a violet rift at Horse University",
      hub: "Horse University at night. Five campus doors lead to four courses and the final practical.",
      barn: "A maze of barn stalls with four gold pages, a red-eyed Mothman, and an exit.",
      bones: "Two lower-limb diagrams with three numbered pins each. Foreleg left, hind leg right.",
      gait: "Four horseshoe pads for the left fore, right fore, left hind, and right hind feet.",
      gut: "A grid puzzle. Push the gold hay bale onto the green cross.",
      exam: "The Night Practical. Use the numbered answer buttons below the diagram.",
      diploma: "A Horse University diploma for Cowboyboy.",
    }[next]);
  }

  function setSound(on) {
    save.sound = on;
    Sound.configure(on);
    ui.sound.setAttribute("aria-pressed", String(on));
    ui.sound.querySelector("span").textContent = on ? "on" : "off";
    storeSave();
  }

  function titleScreen() {
    setScene("title");
    ui.start.textContent = save.best !== null ? "View diploma" : save.started ? "Continue" : "Start game";
    ui.fresh.hidden = !save.started;
  }

  function start() {
    Sound.configure(save.sound);
    if (save.best !== null) {
      diploma(save.best);
      return;
    }
    const first = !save.started;
    save.started = true;
    storeSave();
    campus();
    if (first) {
      sheet({
        label: "Horse University · 11:47 p.m.",
        title: "The night practical",
        lines: [
          "Cowboyboy has wanted to study horse anatomy since he first found out horses had knees.",
          "Tonight he needs four course stamps before his final. A violet hole just opened where the exam hall used to be.",
          "Start at the barn. Walk with A/D or the arrows and press E at a door. On touch, tap a door to enter.",
        ],
      });
    }
  }

  function newGame() {
    sheet({
      label: "New game",
      title: "Start another night?",
      lines: ["This clears the stamps and diploma for this browser."],
      buttons: [
        action("Keep my game", closeSheet),
        action("Start over", () => {
          closeSheet();
          save = blankSave(save.sound);
          storeSave();
          start();
        }, { kind: "gold" }),
      ],
    });
  }

  function courseAvailable(i) {
    return i < 4 || save.stamps.length === 4;
  }

  function campus(index = stamps.findIndex(id => !save.stamps.includes(id))) {
    const near = index < 0 ? 4 : index;
    setScene("hub", { x: Art.doors[near], near, face: 1, walking: false });
    campusPanel();
  }

  function campusPanel() {
    const i = state.near;
    const course = CAMPUS[i];
    const name = course ? course.name : "The quad";
    let prompt = "Walk to a lit door, or tap a building to go inside.";
    const buttons = [];
    if (course && courseAvailable(i)) {
      const done = save.stamps.includes(course.id) || (i === 4 && save.best !== null);
      prompt = [
        "Recover Professor Rattle’s missing pages. Something is moving in the stalls.",
        "Help a dead professor put the lower legs back together.",
        "Match the footfalls of a horse that goes straight through the floor.",
        "Push a hay bale through the strangest digestive tract on campus.",
        "Take your final with the thing that came through the rift.",
      ][i];
      if (done) prompt = "Stamp earned. You can run this course again.";
      buttons.push(action(done ? "Replay" : "Enter " + ["barn", "bone room", "gait lab", "rift lab", "exam hall"][i],
        () => enter(i), { kind: "gold", key: "E" }));
    } else if (course) {
      prompt = "The exam hall opens when you have all four stamps.";
    }
    buttons.push(action("Course map", directory));
    panel("Campus / Night shift", name, prompt, buttons);
  }

  function directory() {
    sheet({
      label: "Campus directory",
      title: "Horse University",
      lines: ["Choose a room. The four courses can be taken in any order."],
      buttons: CAMPUS.map(({ name, id }, i) => action(name + (save.stamps.includes(id) ? " ✓" : ""), () => {
        closeSheet();
        enter(i);
      }, { disabled: !courseAvailable(i) })),
    });
  }

  function enter(index) {
    if (!courseAvailable(index)) {
      state.x = Art.doors[index];
      state.near = index;
      campusPanel();
      Sound.effect("wrong");
      return;
    }
    Sound.effect("tap");
    const { id, name } = CAMPUS[index];
    if (id === "barn") initBarn();
    if (id === "bones") initBones();
    if (id === "gait") initGait();
    if (id === "gut") initGut(0);
    if (id === "exam") initExam();
    const lines = {
      barn: [
        "The night janitor saw Mothman tearing pages out of the stable manual. Recover four pages and head for the exit marked X.",
        "Move with WASD, arrows, or the touch pad. If Mothman catches you, you’re sent back to the entrance with the pages you’ve found.",
      ],
      bones: [
        "“I can still teach,” says Professor Rattle. “I just can’t stay assembled.”",
        "Fit each label to a numbered pin on the foreleg or hind leg. Select a button, press 1–6, or tap a pin on the diagram.",
      ],
      gait: [
        "A ghost horse is trying to get upstairs. The door only opens to the right footfalls.",
        "Watch which horseshoes light up together. Then select those feet and play the beat. You can replay the pattern or work through it at your own pace.",
      ],
      gut: [
        "The rift lab has folded a horse’s digestive tract into three rooms. A hay bale is blocking the experiment.",
        "Push the bale onto the green cross in each room. Walk around to the opposite side to change its direction. Undo and Reset room are available.",
      ],
      exam: [
        "Something with six eyes has taken your professor’s chair. It puts a ghost horse on the table and hands you a pencil.",
        "“I have an oral exam in Human Anatomy tomorrow. Tonight, I’m in charge of yours.”",
        "Identify the numbered landmarks and answer the remaining questions. First-try answers count toward your score. You can retry each question and open your notes any time.",
      ],
    }[id];
    sheet({
      label: id === "exam" ? "Final practical" : "Course " + String(index + 1).padStart(2, "0"),
      title: name,
      lines,
      onClose: id === "gait" ? demoGait : undefined,
    });
  }

  function award(id, lines) {
    const index = stamps.indexOf(id);
    if (!save.stamps.includes(id)) save.stamps.push(id);
    storeSave();
    ui.status.textContent = save.stamps.length + "/4 COURSE STAMPS";
    Sound.effect("stamp");
    const next = stamps.findIndex((stamp, i) => i > index && !save.stamps.includes(stamp));
    sheet({
      label: "Course stamp · " + save.stamps.length + "/4",
      title: CAMPUS[index].name + " complete",
      lines,
      onClose: () => campus(next === -1 ? undefined : next),
    });
  }

  function journal() {
    const seen = new Set(save.stamps);
    const notes = { ...JOURNAL };
    if (scene === "barn" && state.count) {
      seen.add("barn");
      notes.barn = JOURNAL.barn.filter((_, i) => state.collected[i]);
    }
    if (scene === "bones" || scene === "gait" || scene === "gut") seen.add(scene);
    const groups = CAMPUS.filter(({ id }) => seen.has(id)).map(({ id, name }) => {
      const group = element("section", "", "note-group");
      const dl = element("dl");
      notes[id].forEach(([term, definition]) => dl.append(element("dt", term), element("dd", definition)));
      group.append(element("h3", name), dl);
      return group;
    });
    sheet({
      label: "Horse University",
      title: "Field notes",
      nodes: groups,
      lines: groups.length ? [] : ["Your field notes fill in as you explore the campus and finish courses."],
      buttons: [],
    });
  }

  function pause() {
    const buttons = [action("Resume", closeSheet, { kind: "gold" })];
    if (scene !== "hub") {
      buttons.push(action("Return to campus", () => {
        closeSheet();
        campus(CAMPUS.findIndex(course => course.id === scene));
      }));
    }
    buttons.push(action("Title screen", () => {
      closeSheet();
      storeSave();
      titleScreen();
    }));
    sheet({
      label: "Night shift paused",
      title: "Take a breather",
      lines: [
        "Move with WASD, arrow keys, or the touch pad. Press Q for notes and M for sound.",
        "Course stamps save between rooms. Leaving a course restarts that room.",
      ],
      buttons,
    });
  }

  function at(map, marker) {
    const y = map.findIndex(row => row.includes(marker));
    return { x: map[y].indexOf(marker), y };
  }

  function same(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function step(p, delta) {
    return { x: p.x + delta.x, y: p.y + delta.y };
  }

  function walkable(map, p) {
    const tile = map[p.y]?.[p.x];
    return Boolean(tile && tile !== "#");
  }

  function chaseStep(map, from, target) {
    if (same(from, target)) return from;
    const queue = [{ p: from, first: from }];
    const seen = new Set([from.y * map[0].length + from.x]);
    for (let i = 0; i < queue.length; i++) {
      for (const delta of Object.values(directions)) {
        const p = step(queue[i].p, delta);
        const id = p.y * map[0].length + p.x;
        if (!walkable(map, p) || seen.has(id)) continue;
        const first = i === 0 ? p : queue[i].first;
        if (same(p, target)) return first;
        queue.push({ p, first });
        seen.add(id);
      }
    }
    return from;
  }

  function initBarn() {
    setScene("barn", {
      player: at(BARN_MAP, "S"), hunter: at(BARN_MAP, "M"), collected: [false, false, false, false],
      count: 0, face: 1, nextMove: 0, hunt: 0.75, safe: 0,
    });
    panel("01 / The barn", "The Stall Map", "Pick up four gold pages, then get to the exit marked X.");
  }

  function barnCaught() {
    if (!state.count || state.safe > 0 || !same(state.player, state.hunter)) return false;
    state.player = at(BARN_MAP, "S");
    state.hunter = at(BARN_MAP, "M");
    state.safe = 2;
    state.hunt = 0.95;
    Sound.effect("catch");
    feedback("Mothman dropped you at the entrance. You kept the pages.", "hint");
    return true;
  }

  function moveBarn(delta) {
    const p = step(state.player, delta);
    if (delta.x) state.face = delta.x;
    if (!walkable(BARN_MAP, p)) return;
    state.player = p;
    if (barnCaught()) return;
    const tile = BARN_MAP[p.y][p.x];
    const index = "ABCD".indexOf(tile);
    if (index !== -1 && !state.collected[index]) {
      state.collected[index] = true;
      state.count++;
      state.hunt = Math.max(state.hunt, 0.7);
      const diagram = element("canvas");
      diagram.width = 172;
      diagram.height = 113;
      diagram.setAttribute("aria-label", "Side view of a horse with the " + LANDMARKS[index].name.toLowerCase() + " marked");
      Art.field(diagram, index);
      Sound.effect("good");
      sheet({
        label: "Field page " + state.count + "/4",
        title: LANDMARKS[index].name,
        nodes: [diagram],
        lines: [
          LANDMARKS[index].text,
          state.count === 1 ? "In the next stall, something opens its eyes." : state.count === 4 ? "You have all four pages. The exit is open." : "",
        ].filter(Boolean),
      });
      if (state.count === 4) feedback("The exit is open.");
    }
    if (tile === "X") {
      if (state.count === 4) {
        award("barn", ["Professor Rattle gets his field pages back. Mothman sticks his head out just long enough to return a library card."]);
      } else {
        feedback("You still need " + (4 - state.count) + (state.count === 3 ? " page." : " pages."), "hint");
      }
    }
  }

  function initBones() {
    setScene("bones", { index: 0, placed: [], selected: -1 });
    bonesPanel();
  }

  function pinButtons(labels, choose, selected, locked = []) {
    return labels.map((label, i) => action(label, () => choose(i), {
      kind: "option", key: String(i + 1), pressed: selected === i, disabled: locked.includes(i),
    }));
  }

  function bonesPanel() {
    const joint = JOINTS[state.index];
    panel("02 / The bone room · " + state.index + "/6 fitted", joint.name, joint.clue,
      pinButtons(slotLabels, chooseJoint, state.selected, state.placed));
  }

  function chooseJoint(index) {
    if (state.placed.includes(index) || index >= Art.slots.length) return;
    const joint = JOINTS[state.index];
    state.selected = index;
    if (index !== joint.slot) {
      Sound.effect("wrong");
      ui.actions.querySelectorAll("button").forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
      feedback("Professor Rattle shakes his skull. " + joint.clue, "hint");
      return;
    }
    state.placed.push(index);
    if (state.placed.length === JOINTS.length) {
      award("bones", ["Professor Rattle tries his new legs. “Four fetlocks, two carpi, two hocks. Good. Now where did I put my torso?”"]);
      return;
    }
    Sound.effect("good");
    state.index++;
    state.selected = -1;
    bonesPanel();
    feedback(joint.name + " fitted.");
  }

  function initGait() {
    setScene("gait", { round: 0, beat: 0, selected: 0, glow: 0, demoBeat: -1, phase: "ready", timer: 0 });
    gaitPanel();
  }

  function gaitPanel() {
    const phrase = GAITS[state.round];
    const picking = state.phase === "echo";
    const buttons = FEET.map((foot, i) => action(foot, () => toggleFoot(i), {
      kind: "option", key: String(i + 1), pressed: Boolean(state.selected & (1 << i)), disabled: !picking,
    }));
    buttons.push(action("Play beat", playBeat, { kind: "gold", disabled: !picking }));
    buttons.push(action("Replay pattern", demoGait, { disabled: !picking }));
    panel("03 / The gait lab · Phrase " + (state.round + 1) + "/4", phrase.name,
      picking ? "Beat " + (state.beat + 1) + " of " + phrase.beats.length + ". Select every foot that lands on this beat." : "Watch the horseshoes. Feet that land together light up together.", buttons);
  }

  function demoGait() {
    state.phase = "demo";
    state.demoBeat = -1;
    state.selected = 0;
    state.glow = 0;
    state.timer = 0.55;
    gaitPanel();
  }

  function toggleFoot(index) {
    if (state.phase !== "echo" || index >= FEET.length) return;
    state.selected ^= 1 << index;
    const button = ui.actions.children[index];
    button.setAttribute("aria-pressed", String(Boolean(state.selected & (1 << index))));
    Sound.effect("tap");
  }

  function playBeat() {
    if (state.phase !== "echo") return;
    const phrase = GAITS[state.round];
    if (!state.selected) {
      feedback("Select at least one hoof first.", "hint");
      return;
    }
    if (state.selected !== phrase.beats[state.beat]) {
      Sound.effect("wrong");
      const feet = FEET.filter((_, i) => phrase.beats[state.beat] & (1 << i));
      feedback("Try this beat with " + feet.join(" and ").toLowerCase() + ".", "hint");
      return;
    }
    Sound.hoof(state.selected);
    state.glow = state.selected;
    state.glowTime = 0.28;
    state.selected = 0;
    state.beat++;
    if (state.beat === phrase.beats.length) {
      state.phase = "interlude";
      state.timer = 0.75;
      gaitPanel();
      ui.prompt.textContent = phrase.clue;
      feedback("Phrase matched.");
    } else {
      gaitPanel();
      feedback("Beat matched.");
    }
  }

  function updateGait(dt) {
    const phrase = GAITS[state.round];
    if (state.phase === "demo") {
      state.timer -= dt;
      if (state.timer <= 0) {
        state.demoBeat++;
        if (state.demoBeat === phrase.beats.length) {
          state.phase = "echo";
          state.glow = 0;
          gaitPanel();
        } else {
          state.glow = phrase.beats[state.demoBeat];
          state.timer = 0.81;
          Sound.hoof(state.glow);
        }
      } else if (state.timer <= 0.3) {
        state.glow = 0;
      }
    } else if (state.phase === "interlude") {
      state.timer -= dt;
      if (state.timer > 0) return;
      if (state.round === GAITS.length - 1) {
        state.phase = "done";
        award("gait", ["The stairwell opens. The horse goes straight through the wall beside it."]);
      } else {
        state.round++;
        state.beat = 0;
        demoGait();
      }
    } else if (state.glowTime > 0) {
      state.glowTime -= dt;
      if (state.glowTime <= 0) state.glow = 0;
    }
  }

  function initGut(room) {
    const map = GUT[room].map;
    setScene("gut", { room, player: at(map, "@"), bale: at(map, "b"), goal: at(map, "x"), history: [], face: 1, nextMove: 0 });
    gutPanel();
  }

  function gutPanel() {
    const area = GUT[state.room];
    panel("04 / The rift lab · Room " + (state.room + 1) + "/3", "Deliver hay to the " + area.name.toLowerCase(),
      area.route + ". Push the hay bale onto the green cross.", [
        action("Undo", undoGut, { key: "Z" }),
        action("Reset room", resetGut, { key: "R" }),
      ]);
  }

  function undoGut() {
    const previous = state.history.pop();
    if (!previous) return;
    Object.assign(state, previous);
    feedback("Move undone.");
  }

  function resetGut() {
    initGut(state.room);
    feedback("Room reset.");
  }

  function moveGut(delta) {
    const map = GUT[state.room].map;
    const p = step(state.player, delta);
    if (!walkable(map, p)) return;
    const pushing = same(p, state.bale);
    const nextBale = pushing ? step(state.bale, delta) : state.bale;
    if (pushing && !walkable(map, nextBale)) return;
    if (state.history.length >= 160) state.history.shift();
    state.history.push({ player: state.player, bale: state.bale, face: state.face });
    state.player = p;
    state.bale = nextBale;
    if (delta.x) state.face = delta.x;
    if (!pushing) return;
    Sound.effect("tap");
    if (!same(nextBale, state.goal)) return;
    const room = state.room;
    const area = GUT[room];
    Sound.effect("good");
    sheet({
      label: "Hay delivered · " + (room + 1) + "/3",
      title: area.name,
      lines: [area.lesson],
      onClose: () => {
        if (room + 1 < GUT.length) initGut(room + 1);
        else award("gut", ["The lab folds back into an ordinary room. The bale has become a post-it that says “THANKS FOR THE FIBER.”"]);
      },
    });
  }

  function initExam() {
    setScene("exam", { index: 0, score: 0, missed: false, selected: -1, confirmed: false });
    examPanel();
  }

  function examPanel() {
    const question = EXAM[state.index];
    const choices = question.map ? LANDMARKS.map(({ where }) => where) : question.legs ? slotLabels : question.options;
    const buttons = pinButtons(choices, chooseAnswer, state.selected, state.confirmed ? choices.map((_, i) => i) : []);
    if (state.confirmed) {
      buttons[state.selected].classList.add("correct");
      buttons.push(action(state.index === EXAM.length - 1 ? "Hand in exam" : "Next question", nextQuestion, { kind: "gold" }));
    }
    panel("Final practical · " + (state.index + 1) + "/" + EXAM.length,
      question.question, question.map || question.legs ? "Choose a numbered pin on the diagram." : "Choose one answer.", buttons);
    if (state.confirmed) {
      feedback(question.map ? LANDMARKS[question.answer].text : "Correct.");
      ui.actions.querySelector(".gold").focus({ preventScroll: true });
    }
  }

  function chooseAnswer(index) {
    const question = EXAM[state.index];
    const length = question.map ? LANDMARKS.length : question.legs ? Art.slots.length : question.options.length;
    if (state.confirmed || index >= length) return;
    state.selected = index;
    if (index !== question.answer) {
      state.missed = true;
      Sound.effect("wrong");
      ui.actions.querySelectorAll("button").forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
      feedback(question.hint, "hint");
      return;
    }
    if (!state.missed) state.score++;
    state.confirmed = true;
    Sound.effect("good");
    examPanel();
  }

  function nextQuestion() {
    if (!state.confirmed) return;
    if (state.index + 1 === EXAM.length) {
      const score = state.score;
      save.best = Math.max(save.best ?? 0, score);
      storeSave();
      diploma(score);
      Sound.effect("win");
      return;
    }
    state.index++;
    state.missed = false;
    state.selected = -1;
    state.confirmed = false;
    examPanel();
    ui.actions.querySelector("button").focus({ preventScroll: true });
  }

  function diploma(score) {
    setScene("diploma", { score });
    panel("Graduation / Horse University", "Cowboyboy, class of tonight",
      "The examiner gives you a diploma and asks where its own withers are. You tell it you’ll need to count its shoulders first.", [
        action("Back to campus", () => campus(4), { kind: "gold" }),
        action("Field notes", journal),
        action("Title screen", titleScreen),
      ]);
    feedback(score + "/" + EXAM.length + " correct on the first try.");
  }

  function moveHub(delta, pixels) {
    if (!delta.x) return;
    state.face = delta.x;
    state.x = Math.min(372, Math.max(12, state.x + delta.x * pixels));
    const near = Art.doors.findIndex(x => Math.abs(x - state.x) < 24);
    if (state.near !== near) {
      state.near = near;
      campusPanel();
    }
  }

  function startMove(token, dir) {
    if (ui.sheet.open || !["hub", "barn", "gut"].includes(scene) || moves.has(token)) return;
    moves.set(token, dir);
    if (scene === "hub") moveHub(directions[dir], 6);
    if (scene === "barn" || scene === "gut") {
      state.nextMove = 0.22;
      if (scene === "barn") moveBarn(directions[dir]);
      else moveGut(directions[dir]);
    }
  }

  function activate() {
    if (scene === "title") start();
    else if (scene === "hub" && state.near !== -1) enter(state.near);
    else if (scene === "gait") playBeat();
    else if (scene === "exam" && state.confirmed) nextQuestion();
  }

  function onKey(event) {
    if (event.altKey || event.metaKey || event.ctrlKey || ui.sheet.open) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const dir = keys[key];
    if (dir && ["hub", "barn", "gut"].includes(scene)) {
      event.preventDefault();
      if (!event.repeat) startMove(event.code, dir);
      return;
    }
    if (event.repeat) return;
    if (key === "m") setSound(!save.sound);
    else if (key === "q" && !ui.journal.hidden) journal();
    else if (key === "Escape" && !ui.pause.hidden) pause();
    else if (key === "z" && scene === "gut") undoGut();
    else if (key === "r" && scene === "gut") resetGut();
    else if (key === " " && scene === "gait" && (event.target.tagName !== "BUTTON" || ui.actions.contains(event.target))) {
      event.preventDefault();
      playBeat();
    } else if (key === "e" || (["Enter", " "].includes(key) && event.target.tagName !== "BUTTON")) {
      event.preventDefault();
      activate();
    } else if (/^[1-6]$/.test(key)) {
      const index = Number(key) - 1;
      if (scene === "bones") chooseJoint(index);
      if (scene === "gait") toggleFoot(index);
      if (scene === "exam") chooseAnswer(index);
    }
  }

  function hit(points, x, y, rx, ry) {
    return points.findIndex(([px, py]) => Math.abs(px - x) <= rx && Math.abs(py - y) <= ry);
  }

  function onCanvas(event) {
    if (ui.sheet.open) return;
    const rect = ui.screen.getBoundingClientRect();
    const x = (event.clientX - rect.left) * 384 / rect.width;
    const y = (event.clientY - rect.top) * 216 / rect.height;
    if (scene === "hub" && y > 74 && y < 177) {
      const index = Art.doors.findIndex(door => Math.abs(door - x) < 35);
      if (index !== -1) enter(index);
    } else if (scene === "bones") {
      const index = hit(Art.slots, x, y, 20, 19);
      if (index !== -1) chooseJoint(index);
    } else if (scene === "gait") {
      const index = hit(Art.footPads, x, y, 26, 22);
      if (index !== -1) toggleFoot(index);
    } else if (scene === "exam") {
      const question = EXAM[state.index];
      const index = hit(question.map ? Art.pins : question.legs ? Art.slots : [], x, y, 13, 13);
      if (index !== -1) chooseAnswer(index);
    }
  }

  function update(dt) {
    const dir = Array.from(moves.values()).at(-1);
    if (scene === "hub") {
      state.walking = Boolean(dir && directions[dir].x);
      if (state.walking) moveHub(directions[dir], dt * 90);
    }
    if (scene === "barn" || scene === "gut") {
      if (dir) {
        state.nextMove -= dt;
        if (state.nextMove <= 0) {
          state.nextMove = scene === "barn" ? 0.118 : 0.16;
          if (scene === "barn") moveBarn(directions[dir]);
          else moveGut(directions[dir]);
          if (ui.sheet.open) return;
        }
      }
      if (scene === "barn") {
        state.safe = Math.max(0, state.safe - dt);
        if (state.count > 0) {
          state.hunt -= dt;
          if (state.hunt <= 0) {
            state.hunter = chaseStep(BARN_MAP, state.hunter, state.player);
            state.hunt = 0.72 - state.count * 0.078;
            barnCaught();
          }
        }
      }
    }
    if (scene === "gait") updateGait(dt);
    Sound.tick(scene);
  }

  function frame(now) {
    const dt = previousFrame ? Math.min((now - previousFrame) / 1000, 0.05) : 0;
    previousFrame = now;
    if (!ui.sheet.open && !document.hidden) update(dt);
    const t = reducedMotion.matches ? 0 : now / 1000;
    if (scene === "title") Art.title(t);
    if (scene === "hub") Art.hub(t, state, save.stamps, save.best !== null);
    if (scene === "barn") Art.barn(t, state);
    if (scene === "bones") Art.bones(t, state);
    if (scene === "gait") Art.gait(t, state);
    if (scene === "gut") Art.gut(t, state);
    if (scene === "exam") Art.exam(t, EXAM[state.index], state);
    if (scene === "diploma") Art.diploma(t, state.score);
    requestAnimationFrame(frame);
  }

  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", event => moves.delete(event.code));
  window.addEventListener("blur", clearMovement);
  window.addEventListener("pagehide", storeSave);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearMovement();
  });
  ui.start.addEventListener("click", start);
  ui.fresh.addEventListener("click", newGame);
  ui.sound.addEventListener("click", () => setSound(!save.sound));
  ui.journal.addEventListener("click", journal);
  ui.pause.addEventListener("click", pause);
  ui.close.addEventListener("click", closeSheet);
  ui.sheet.addEventListener("cancel", event => {
    event.preventDefault();
    closeSheet();
  });
  ui.screen.addEventListener("click", onCanvas);
  ui.touchpad.querySelectorAll("button").forEach(button => {
    const dir = button.dataset.direction;
    button.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      button.classList.add("active");
      startMove("touch-" + event.pointerId, dir);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
      button.addEventListener(type, event => {
        button.classList.remove("active");
        moves.delete("touch-" + event.pointerId);
      });
    });
    button.addEventListener("click", event => {
      if (event.detail !== 0) return;
      startMove("dpad", dir);
      moves.delete("dpad");
    });
  });

  ui.sound.setAttribute("aria-pressed", String(save.sound));
  ui.sound.querySelector("span").textContent = save.sound ? "on" : "off";
  titleScreen();
  requestAnimationFrame(frame);
})();
