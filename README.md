# Cowboyboy

Cowboyboy is a short 8-bit browser game set at Horse University. Four courses stand between a cowboy and his horse anatomy final. Mothman has taken the field notes, Professor Rattle keeps coming apart, a ghost horse needs help with its footwork, and something from the rift has volunteered to proctor the exam.

A first run is designed for about 10–15 minutes.

| Course | What you do | What you learn |
| --- | --- | --- |
| The Stall Map | Retrieve four pages in a barn maze while Mothman follows you | Poll, withers, barrel, and croup |
| Spare Parts | Fit labels to the professor's lower-limb diagrams | Knee, hock, fetlock, and hoof |
| Ghost Hoofbeats | Watch and echo footfalls with single or paired hooves | Walk, trot, and right-lead canter |
| Gut Check | Push hay through three puzzle rooms | The route from the mouth to the large colon |
| The Night Practical | Label diagrams and answer the examiner's questions | Review all four courses |

## Play locally

Open `index.html` in a modern browser. You can also serve the repo with `python3 -m http.server 8000` and open `http://localhost:8000`.

- Move with WASD or the arrow keys. Press E at a campus door.
- Click or tap campus doors, diagram pins, and hoof pads. A touch pad appears in movement scenes on touchscreens.
- Use number keys to choose pins, hooves, and answers. Press Space to play a hoofbeat.
- Press Q for field notes, Escape to pause, and M to toggle sound. In Gut Check, use Z to undo and R to reset the room.

Course stamps and the best exam score save in the current browser when its storage is available. Sound is opt-in.

## Build for itch.io

Run `python3 scripts/build.py` to create `dist/Cowboyboy.html`. Open that file directly to play offline. It includes all runtime assets and has no network dependencies.

On the itch.io project editor, select **HTML Game**, upload `Cowboyboy.html`, and mark it **This file will be played in the browser**. The layout works in a responsive iframe. For a fixed desktop embed, start with **960 × 760**. Enable mobile support and preview the draft before publishing. [itch.io's HTML5 upload guide](https://itch.io/docs/creators/html5)

## Anatomy references

- [Mississippi State University Extension, Your 4-H Horse](https://extension.msstate.edu/publications/your-4-h-horse-care-management-and-horsemanship)
- [University of Minnesota, Large Animal Anatomy](https://pressbooks.umn.edu/largeanimalanatomy/chapter/distal-limb/)
- [University of Georgia Cooperative Extension, Evaluating Common Equine Performance Classes](https://extension.uga.edu/publications/detail.html?number=B1401&title=evaluating-common-equine-performance-classes)
- [Penn State Extension, Colic: What are the Signs and How to Manage?](https://extension.psu.edu/colic-what-are-the-signs-and-how-to-manage)

Press Start 2P is bundled under the [SIL Open Font License](assets/OFL.txt). The game uses original pixel art and synthesized audio.
