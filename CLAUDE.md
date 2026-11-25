# River City Quest (Modern): working rules

A Zelda-like set in Richmond, Virginia. Plain JavaScript, hand-written WebGL2, no build step. Live on GitHub Pages from `main`.

**Read `ROADMAP.md` before starting work.** It says what the aim is (shine on desktop; phone is the test device for now), which stage is current, and its checklist. Work on the current stage unless the user says otherwise, and tick items off as they are finished.

## Hard rules

- **No Adobe-licensed assets.** No Mixamo, no Adobe Stock, nothing under Adobe terms. Check the licence of anything brought in.
- **Credit the data.** Map data is © OpenStreetMap contributors (ODbL). Ground heights are Terrain Tiles on AWS (USGS 3DEP). Both credits stay on the title screen and in the README.
- **Keep `main` working.** Run `node tests/run.js` before every commit to `main`. If a change can't pass yet, put it on a branch and say so.
- **Never edit generated files by hand:** `js/worlddata.js`, `js/worldelev.js`, `js/bodydata.js`. Change the tool that builds them.
- **Bump `VERSION` in `sw.js`** whenever a file the game loads changes, or players keep the old copy.
- **New script files** go in both `index.html` and the list in `sw.js`, in load order.

## How the code is laid out

- Classic scripts sharing one global scope. Load order is the order in `index.html`. No modules, no bundler.
- Outdoors is real map data: `js/world.js` (what is where, collision, content placement), `js/worldmesh.js` (what you see), `js/traffic.js`.
- The ground height is a texture the shaders add to every vertex. Build things flat at y = 0. Anything that must stay level (a building, a bridge deck) is registered as a rigid range in `buildWorldMesh`. On the CPU use `gY(x,z)`.
- Rooms and dungeons: outline is a distance field in `js/roomplan.js`; the 16 by 11 grid is only a notebook for puzzles.
- Tests reach game internals through `window.__g` in `js/main.js`. Add names there when a test needs them.

## Conventions

- Comments say what the thing is in plain words, not how the code was changed.
- Positions outdoors are metres: x east, z south, origin at the north-west corner of the 400 by 300 m play area.
- Things placed outdoors must be reachable: place on `worldMain` ground (use the `snap` helpers in `worldContent`), never by fixed coordinates.
- Tests find places by what they are (a door to a room, an edge with a clear run), not by fixed squares. See `tests/worldhelp.js`.
- Phones get a lighter world: guard heavy detail with `WLOW`.

## Checking work

- `node tests/run.js` runs everything headless (about two minutes).
- Look at it before calling it done. `python3 tools/shots/shot.py <name>...` and `python3 tools/shots/room.py <room id>...` take screenshots with Playwright and Chrome's software renderer. They are slow; allow several minutes.
- Screenshots from a software renderer do not show real performance. Say so when reporting.

## Map data

- `.github/workflows/osm.yml` downloads OpenStreetMap data and ground heights to the `osm-raw` branch (run it from the Actions tab; it resumes).
- `node tools/osm/build.js <folder>` builds `js/worlddata.js`; `node tools/osm/elevbuild.js <folder>` builds `js/worldelev.js`.
- District centres are in `tools/osm/districts.json`.

## Reporting

- Say what was checked and what was not. A passing test is not the same as having looked at it.
- List what is still wrong or unfinished, plainly.
