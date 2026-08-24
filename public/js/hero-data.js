/**
 * MLBB HERO DATASET (133 HEROES)
 * 
 * Sorted in alphabetical ascending order (A-Z) with:
 * - Editable per-lane pick rates & ban rates
 * - Official Fandom class roles (Tank, Fighter, Assassin, Mage, Marksman, Support)
 * - Local static asset image paths
 */

const RAW_HERO_DATASET = [
    // ==========================================
    // A
    // ==========================================
    { id: "aamon", name: "Aamon", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.30 } }, banRate: 0.10, winRate: 50.84, powerSpike: "Mid", image: "/assets/heroes/aamon.png" },
    { id: "akai", name: "Akai", heroClass: ["Tank"], roles: { Jungle: { pickRate: 0.45 }, Roam: { pickRate: 0.20 } }, banRate: 10.00, winRate: 49.10, powerSpike: "Mid", image: "/assets/heroes/akai.png" },
    { id: "aldous", name: "Aldous", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.05 } }, banRate: 0.01, winRate: 48.90, powerSpike: "Late", image: "/assets/heroes/aldous.png" },
    { id: "alice", name: "Alice", heroClass: ["Mage", "Tank"], roles: { Mid: { pickRate: 0.10 }, EXP: { pickRate: 0.45 } }, banRate: 2.96, winRate: 50.63, powerSpike: "Late", image: "/assets/heroes/alice.png" },
    { id: "alpha", name: "Alpha", heroClass: ["Fighter"], roles: { Jungle: { pickRate: 0.25 }, EXP: { pickRate: 0.16 } }, banRate: 0.05, winRate: 44.20, powerSpike: "Early", image: "/assets/heroes/alpha.png" },
    { id: "alucard", name: "Alucard", heroClass: ["Fighter", "Assassin"], roles: { Jungle: { pickRate: 0.01 }, EXP: { pickRate: 0.01 } }, banRate: 0.01, winRate: 49.43, powerSpike: "Mid", image: "/assets/heroes/alucard.png" },
    { id: "angela", name: "Angela", heroClass: ["Support"], roles: { Roam: { pickRate: 0.50 } }, banRate: 5.00, winRate: 48.27, powerSpike: "Mid", image: "/assets/heroes/angela.png" },
    { id: "argus", name: "Argus", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.10 } }, banRate: 0.05, winRate: 52.82, powerSpike: "Late", image: "/assets/heroes/argus.png" },
    { id: "arlott", name: "Arlott", heroClass: ["Fighter", "Assassin"], roles: { EXP: { pickRate: 0.43 }, Roam: { pickRate: 0.20 } }, banRate: 0.30, winRate: 49.23, powerSpike: "Early", image: "/assets/heroes/arlott.png" },
    { id: "atlas", name: "Atlas", heroClass: ["Tank", "Support"], roles: { Roam: { pickRate: 1.44 } }, banRate: 38.90, winRate: 52.78, powerSpike: "Mid", image: "/assets/heroes/atlas.png" },
    { id: "aulus", name: "Aulus", heroClass: ["Fighter"], roles: { Jungle: { pickRate: 0.22 } }, banRate: 0.05, winRate: 50.42, powerSpike: "Late", image: "/assets/heroes/aulus.png" },
    { id: "aurora", name: "Aurora", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.30 } }, banRate: 0.05, winRate: 48.13, powerSpike: "Mid", image: "/assets/heroes/aurora.png" },

    // ==========================================
    // B
    // ==========================================
    { id: "badang", name: "Badang", heroClass: ["Fighter"], roles: { EXP: { pickRate: 1.00 }, Roam: { pickRate: 0.50 } }, banRate: 1.97, winRate: 50.28, powerSpike: "Mid", image: "/assets/heroes/badang.png" },
    { id: "balmond", name: "Balmond", heroClass: ["Fighter"], roles: { Jungle: { pickRate: 0.15 }, EXP: { pickRate: 0.10 } }, banRate: 0.05, winRate: 46.57, powerSpike: "Early", image: "/assets/heroes/balmond.png" },
    { id: "bane", name: "Bane", heroClass: ["Fighter", "Mage"], roles: { EXP: { pickRate: 0.10 }, Jungle: { pickRate: 0.10 } }, banRate: 0.05, winRate: 50.97, powerSpike: "Mid", image: "/assets/heroes/bane.png" },
    { id: "barats", name: "Barats", heroClass: ["Tank", "Fighter"], roles: { Jungle: { pickRate: 0.50 }, EXP: { pickRate: 0.30 } }, banRate: 2.86, winRate: 52.73, powerSpike: "Mid", image: "/assets/heroes/barats.png" },
    { id: "baxia", name: "Baxia", heroClass: ["Tank"], roles: { Jungle: { pickRate: 0.10 }, Roam: { pickRate: 0.04 } }, banRate: 0.05, winRate: 46.27, powerSpike: "Mid", image: "/assets/heroes/baxia.png" },
    { id: "beatrix", name: "Beatrix", heroClass: ["Marksman"], roles: { Gold: { pickRate: 1.00 } }, banRate: 0.8, winRate: 50.58, powerSpike: "All", image: "/assets/heroes/beatrix.png" },
    { id: "belerick", name: "Belerick", heroClass: ["Tank"], roles: { EXP: { pickRate: 0.10 }, Roam: { pickRate: 0.98 } }, banRate: 68.24, winRate: 51.50, powerSpike: "Late", image: "/assets/heroes/belerick.png" },
    { id: "benedetta", name: "Benedetta", heroClass: ["Assassin"], roles: { EXP: { pickRate: 0.36 }, Jungle: { pickRate: 0.20 } }, banRate: 0.30, winRate: 51.71, powerSpike: "Mid", image: "/assets/heroes/benedetta.png" },
    { id: "brody", name: "Brody", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.70 } }, banRate: 0.10, winRate: 48.80, powerSpike: "Early", image: "/assets/heroes/brody.png" },
    { id: "bruno", name: "Bruno", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.23 } }, banRate: 0.06, winRate: 49.17, powerSpike: "Late", image: "/assets/heroes/bruno.png" },

    // ==========================================
    // C
    // ==========================================
    { id: "carmilla", name: "Carmilla", heroClass: ["Support", "Tank"], roles: { Roam: { pickRate: 0.50 } }, banRate: 0.30, winRate: 50.13, powerSpike: "Mid", image: "/assets/heroes/carmilla.png" },
    { id: "cecilion", name: "Cecilion", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.40 } }, banRate: 0.01, winRate: 49.85, powerSpike: "Late", image: "/assets/heroes/cecilion.png" },
    { id: "change", name: "Chang'e", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.35 } }, banRate: 0.01, winRate: 45.87, powerSpike: "Mid", image: "/assets/heroes/chang'e.png" },
    { id: "chip", name: "Chip", heroClass: ["Tank", "Support"], roles: { Roam: { pickRate: 0.25 } }, banRate: 0.60, winRate: 50.29, powerSpike: "Early", image: "/assets/heroes/chip.png" },
    { id: "chou", name: "Chou", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.10 }, Roam: { pickRate: 0.40 } }, banRate: 1.00, winRate: 45.87, powerSpike: "All", image: "/assets/heroes/chou.png" },
    { id: "cici", name: "Cici", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.24 } }, banRate: 0.10, winRate: 45.76, powerSpike: "Mid", image: "/assets/heroes/cici.png" },
    { id: "claude", name: "Claude", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.80 } }, banRate: 0.15, winRate: 47.45, powerSpike: "Late", image: "/assets/heroes/claude.png" },
    { id: "clint", name: "Clint", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.85 } }, banRate: 0.20, winRate: 48.67, powerSpike: "Mid", image: "/assets/heroes/clint.png" },
    { id: "cyclops", name: "Cyclops", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.15 }, Jungle: { pickRate: 0.05 } }, banRate: 0.05, winRate: 50.30, powerSpike: "Mid", image: "/assets/heroes/cyclops.png" },

    // ==========================================
    // D
    // ==========================================
    { id: "diggie", name: "Diggie", heroClass: ["Support"], roles: { Roam: { pickRate: 0.33 } }, banRate: 1.00, winRate: 53.98, powerSpike: "Early", image: "/assets/heroes/diggie.png" },
    { id: "dyrroth", name: "Dyrroth", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.20 }, Jungle: { pickRate: 0.10 } }, banRate: 0.20, winRate: 52.09, powerSpike: "Early", image: "/assets/heroes/dyrroth.png" },

    // ==========================================
    // E
    // ==========================================
    { id: "edith", name: "Edith", heroClass: ["Tank", "Marksman"], roles: { EXP: { pickRate: 0.11 }, Roam: { pickRate: 0.08 } }, banRate: 0.01, winRate: 49.84, powerSpike: "Mid", image: "/assets/heroes/edith.png" },
    { id: "esmeralda", name: "Esmeralda", heroClass: ["Mage", "Tank"], roles: { EXP: { pickRate: 0.70 }, Mid: { pickRate: 0.10 } }, banRate: 2.00, winRate: 48.79, powerSpike: "Mid", image: "/assets/heroes/esmeralda.png" },
    { id: "estes", name: "Estes", heroClass: ["Support"], roles: { Roam: { pickRate: 0.56 } }, banRate: 10.00, winRate: 51.88, powerSpike: "Mid", image: "/assets/heroes/estes.png" },
    { id: "eudora", name: "Eudora", heroClass: ["Mage"], roles: { Mid: { pickRate: 2.37 } }, banRate: 40.71, winRate: 53.47, powerSpike: "Early", image: "/assets/heroes/eudora.png" },

    // ==========================================
    // F
    // ==========================================
    { id: "fanny", name: "Fanny", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.74 } }, banRate: 2.21, winRate: 42.47, powerSpike: "Early", image: "/assets/heroes/fanny.png" },
    { id: "faramis", name: "Faramis", heroClass: ["Support", "Mage"], roles: { Mid: { pickRate: 0.10 }, Roam: { pickRate: 0.01 } }, banRate: 0.20, winRate: 51.08, powerSpike: "Mid", image: "/assets/heroes/faramis.png" },
    { id: "floryn", name: "Floryn", heroClass: ["Support"], roles: { Roam: { pickRate: 1.60 } }, banRate: 15.00, winRate: 53.68, powerSpike: "Mid", image: "/assets/heroes/floryn.png" },
    { id: "franco", name: "Franco", heroClass: ["Tank", "Support"], roles: { Roam: { pickRate: 0.05 } }, banRate: 0.02, winRate: 41.99, powerSpike: "Early", image: "/assets/heroes/franco.png" },
    { id: "fredrinn", name: "Fredrinn", heroClass: ["Tank", "Fighter"], roles: { Jungle: { pickRate: 0.55 }, EXP: { pickRate: 0.10 } }, banRate: 5.00, winRate: 51.83, powerSpike: "Mid", image: "/assets/heroes/fredrinn.png" },
    { id: "freya", name: "Freya", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.35 }, Jungle: { pickRate: 0.15 } }, banRate: 1.56, winRate: 50.06, powerSpike: "Early", image: "/assets/heroes/freya.png" },

    // ==========================================
    // G
    // ==========================================
    { id: "gatotkaca", name: "Gatotkaca", heroClass: ["Tank", "Fighter"], roles: { EXP: { pickRate: 0.15 }, Roam: { pickRate: 0.40 } }, banRate: 0.05, winRate: 44.45, powerSpike: "Mid", image: "/assets/heroes/gatotkaca.png" },
    { id: "gloo", name: "Gloo", heroClass: ["Tank"], roles: { EXP: { pickRate: 0.60 }, Roam: { pickRate: 0.29 } }, banRate: 57.03, winRate: 52.92, powerSpike: "Mid", image: "/assets/heroes/gloo.png" },
    { id: "gord", name: "Gord", heroClass: ["Mage"], roles: { Mid: { pickRate: 1.00 } }, banRate: 0.20, winRate: 53.89, powerSpike: "Mid", image: "/assets/heroes/gord.png" },
    { id: "granger", name: "Granger", heroClass: ["Marksman", "Assassin"], roles: { Jungle: { pickRate: 0.05 }, Gold: { pickRate: 0.46 } }, banRate: 0.20, winRate: 43.94, powerSpike: "Early", image: "/assets/heroes/granger.png" },
    { id: "grock", name: "Grock", heroClass: ["Tank", "Fighter"], roles: { Roam: { pickRate: 0.15 } }, banRate: 0.20, winRate: 46.87, powerSpike: "Early", image: "/assets/heroes/grock.png" },
    { id: "guinevere", name: "Guinevere", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.80 }, Jungle: { pickRate: 0.61 }, Roam: { pickRate: 0.30 } }, banRate: 26.54, winRate: 51.05, powerSpike: "Early", image: "/assets/heroes/guinevere.png" },
    { id: "gusion", name: "Gusion", heroClass: ["Assassin", "Mage"], roles: { Jungle: { pickRate: 0.50 }, Mid: { pickRate: 0.05 } }, banRate: 2.00, winRate: 49.10, powerSpike: "Early", image: "/assets/heroes/gusion.png" },

    // ==========================================
    // H
    // ==========================================
    { id: "hanabi", name: "Hanabi", heroClass: ["Marksman"], roles: { Gold: { pickRate: 1.50 } }, banRate: 2.00, winRate: 51.31, powerSpike: "Late", image: "/assets/heroes/hanabi.png" },
    { id: "hanzo", name: "Hanzo", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.50 } }, banRate: 4.00, winRate: 53.51, powerSpike: "Mid", image: "/assets/heroes/hanzo.png" },
    { id: "harith", name: "Harith", heroClass: ["Mage"], roles: { Gold: { pickRate: 0.42 } }, banRate: 0.30, winRate: 47.82, powerSpike: "Mid", image: "/assets/heroes/harith.png" },
    { id: "harley", name: "Harley", heroClass: ["Mage", "Assassin"], roles: { Jungle: { pickRate: 0.50 }, Mid: { pickRate: 0.10 } }, banRate: 4.00, winRate: 47.56, powerSpike: "Early", image: "/assets/heroes/harley.png" },
    { id: "hayabusa", name: "Hayabusa", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.40 } }, banRate: 0.20, winRate: 47.49, powerSpike: "Mid", image: "/assets/heroes/hayabusa.png" },
    { id: "helcurt", name: "Helcurt", heroClass: ["Assassin"], roles: { Roam: { pickRate: 0.20 }, Jungle: { pickRate: 0.10 } }, banRate: 15.00, winRate: 47.54, powerSpike: "Early", image: "/assets/heroes/helcurt.png" },
    { id: "hilda", name: "Hilda", heroClass: ["Fighter", "Tank"], roles: { Roam: { pickRate: 0.20 }, EXP: { pickRate: 0.10 } }, banRate: 1.00, winRate: 48.69, powerSpike: "Early", image: "/assets/heroes/hilda.png" },
    { id: "hirara", name: "Hirara", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.81 } }, banRate: 70.00, winRate: 52.83, powerSpike: "Mid", image: "/assets/heroes/hirara.png" },
    { id: "hylos", name: "Hylos", heroClass: ["Tank"], roles: { Roam: { pickRate: 0.20 } }, banRate: 0.03, winRate: 46.00, powerSpike: "Early", image: "/assets/heroes/hylos.png" },

    // ==========================================
    // I
    // ==========================================
    { id: "irithel", name: "Irithel", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.58 } }, banRate: 0.10, winRate: 51.74, powerSpike: "Late", image: "/assets/heroes/irithel.png" },
    { id: "ixia", name: "Ixia", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.47 } }, banRate: 0.05, winRate: 48.68, powerSpike: "Late", image: "/assets/heroes/ixia.png" },

    // ==========================================
    // J
    // ==========================================
    { id: "jawhead", name: "Jawhead", heroClass: ["Fighter"], roles: { Roam: { pickRate: 0.05 }, EXP: { pickRate: 0.05 } }, banRate: 0.02, winRate: 47.52, powerSpike: "Early", image: "/assets/heroes/jawhead.png" },
    { id: "johnson", name: "Johnson", heroClass: ["Tank", "Support"], roles: { Roam: { pickRate: 0.10 } }, banRate: 0.02, winRate: 47.39, powerSpike: "Mid", image: "/assets/heroes/johnson.png" },
    { id: "joy", name: "Joy", heroClass: ["Assassin", "Mage"], roles: { EXP: { pickRate: 0.05 }, Jungle: { pickRate: 0.25 } }, banRate: 0.22, winRate: 48.57, powerSpike: "Mid", image: "/assets/heroes/joy.png" },
    { id: "julian", name: "Julian", heroClass: ["Mage", "Fighter"], roles: { Jungle: { pickRate: 0.36 }, Mid: { pickRate: 0.10 }, EXP: { pickRate: 0.05 } }, banRate: 0.49, winRate: 49.22, powerSpike: "Early", image: "/assets/heroes/julian.png" },

    // ==========================================
    // K
    // ==========================================
    { id: "kadita", name: "Kadita", heroClass: ["Mage", "Assassin"], roles: { Mid: { pickRate: 0.30 }, Roam: { pickRate: 0.05 } }, banRate: 3.00, winRate: 51.65, powerSpike: "Early", image: "/assets/heroes/kadita.png" },
    { id: "kaja", name: "Kaja", heroClass: ["Support", "Fighter"], roles: { Roam: { pickRate: 0.40 } }, banRate: 45.06, winRate: 47.00, powerSpike: "Mid", image: "/assets/heroes/kaja.png" },
    { id: "kalea", name: "Kalea", heroClass: ["Support"], roles: { Roam: { pickRate: 0.11 } }, banRate: 0.10, winRate: 42.57, powerSpike: "Mid", image: "/assets/heroes/kalea.png" },
    { id: "kagura", name: "Kagura", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.35 } }, banRate: 0.05, winRate: 50.59, powerSpike: "Mid", image: "/assets/heroes/kagura.png" },
    { id: "karina", name: "Karina", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.10 } }, banRate: 0.05, winRate: 45.13, powerSpike: "Mid", image: "/assets/heroes/karina.png" },
    { id: "karrie", name: "Karrie", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.35 } }, banRate: 1.00, winRate: 48.00, powerSpike: "Mid", image: "/assets/heroes/karrie.png" },
    { id: "khaleed", name: "Khaleed", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.24 } }, banRate: 0.05, winRate: 49.53, powerSpike: "Early", image: "/assets/heroes/khaleed.png" },
    { id: "khufra", name: "Khufra", heroClass: ["Tank", "Support"], roles: { Roam: { pickRate: 0.50 } }, banRate: 3.00, winRate: 54.85, powerSpike: "Mid", image: "/assets/heroes/khufra.png" },
    { id: "kimmy", name: "Kimmy", heroClass: ["Marksman", "Mage"], roles: { Mid: { pickRate: 0.37 } }, banRate: 0.10, winRate: 47.60, powerSpike: "Mid", image: "/assets/heroes/kimmy.png" },

    // ==========================================
    // L
    // ==========================================
    { id: "lancelot", name: "Lancelot", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.20 } }, banRate: 0.05, winRate: 42.33, powerSpike: "Early", image: "/assets/heroes/lancelot.png" },
    { id: "lapu_lapu", name: "Lapu-Lapu", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.25 } }, banRate: 0.05, winRate: 47.71, powerSpike: "Mid", image: "/assets/heroes/lapu-lapu.png" },
    { id: "layla", name: "Layla", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.20 } }, banRate: 0.10, winRate: 46.14, powerSpike: "Late", image: "/assets/heroes/layla.png" },
    { id: "leomord", name: "Leomord", heroClass: ["Fighter", "Assassin"], roles: { Jungle: { pickRate: 0.59 }, EXP: { pickRate: 0.05 } }, banRate: 0.86, winRate: 50.15, powerSpike: "Mid", image: "/assets/heroes/leomord.png" },
    { id: "lesley", name: "Lesley", heroClass: ["Marksman", "Assassin"], roles: { Gold: { pickRate: 1.50 } }, banRate: 9.93, winRate: 47.54, powerSpike: "Late", image: "/assets/heroes/lesley.png" },
    { id: "ling", name: "Ling", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 1.67 } }, banRate: 10.26, winRate: 51.73, powerSpike: "Late", image: "/assets/heroes/ling.png" },
    { id: "lolita", name: "Lolita", heroClass: ["Support", "Tank"], roles: { Roam: { pickRate: 0.10 } }, banRate: 0.05, winRate: 53.20, powerSpike: "Mid", image: "/assets/heroes/lolita.png" },
    { id: "lukas", name: "Lukas", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.20 }, Jungle: { pickRate: 0.30 } }, banRate: 1.00, winRate: 54.29, powerSpike: "Mid", image: "/assets/heroes/lukas.png" },
    { id: "lunox", name: "Lunox", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.30 }, Jungle: { pickRate: 0.01 } }, banRate: 0.10, winRate: 48.39, powerSpike: "Late", image: "/assets/heroes/lunox.png" },
    { id: "luo_yi", name: "Luo Yi", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.20 } }, banRate: 0.04, winRate: 45.99, powerSpike: "Early", image: "/assets/heroes/luo-yi.png" },
    { id: "lylia", name: "Lylia", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.20 } }, banRate: 0.05, winRate: 47.36, powerSpike: "Early", image: "/assets/heroes/lylia.png" },

    // ==========================================
    // M
    // ==========================================
    { id: "marcel", name: "Marcel", heroClass: ["Tank", "Support"], roles: { Roam: { pickRate: 0.42 } }, banRate: 62.21, winRate: 58.83, powerSpike: "Mid", image: "/assets/heroes/marcel.png" },
    { id: "martis", name: "Martis", heroClass: ["Fighter"], roles: { Jungle: { pickRate: 0.10 }, EXP: { pickRate: 0.10 } }, banRate: 0.05, winRate: 47.67, powerSpike: "Early", image: "/assets/heroes/martis.png" },
    { id: "masha", name: "Masha", heroClass: ["Fighter", "Tank"], roles: { EXP: { pickRate: 0.10 } }, banRate: 0.05, winRate: 58.26, powerSpike: "Late", image: "/assets/heroes/masha.png" },
    { id: "mathilda", name: "Mathilda", heroClass: ["Support", "Assassin"], roles: { Roam: { pickRate: 0.30 }, Mid: { pickRate: 0.05 } }, banRate: 0.20, winRate: 44.91, powerSpike: "Early", image: "/assets/heroes/mathilda.png" },
    { id: "melissa", name: "Melissa", heroClass: ["Marksman"], roles: { Gold: { pickRate: 1.56 } }, banRate: 6.69, winRate: 58.17, powerSpike: "Late", image: "/assets/heroes/melissa.png" },
    { id: "minotaur", name: "Minotaur", heroClass: ["Tank", "Support"], roles: { Roam: { pickRate: 0.80 } }, banRate: 5.00, winRate: 54.01, powerSpike: "Mid", image: "/assets/heroes/minotaur.png" },
    { id: "minsitthar", name: "Minsitthar", heroClass: ["Fighter", "Support"], roles: { EXP: { pickRate: 0.30 }, Roam: { pickRate: 0.30 } }, banRate: 10.00, winRate: 50.76, powerSpike: "Mid", image: "/assets/heroes/minsitthar.png" },
    { id: "miya", name: "Miya", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.70 } }, banRate: 1.00, winRate: 54.54, powerSpike: "Late", image: "/assets/heroes/miya.png" },
    { id: "moskov", name: "Moskov", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.60 } }, banRate: 0.10, winRate: 50.34, powerSpike: "Late", image: "/assets/heroes/moskov.png" },

    // ==========================================
    // N
    // ==========================================
    { id: "nana", name: "Nana", heroClass: ["Mage", "Support"], roles: { Mid: { pickRate: 0.30 } }, banRate: 0.20, winRate: 45.14, powerSpike: "Mid", image: "/assets/heroes/nana.png" },
    { id: "natan", name: "Natan", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.25 } }, banRate: 0.05, winRate: 49.98, powerSpike: "Late", image: "/assets/heroes/natan.png" },
    { id: "natalia", name: "Natalia", heroClass: ["Assassin"], roles: { Roam: { pickRate: 0.10 }, Jungle: { pickRate: 0.10 } }, banRate: 1.00, winRate: 50.54, powerSpike: "Early", image: "/assets/heroes/natalia.png" },
    { id: "nolan", name: "Nolan", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.50 } }, banRate: 0.80, winRate: 48.92, powerSpike: "Early", image: "/assets/heroes/nolan.png" },
    { id: "novaria", name: "Novaria", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.30 } }, banRate: 0.10, winRate: 47.50, powerSpike: "Late", image: "/assets/heroes/novaria.png" },

    // ==========================================
    // O
    // ==========================================
    { id: "obsidia", name: "Obsidia", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.50 } }, banRate: 0.46, winRate: 48.79, powerSpike: "Mid", image: "/assets/heroes/obsidia.png" },
    { id: "odette", name: "Odette", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.30 } }, banRate: 0.05, winRate: 51.62, powerSpike: "Mid", image: "/assets/heroes/odette.png" },

    // ==========================================
    // P
    // ==========================================
    { id: "paquito", name: "Paquito", heroClass: ["Fighter", "Assassin"], roles: { EXP: { pickRate: 1.20 }, Jungle: { pickRate: 0.73 } }, banRate: 67.91, winRate: 50.51, powerSpike: "Mid", image: "/assets/heroes/paquito.png" },
    { id: "pharsa", name: "Pharsa", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.40 } }, banRate: 0.06, winRate: 46.84, powerSpike: "Mid", image: "/assets/heroes/pharsa.png" },
    { id: "phoveus", name: "Phoveus", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.30 } }, banRate: 0.50, winRate: 48.85, powerSpike: "Mid", image: "/assets/heroes/phoveus.png" },
    { id: "popol_and_kupa", name: "Popol and Kupa", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.10 }, Jungle: { pickRate: 0.05 } }, banRate: 0.02, winRate: 50.99, powerSpike: "Early", image: "/assets/heroes/popol-and-kupa.png" },

    // ==========================================
    // R
    // ==========================================
    { id: "rafaela", name: "Rafaela", heroClass: ["Support"], roles: { Roam: { pickRate: 0.90 } }, banRate: 3.00, winRate: 57.82, powerSpike: "Early", image: "/assets/heroes/rafaela.png" },
    { id: "roger", name: "Roger", heroClass: ["Fighter", "Marksman"], roles: { Jungle: { pickRate: 0.19 }, Gold: { pickRate: 0.05 } }, banRate: 0.03, winRate: 46.00, powerSpike: "Mid", image: "/assets/heroes/roger.png" },
    { id: "ruby", name: "Ruby", heroClass: ["Fighter", "Tank"], roles: { EXP: { pickRate: 0.31 }, Roam: { pickRate: 0.10 } }, banRate: 0.05, winRate: 49.12, powerSpike: "Mid", image: "/assets/heroes/ruby.png" },

    // ==========================================
    // S
    // ==========================================
    { id: "saber", name: "Saber", heroClass: ["Assassin"], roles: { Jungle: { pickRate: 0.20 }, Roam: { pickRate: 0.10 } }, banRate: 10.00, winRate: 51.65, powerSpike: "Early", image: "/assets/heroes/saber.png" },
    { id: "selena", name: "Selena", heroClass: ["Assassin", "Mage"], roles: { Roam: { pickRate: 0.03 }, Mid: { pickRate: 0.20 } }, banRate: 1.00, winRate: 47.13, powerSpike: "Early", image: "/assets/heroes/selena.png" },
    { id: "silvanna", name: "Silvanna", heroClass: ["Fighter", "Mage"], roles: { EXP: { pickRate: 0.30 }, Roam: { pickRate: 0.05 } }, banRate: 0.10, winRate: 50.30, powerSpike: "Early", image: "/assets/heroes/silvanna.png" },
    { id: "sora", name: "Sora", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.94 } }, banRate: 7.46, winRate: 49.78, powerSpike: "Mid", image: "/assets/heroes/sora.png" },
    { id: "sun", name: "Sun", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.50 }, Jungle: { pickRate: 0.30 } }, banRate: 40.25, winRate: 50.69, powerSpike: "Late", image: "/assets/heroes/sun.png" },
    { id: "suyou", name: "Suyou", heroClass: ["Assassin", "Fighter"], roles: { Jungle: { pickRate: 0.60 }, EXP: { pickRate: 0.02 } }, banRate: 2.14, winRate: 48.38, powerSpike: "Mid", image: "/assets/heroes/suyou.png" },

    // ==========================================
    // T
    // ==========================================
    { id: "terizla", name: "Terizla", heroClass: ["Fighter", "Tank"], roles: { EXP: { pickRate: 0.30 } }, banRate: 0.05, winRate: 49.91, powerSpike: "Early", image: "/assets/heroes/terizla.png" },
    { id: "thamuz", name: "Thamuz", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.20 } }, banRate: 0.05, winRate: 49.44, powerSpike: "Early", image: "/assets/heroes/thamuz.png" },
    { id: "tigreal", name: "Tigreal", heroClass: ["Tank", "Support"], roles: { Roam: { pickRate: 0.30 } }, banRate: 0.80, winRate: 44.45, powerSpike: "Mid", image: "/assets/heroes/tigreal.png" },

    // ==========================================
    // U
    // ==========================================
    { id: "uranus", name: "Uranus", heroClass: ["Tank"], roles: { EXP: { pickRate: 0.30 } }, banRate: 0.38, winRate: 50.05, powerSpike: "Mid", image: "/assets/heroes/uranus.png" },

    // ==========================================
    // V
    // ==========================================
    { id: "vale", name: "Vale", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.30 } }, banRate: 0.01, winRate: 48.92, powerSpike: "Mid", image: "/assets/heroes/vale.png" },
    { id: "valentina", name: "Valentina", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.29 } }, banRate: 0.10, winRate: 45.34, powerSpike: "Mid", image: "/assets/heroes/valentina.png" },
    { id: "valir", name: "Valir", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.40 }, Roam: { pickRate: 0.05 } }, banRate: 1.44, winRate: 51.72, powerSpike: "Early", image: "/assets/heroes/valir.png" },
    { id: "vexana", name: "Vexana", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.40 } }, banRate: 0.10, winRate: 49.11, powerSpike: "Mid", image: "/assets/heroes/vexana.png" },

    // ==========================================
    // W
    // ==========================================
    { id: "wanwan", name: "Wanwan", heroClass: ["Marksman"], roles: { Gold: { pickRate: 0.05 } }, banRate: 0.01, winRate: 46.71, powerSpike: "Late", image: "/assets/heroes/wanwan.png" },

    // ==========================================
    // X
    // ==========================================
    { id: "x_borg", name: "X.Borg", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.10 }, Jungle: { pickRate: 0.25 } }, banRate: 0.30, winRate: 48.28, powerSpike: "Mid", image: "/assets/heroes/x-borg.png" },
    { id: "xavier", name: "Xavier", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.40 } }, banRate: 0.03, winRate: 48.44, powerSpike: "Late", image: "/assets/heroes/xavier.png" },

    // ==========================================
    // Y
    // ==========================================
    { id: "yi_sun_shin", name: "Yi Sun-shin", heroClass: ["Assassin", "Marksman"], roles: { Jungle: { pickRate: 2.00 } }, banRate: 15.00, winRate: 51.71, powerSpike: "Late", image: "/assets/heroes/yi-sun-shin.png" },
    { id: "yin", name: "Yin", heroClass: ["Fighter", "Assassin"], roles: { EXP: { pickRate: 0.02 }, Jungle: { pickRate: 0.02 } }, banRate: 0.01, winRate: 48.96, powerSpike: "Mid", image: "/assets/heroes/yin.png" },
    { id: "yu_zhong", name: "Yu Zhong", heroClass: ["Fighter"], roles: { EXP: { pickRate: 0.70 } }, banRate: 0.30, winRate: 49.45, powerSpike: "Early", image: "/assets/heroes/yu-zhong.png" },
    { id: "yve", name: "Yve", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.32 } }, banRate: 0.04, winRate: 50.93, powerSpike: "Mid", image: "/assets/heroes/yve.png" },

    // ==========================================
    // Z
    // ==========================================
    { id: "zetian", name: "Zetian", heroClass: ["Mage"], roles: { Mid: { pickRate: 2.11 } }, banRate: 9.04, winRate: 50.13, powerSpike: "Mid", image: "/assets/heroes/zetian.png" },
    { id: "zhask", name: "Zhask", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.05 } }, banRate: 0.01, winRate: 50.72, powerSpike: "Mid", image: "/assets/heroes/zhask.png" },
    { id: "zhuxin", name: "Zhuxin", heroClass: ["Mage"], roles: { Mid: { pickRate: 0.40 } }, banRate: 2.00, winRate: 47.42, powerSpike: "Mid", image: "/assets/heroes/zhuxin.png" },
    { id: "zilong", name: "Zilong", heroClass: ["Fighter", "Assassin"], roles: { EXP: { pickRate: 0.01 }, Jungle: { pickRate: 0.01 } }, banRate: 0.01, winRate: 44.52, powerSpike: "Late", image: "/assets/heroes/zilong.png" }
];

