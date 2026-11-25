# Roadmap

**The aim:** a finished game that shines on a desktop computer. The phone is where it gets play-tested for now, so the phone build must stay playable, but desktop quality is the target.

One stage at a time. Each stage has a checklist agreed before work starts, ends with a play-test, and the play-test notes set the next checklist. Reports go against the checklist: what is done, what was looked at, what was not.

## Stage 1: make sure it is still a game

Every quest, door and boss was moved onto real ground by code. Tests prove things can be reached; they do not prove the story still works.

Already covered by tests: the opening, the walk to Belle Isle, the whole first dungeon, every boss fight, the credits, and that all 55 rooms connect.

- [ ] Walk the whole story in order in a test: for each goal, the place it points to can be reached from the last one, and its door can be opened with what you hold at that point
- [ ] Each sealed door needs the item it should (no shortcuts, no dead ends)
- [ ] Every side challenge can be started and finished on the real streets (timers suit the bigger maps)
- [ ] The map screen and the goal text point to the right place in every district
- [ ] Old saves load into a sensible spot
- [ ] Play-test: a fresh game through the first two dungeons

Done when the game can be finished from a fresh save.

## Stage 2: make it fun to play

- [ ] Combat. Direction still to be chosen: more moves for the player, more aggressive enemies, punchier hits, or all three
- [ ] Enemy numbers and placement for districts that are 2.5 times bigger
- [ ] Getting around: the bike, running, and shortcuts between districts
- [ ] Something to find on the long streets (stashes, people, things to read)
- [ ] Play-test: 20 minutes of free play

Done when you would choose to keep playing after 20 minutes.

## Stage 3: set a speed budget

Desktop is the target, but there is no desktop to measure on yet. Until there is, the software renderer used for screenshots says nothing about speed.

- [ ] An on-screen counter: frames a second, triangles drawn, district build time
- [ ] Measure every district on the phone at each quality level
- [ ] Set limits a district must stay under, for phone and for desktop, and a test that fails when one goes over
- [ ] Desktop quality level: decide what it turns on (denser grass, longer view, more traffic) so there is room to shine
- [ ] When a desktop is available: measure there and adjust

Done when it runs acceptably on the phone and the desktop level has a written budget.

## Stage 4: finish three districts properly

Capitol Square, Church Hill and Carytown, brought to done in every respect, instead of one feature across all 24.

- [ ] A checklist per district of what the real place has that the game lacks
- [ ] Buildings, ground, street furniture, lighting, people and sound for each
- [ ] Their landmarks checked against photographs
- [ ] Play-test: walk each one end to end, day and night

Done when those three look finished.

## Stage 5: roll out, and interiors

- [ ] Apply what worked to the other 21 districts
- [ ] Interiors: furniture laid out for each room's shape, curved pools and pits
- [ ] Large parks the map data lost (Hollywood Cemetery's grounds, Capitol Square's park): fetch them properly

Done when no district or room looks a generation behind.

## Stage 6: ship polish

- [ ] The first five minutes for a new player
- [ ] Sound and music pass
- [ ] Saves, settings and controls on desktop (keyboard, mouse, gamepad)
- [ ] Credits and licences complete

Done when you would send the link to a stranger.

## Known gaps, not yet in a stage

- Nothing has been run on a real desktop graphics card
- Neighbouring districts do not line up geographically; you cross at the map edge
- A bridge the map splits into pieces can step where two pieces meet over water
