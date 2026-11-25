# Woodcraft Atelier — a workshop made of real wood

A free, 100% client-side woodworking playground where every surface is grown from code: growth rings, cathedrals, pores, medullary rays, knots, end-grain cross-sections, plywood edges and varnish sheen — no image files, no trees harmed.

**Live:** https://kumarnikhildeveloperaccount.github.io/woodcraft/

> Wood you like to see more? We'd tell you a joke about plywood, but it's layered.

## Features

- **Procedural wood engine** (`js/wood.js`): tileable value-noise + fBm canvas textures for oak, walnut, cherry, maple, teak, sheesham (Indian rosewood), mahogany, pine, ebony, bamboo, plus hinoki, rustic pine and a secret burl. There are end-grain slices for each one, and SVG `feTurbulence` / `feDisplacementMap` give the fibres and rough carved edges.
- **Re-veneer the workshop**: the species switcher re-skins the whole UI with a hand-plane sweep, curly shavings and a plane sound.
- **Four moods**: Daylight workshop (sunbeams and dust motes), Workshop at night (a warm lamp follows your cursor), Japanese joinery (hinoki, shoji lattice, wooden pegs instead of screws, hanko seal), Rustic cabin (log walls, forged nails, flickering fire glow, flannel toasts).
- **Wooden UI**: carved and engraved lettering, dovetail corners, brass screws and hinges, drawer navigation with spring physics, wooden toggle switches, pencil notes, pinned paper, a sawdust particle system.
- **Synthesized sounds** (Web Audio, no files): knock on wood (pitch follows species density), drawer friction, hinge creak, saw, sanding hiss, hammer, chisel, hand plane, marimba. Audio stays silent until your first interaction, and the mute setting is remembered.
- **Species library**: Janka hardness, density, shrinkage, workability, uses, sustainability notes, price, a live swatch and end grain for each wood, search and sort, and an animated Janka chart.
- **Lumber calculators**: board feet, m³ and ft³ in imperial or metric, cost with waste, weight, and a saved lumber order. A moisture and movement calculator uses the USDA Wood Handbook EMC formula with tangential/radial shrinkage.
- **Cut-list optimizer**: guillotine bin packing with kerf and a grain-direction lock, a visual board layout, yield %, and JSON export/import. Your list is kept in localStorage.
- **Joinery encyclopedia**: 14 joints assemble themselves as animated SVG (mortise & tenon, dovetail, box, half-lap, bridle, dado, rabbet, tongue & groove, dowel, biscuit, splined miter, scarf, butt, kanawa tsugi). Each comes with strength, difficulty, tools and uses.
- **Finish & stain previewer**: drag a rag across a live plank to apply 13 finishes and 7 stains, with coats, sheen and a before/after split.
- **Rosewood marimba**: 25 bars (C4–C6) with brass resonators, playable by mouse, touch or keyboard, plus a demo tune.
- **Puzzle corner**: a sliding-block puzzle (3×3 or 4×4) with best scores, and a seven-piece multi-wood tangram with four target shapes.
- **Carve your name**: the text is cut into a plank as a V-groove with a chisel animation. Choose from 4 lettering styles and brass, ebony, turquoise or gold-leaf inlay, then download a PNG.
- **Easter eggs**: knock on the sign three times; try the Konami code; type "termite".

## Files

```
index.html             app shell & all views
404.html               friendly not-found page (links home)
favicon.svg            end-grain favicon
manifest.webmanifest   PWA metadata
css/base.css           tokens, wood surfaces, carved type, hardware, layout, overlays
css/sections.css       every section + responsive + reduced-motion
css/themes.css         Day / Night / Japanese / Rustic themes and ambience
js/wood.js             procedural wood & end-grain generator
js/audio.js            Web Audio synthesizer
js/data.js             species, finishes, stains, jokes
js/app.js              veneer/mode engine, drawers, sawdust, lamp, toasts, easter eggs
js/library.js          species library + Janka chart
js/calc.js             board-foot / volume / moisture calculators
js/cutlist.js          cut-list optimizer
js/joinery.js          joinery encyclopedia
js/finish.js           finish previewer
js/marimba.js          marimba
js/puzzles.js          sliding puzzle + tangram
js/carve.js            carve-your-name generator + About cabinet door
```

There are no external libraries, CDNs, APIs, trackers or cookies. All paths are relative, so the site deploys as-is to GitHub Pages.

## Accessibility & performance

You can reach everything from the keyboard: radio groups support arrow keys, there is a listbox for joints, arrow keys move the puzzle tiles, and the tangram has R/F/arrow controls. The site includes a skip link, ARIA labels and live regions. It respects `prefers-reduced-motion`. The layout is responsive from 360 px to 4K, with an off-canvas drawer nav on small screens. Textures are generated lazily and cached as blob URLs.

## Honest limitations

- The wood textures are procedural approximations, not photographs. They look convincing at UI scale but are not botanical references.
- Species figures are typical published values, rounded. Real boards vary, and prices are fictional.
- The cut-list optimizer is a fast heuristic (guillotine, best-fit), so it does not guarantee the optimal layout.
- The fonts on the carving canvas depend on what your system has installed (there are no web-font downloads).
- Audio needs a user gesture before it plays, as browsers require.

## Credits

Designed & built by **Kumar Nikhil** · [Portfolio](https://kumarnikhildeveloperaccount.github.io/) · [LinkedIn](https://www.linkedin.com/in/kumar-nikhil-1000a9192/) · [Email](mailto:nkashyapnikhilnk@gmail.com) · [More projects by Kumar Nikhil →](https://kumarnikhildeveloperaccount.github.io/)

With gratitude to God — Om Namah Paarvati Pateh, Har Har Mahadev. May God bless you and everyone.