const heroMap = new Map();
RAW_HERO_DATASET.forEach(hero => {
    if (!heroMap.has(hero.id)) {
        heroMap.set(hero.id, hero);
    }
});

function getHeroLanes(hero) {
    if (!hero) return [];
    if (Array.isArray(hero.lanes) && hero.lanes.length > 0) return hero.lanes;
    if (hero.roles && typeof hero.roles === 'object') return Object.keys(hero.roles);
    return [];
}

function getHeroClasses(hero) {
    if (!hero) return [];
    if (Array.isArray(hero.heroClass) && hero.heroClass.length > 0) return hero.heroClass;
    return [];
}

function getHeroPickRate(hero, lane = null) {
    if (!hero || !hero.roles) return 0;
    if (lane && hero.roles[lane]) {
        return hero.roles[lane].pickRate || 0;
    }
    return Object.values(hero.roles).reduce((sum, roleData) => sum + (roleData.pickRate || 0), 0);
}

function getHeroBanRate(hero) {
    return (hero && hero.banRate) || 0;
}

const HERO_DATASET = Array.from(heroMap.values()).map(hero => ({
    ...hero,
    lanes: getHeroLanes(hero),
    heroClass: getHeroClasses(hero),
    image: hero.image || `/assets/heroes/${hero.id}.png`
}));

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RAW_HERO_DATASET, HERO_DATASET, getHeroLanes, getHeroClasses, getHeroPickRate, getHeroBanRate };
}