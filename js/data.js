/* Woodcraft Atelier — reference data (typical published values; real wood varies) */
(function () {
  'use strict';
  var WC = window.WC = window.WC || {};

  WC.SPECIES = [
    { id: 'oak', name: 'White Oak', latin: 'Quercus alba', origin: 'Eastern North America', janka: 1360, density: 755, shrinkT: 10.5, shrinkR: 5.6, work: 4, workNote: 'Machines and steam-bends well; can tear out on interlocked rays. Tannins react with iron (hello, black stains from steel wool).', uses: ['Furniture', 'Flooring', 'Barrels', 'Boat frames'], sustain: 3, sustainNote: 'Widely available and not threatened. Buy locally where you can.', price: 9, fact: 'Its pores are plugged with tyloses, making it watertight — the reason whiskey barrels are white oak.', ink: 'dark' },
    { id: 'walnut', name: 'Black Walnut', latin: 'Juglans nigra', origin: 'Eastern USA', janka: 1010, density: 610, shrinkT: 7.8, shrinkR: 5.5, work: 5, workNote: 'Cuts, carves and finishes like butter. The sawdust can irritate — wear a mask.', uses: ['Fine furniture', 'Gunstocks', 'Turnery', 'Veneer'], sustain: 3, sustainNote: 'Not threatened. Sapwood is pale; steamed lumber evens the colour.', price: 14, fact: 'Walnut roots release juglone, which suppresses many plants nearby. Rude, but effective.', ink: 'light' },
    { id: 'cherry', name: 'Black Cherry', latin: 'Prunus serotina', origin: 'Eastern North America', janka: 950, density: 560, shrinkT: 7.1, shrinkR: 3.7, work: 5, workNote: 'Silky to plane. Burns easily with dull blades and can blotch under stain.', uses: ['Cabinetry', 'Furniture', 'Interior millwork', 'Instruments'], sustain: 3, sustainNote: 'Not threatened.', price: 10, fact: 'Fresh cherry is salmon-pink and darkens to a deep red-brown with light — patience is the finish.', ink: 'dark' },
    { id: 'maple', name: 'Hard Maple', latin: 'Acer saccharum', origin: 'North America', janka: 1450, density: 705, shrinkT: 9.9, shrinkR: 4.8, work: 3, workNote: 'Hard on cutters, prone to burning; blotches with dye stains. Curly figure tears out easily.', uses: ['Butcher blocks', 'Flooring', 'Guitar necks', 'Bowling lanes'], sustain: 3, sustainNote: 'Not threatened.', price: 7, fact: 'The same tree gives maple syrup — the only lumber that comes with breakfast.', ink: 'dark' },
    { id: 'teak', name: 'Teak', latin: 'Tectona grandis', origin: 'South & Southeast Asia', janka: 1070, density: 655, shrinkT: 5.8, shrinkR: 2.5, work: 3, workNote: 'Works fine but its silica dulls edges fast. Oily surface: wipe with solvent before gluing.', uses: ['Boat decks', 'Outdoor furniture', 'Flooring', 'Turnery'], sustain: 2, sustainNote: 'Old-growth natural teak is over-harvested. Choose certified plantation or reclaimed teak.', price: 25, fact: 'Natural oils make teak so weather-proof it is the default wood of yacht decks.', ink: 'dark' },
    { id: 'sheesham', name: 'Sheesham (Indian Rosewood)', latin: 'Dalbergia sissoo', origin: 'Indian subcontinent', janka: 1660, density: 770, shrinkT: 5.4, shrinkR: 2.9, work: 3, workNote: 'Dense with interlocked grain; carves crisply and polishes to a warm lustre.', uses: ['Furniture', 'Carvings', 'Instruments', 'Cabinetry'], sustain: 3, sustainNote: 'Widely planted in India and Pakistan. Dalbergia trade rules have changed over the years — check current regulations when shipping abroad.', price: 12, fact: 'A classic of Indian furniture-making — and the reason many grandparents\u2019 chairs outlive the house.', ink: 'light' },
    { id: 'mahogany', name: 'Genuine Mahogany', latin: 'Swietenia macrophylla', origin: 'Central & South America', janka: 800, density: 590, shrinkT: 4.1, shrinkR: 3.0, work: 5, workNote: 'The cabinetmaker\u2019s benchmark: stable, carves well, takes finish beautifully.', uses: ['Fine furniture', 'Boat building', 'Instruments', 'Carving'], sustain: 1, sustainNote: 'Trade-controlled (CITES Appendix II). Buy certified, or consider African mahogany (Khaya) as a substitute.', price: 16, fact: 'Ribbon-striped quartersawn mahogany shimmers like silk as you walk past it (chatoyance).', ink: 'light' },
    { id: 'pine', name: 'Eastern White Pine', latin: 'Pinus strobus', origin: 'Eastern North America', janka: 380, density: 400, shrinkT: 6.1, shrinkR: 2.1, work: 5, workNote: 'Forgiving and light; dents if you look at it wrong. Seal knots before painting.', uses: ['Construction', 'Country furniture', 'Mouldings', 'Carving'], sustain: 3, sustainNote: 'Abundant and fast-growing.', price: 4, fact: 'Colonial-era tall white pines were reserved by the Crown for ship masts — marked with the "broad arrow".', ink: 'dark' },
    { id: 'ebony', name: 'Gaboon Ebony', latin: 'Diospyros crassiflora', origin: 'West & Central Africa', janka: 3080, density: 955, shrinkT: 8.8, shrinkR: 5.4, work: 1, workNote: 'Very hard and brittle; blunts tools and can check. Polishes to glass.', uses: ['Fingerboards', 'Inlay', 'Chess pieces', 'Small turnings'], sustain: 1, sustainNote: 'Threatened by over-harvesting. Use reclaimed scraps or certified stock — tiny amounts go a long way.', price: 120, fact: 'Dense enough to sink in water. Your ebony boat will be very short-lived.', ink: 'light' },
    { id: 'bamboo', name: 'Moso Bamboo', latin: 'Phyllostachys edulis', origin: 'China (now widely farmed)', janka: 1380, density: 700, shrinkT: 3.6, shrinkR: 2.0, work: 3, workNote: 'Technically a grass. Engineered boards are glued strips; sharp carbide prevents splintering.', uses: ['Flooring', 'Cutting boards', 'Scaffolding', 'Panels'], sustain: 4, sustainNote: 'Regrows from roots and matures in 3\u20135 years. Mind the adhesives and the shipping miles.', price: 6, fact: 'Some bamboo grows almost a metre a day. You can almost hear it.', ink: 'dark' },
    { id: 'hinoki', name: 'Hinoki Cypress', latin: 'Chamaecyparis obtusa', origin: 'Japan', janka: 550, density: 410, shrinkT: 5.2, shrinkR: 2.4, work: 5, workNote: 'Straight, fine and fragrant. Planes to a mirror with a sharp kanna.', uses: ['Temples & shrines', 'Ofuro baths', 'Cutting boards', 'Shoji frames'], sustain: 3, sustainNote: 'Plantation-grown in Japan; old-growth is protected.', price: 18, fact: 'The lemony scent lingers for decades — temples smell faintly of it centuries later.', ink: 'dark' }
  ];
  WC.speciesById = function (id) {
    for (var i = 0; i < WC.SPECIES.length; i++) if (WC.SPECIES[i].id === id) return WC.SPECIES[i];
    if (id === 'rustic') return { id: 'rustic', name: 'Knotty Barn Pine', density: 420, janka: 420, shrinkT: 6.1, shrinkR: 2.1, price: 5, ink: 'light' };
    if (id === 'burl') return { id: 'burl', name: 'Golden Walnut Burl', density: 640, janka: 1010, shrinkT: 7.8, shrinkR: 5.5, price: 60, ink: 'light' };
    return WC.SPECIES[0];
  };
  WC.SWITCHER = ['oak', 'walnut', 'cherry', 'maple', 'teak', 'sheesham', 'mahogany', 'pine', 'ebony', 'bamboo'];

  /* Finishes: tint (rgb), strength 0..1, gloss 0..1, pop = grain contrast, opaque covers grain */
  WC.FINISHES = [
    { id: 'raw', name: 'Raw / unfinished', tint: [255, 255, 255], str: 0, gloss: 0, pop: 1, dry: '—', dur: 0, food: 'Yes', note: 'Pretty for about a week. Then fingerprints, spills and sun move in.' },
    { id: 'blo', name: 'Boiled linseed oil', tint: [196, 132, 52], str: .24, gloss: .22, pop: 1.18, dry: '12\u201324 h / coat', dur: 1, food: 'Once fully cured', note: 'Warm amber glow and big grain "pop". Oily rags can self-heat: lay them flat to dry outdoors.' },
    { id: 'tung', name: 'Pure tung oil', tint: [208, 156, 76], str: .18, gloss: .2, pop: 1.14, dry: '24\u201372 h / coat', dur: 2, food: 'Yes, once cured', note: 'Thin coats, lots of patience, beautiful water-resistant satin.' },
    { id: 'danish', name: 'Danish oil', tint: [188, 126, 58], str: .22, gloss: .3, pop: 1.15, dry: '6\u201312 h / coat', dur: 2, food: 'Check the label', note: 'Oil/varnish blend: wipe on, wait, wipe off. The friendliest finish there is.' },
    { id: 'shellac', name: 'Amber shellac', tint: [190, 116, 36], str: .34, gloss: .72, pop: 1.12, dry: '30\u201360 min', dur: 2, food: 'Yes (it coats candy!)', note: 'Bug-based, fast-drying, a superb sealer under almost anything. Alcohol is its kryptonite.' },
    { id: 'blonde', name: 'Blonde dewaxed shellac', tint: [232, 192, 120], str: .12, gloss: .7, pop: 1.08, dry: '30\u201360 min', dur: 2, food: 'Yes', note: 'Keeps pale woods pale; perfect barrier coat before water-based topcoats.' },
    { id: 'poly', name: 'Wipe-on polyurethane', tint: [204, 150, 80], str: .2, gloss: .62, pop: 1.08, dry: '4\u20136 h / coat', dur: 4, food: 'Once fully cured', note: 'Tough plastic armour. Thin coats avoid drips and brush marks.' },
    { id: 'wbpoly', name: 'Water-based poly', tint: [250, 248, 244], str: .03, gloss: .55, pop: 1.03, dry: '2 h / coat', dur: 4, food: 'Once fully cured', note: 'Water-clear and low-odour; can look a bit "cold" on dark woods.' },
    { id: 'lacquer', name: 'Nitro lacquer', tint: [222, 182, 112], str: .1, gloss: .88, pop: 1.1, dry: '15\u201330 min', dur: 3, food: 'Once cured', note: 'Spray finish of guitars and fine furniture. Each coat melts into the last.' },
    { id: 'hardwax', name: 'Hardwax oil', tint: [212, 172, 104], str: .12, gloss: .3, pop: 1.1, dry: '8\u201312 h', dur: 3, food: 'Yes (most brands)', note: 'Natural look, easy spot repairs. Floors love it.' },
    { id: 'wax', name: 'Paste wax', tint: [230, 200, 150], str: .08, gloss: .4, pop: 1.05, dry: '15 min, buff', dur: 1, food: 'Yes (beeswax)', note: 'Soft glow and silky feel; best as a topcoat for something tougher.' },
    { id: 'milk', name: 'Milk paint (sage)', tint: [128, 146, 116], str: .82, gloss: .05, pop: .6, opaque: true, dry: '30 min', dur: 2, food: 'Yes (non-toxic)', note: 'Chalky, historic, wears through beautifully at the edges.' },
    { id: 'ebon', name: 'Ebonizing (iron + vinegar)', tint: [34, 30, 32], str: .78, gloss: .1, pop: .8, dry: 'Minutes to react', dur: 1, food: 'Seal afterwards', note: 'Reacts with tannins: oak goes jet black, maple barely notices. Rust soup chemistry!' }
  ];
  WC.STAINS = [
    { id: 'none', name: 'No stain', c: null },
    { id: 'golden', name: 'Golden oak', c: [176, 112, 40] },
    { id: 'early', name: 'Early American', c: [110, 64, 30] },
    { id: 'jacobean', name: 'Jacobean', c: [56, 34, 20] },
    { id: 'redmah', name: 'Red mahogany', c: [128, 40, 26] },
    { id: 'drift', name: 'Grey driftwood', c: [140, 136, 128] },
    { id: 'indigo', name: 'Indigo dye', c: [44, 62, 110] }
  ];

  WC.JOKES = [
    'Wood you like to see more?',
    'We\u2019d tell you a joke about plywood, but it\u2019s layered.',
    'I\u2019m board. Plane and simple.',
    'Our sawdust is 100% ethically sourced from very surprised planks.',
    'Measure twice, cut once, apologise to the offcut forever.',
    'This website has no splinters. We sanded it to 400 grit.',
    'Knock knock. Who\u2019s there? Oak. Oak who? Oak-ay, that was bad.',
    'A woodworker\u2019s favourite song? \u201cSaw-ry Seems to Be the Hardest Word.\u201d',
    'MDF walked into a bar. Nobody noticed — it had no character.',
    'Our joints are tight. Our puns are loose.',
    'Termites hate this site. It\u2019s all bytes, no bites.',
    'Every knot tells a story. Mostly: \u201cthere used to be a branch here.\u201d',
    'Pine-apple: a woodworker\u2019s fruit salad.',
    'Don\u2019t take life too seriously — nobody gets out of the workshop without a splinter.'
  ];
})();
