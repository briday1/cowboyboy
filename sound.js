"use strict";

const Sound = (() => {
  let context;
  let output;
  let enabled = false;
  let beat = 0;
  let nextNote = 0;
  let lastScene = "";
  const melodies = {
    hub: [62, 69, 65, 69, 60, 67, 64, 67, 58, 65, 62, 65, 57, 64, 60, 64],
    barn: [50, 0, 57, 53, 50, 0, 56, 57, 48, 0, 55, 52, 49, 0, 56, 53],
    bones: [65, 0, 62, 69, 62, 0, 57, 62, 64, 0, 60, 67, 60, 0, 55, 60],
    gut: [55, 62, 67, 0, 58, 65, 70, 0, 57, 64, 69, 0, 53, 60, 65, 0],
    exam: [57, 0, 64, 0, 58, 0, 65, 0, 60, 0, 67, 0, 61, 0, 68, 0],
    diploma: [62, 66, 69, 74, 0, 73, 69, 66, 67, 71, 74, 79, 0, 78, 74, 71],
  };

  function configure(on) {
    enabled = on;
    if (!enabled) {
      if (output) output.gain.value = 0;
      return;
    }
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) return;
    try {
      if (!context) {
        context = new Audio();
        output = context.createGain();
        output.connect(context.destination);
      }
      output.gain.value = 0.26;
      if (context.state === "suspended") context.resume().catch(() => {});
    } catch {
      // Gameplay works with a browser or embed that blocks Web Audio.
    }
  }

  function note(midi, duration, volume, type = "square", delay = 0) {
    if (!enabled || !output || context.state !== "running") return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    envelope.gain.setValueAtTime(0.001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + 0.009);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope).connect(output);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.005);
  }

  function tick(scene) {
    const melody = melodies[scene];
    if (!enabled || !context || !melody || context.state !== "running") return;
    const now = context.currentTime;
    if (lastScene !== scene) {
      lastScene = scene;
      nextNote = now;
      beat = 0;
    }
    if (now < nextNote) return;
    const midi = melody[beat % melody.length];
    if (midi) {
      note(midi, 0.15, 0.07, "triangle");
      if (beat % 4 === 0) note(midi - 12, 0.29, 0.035);
    }
    beat++;
    nextNote = now + (scene === "barn" ? 0.23 : 0.31);
  }

  function effect(name) {
    const phrase = {
      tap: [62], good: [69, 74], wrong: [49, 46], catch: [55, 47, 40],
      stamp: [62, 66, 69, 74], win: [62, 66, 69, 74, 78, 81],
    }[name];
    phrase?.forEach((midi, i) => note(midi, 0.16, 0.14, "square", i * 0.09));
  }

  function hoof(mask) {
    for (let i = 0; i < 4; i++) {
      if (mask & (1 << i)) note([53, 56, 45, 48][i], 0.18, 0.32, "triangle");
    }
  }

  return { configure, tick, effect, hoof };
})();
