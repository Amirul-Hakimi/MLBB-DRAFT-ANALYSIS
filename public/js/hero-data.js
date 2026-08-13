// =========================================================================
// MLBB HERO DATASET
// Meta Snapshot Date: Current Patch Baseline
// Lanes: EXP | Jungle | Mid | Gold | Roam
// Weights: 1 (Lowest Priority) to 10 (Highest Permaban / First Pick Priority)
// =========================================================================

const HERO_DATASET = [
    // --- ASSASSINS ---
    { id: "fanny", name: "Fanny", lanes: ["Jungle"], banWeight: 9, pickWeight: 8 },
    { id: "ling", name: "Ling", lanes: ["Jungle"], banWeight: 8, pickWeight: 8 },
    { id: "joy", name: "Joy", lanes: ["EXP", "Jungle"], banWeight: 8, pickWeight: 7 },
    { id: "hayabusa", name: "Hayabusa", lanes: ["Jungle"], banWeight: 7, pickWeight: 7 },
    { id: "nolan", name: "Nolan", lanes: ["Jungle"], banWeight: 8, pickWeight: 8 },

    // --- FIGHTERS ---
    { id: "chou", name: "Chou", lanes: ["EXP", "Roam"], banWeight: 4, pickWeight: 7 },
    { id: "terizla", name: "Terizla", lanes: ["EXP"], banWeight: 6, pickWeight: 9 },
    { id: "paquito", name: "Paquito", lanes: ["EXP", "Jungle"], banWeight: 5, pickWeight: 8 },
    { id: "arlott", name: "Arlott", lanes: ["EXP", "Roam"], banWeight: 7, pickWeight: 8 },
    { id: "ruby", name: "Ruby", lanes: ["EXP", "Roam"], banWeight: 5, pickWeight: 8 },

    // --- TANKS & SUPPORTS ---
    { id: "tigreal", name: "Tigreal", lanes: ["Roam"], banWeight: 8, pickWeight: 7 },
    { id: "diggie", name: "Diggie", lanes: ["Roam"], banWeight: 9, pickWeight: 7 },
    { id: "mathilda", name: "Mathilda", lanes: ["Roam", "Mid"], banWeight: 9, pickWeight: 8 },
    { id: "minotaur", name: "Minotaur", lanes: ["Roam"], banWeight: 7, pickWeight: 8 },
    { id: "angela", name: "Angela", lanes: ["Roam"], banWeight: 6, pickWeight: 7 },
    { id: "fredrinn", name: "Fredrinn", lanes: ["Jungle", "EXP"], banWeight: 6, pickWeight: 8 },

    // --- MAGES ---
    { id: "pharsa", name: "Pharsa", lanes: ["Mid"], banWeight: 5, pickWeight: 8 },
    { id: "valentina", name: "Valentina", lanes: ["Mid"], banWeight: 8, pickWeight: 8 },
    { id: "novaria", name: "Novaria", lanes: ["Mid"], banWeight: 7, pickWeight: 7 },
    { id: "yve", name: "Yve", lanes: ["Mid"], banWeight: 5, pickWeight: 7 },
    { id: "xavier", name: "Xavier", lanes: ["Mid"], banWeight: 4, pickWeight: 8 },

    // --- MARKSMEN ---
    { id: "beatrix", name: "Beatrix", lanes: ["Gold"], banWeight: 4, pickWeight: 8 },
    { id: "wanwan", name: "Wanwan", lanes: ["Gold"], banWeight: 8, pickWeight: 7 },
    { id: "claude", name: "Claude", lanes: ["Gold"], banWeight: 6, pickWeight: 8 },
    { id: "karrie", name: "Karrie", lanes: ["Gold"], banWeight: 6, pickWeight: 8 },
    { id: "brody", name: "Brody", lanes: ["Gold"], banWeight: 5, pickWeight: 7 }
];

// Helper Function: Retrieve hero object by ID
function getHeroById(id) {
    return HERO_DATASET.find(hero => hero.id === id);
}

// Helper Function: Filter heroes by lane tag
function getHeroesByLane(laneName) {
    if (!laneName || laneName === "ALL") return HERO_DATASET;
    return HERO_DATASET.filter(hero => hero.lanes.includes(laneName));
}