/**
 * MLBB HERO DATASET (133 HEROES)
 * 
 * Image portraits mapped to reliable global CDN endpoints.
 */

const RAW_HERO_DATASET = [
    { id: "marcel", name: "Marcel", roles: { EXP: { pickRate: 0.42 } }, banRate: 62.21, winRate: 58.83, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/marcel.png" },
    { id: "masha", name: "Masha", roles: { EXP: { pickRate: 0.21 } }, banRate: 0.85, winRate: 58.26, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/masha.png" },
    { id: "melissa", name: "Melissa", roles: { Gold: { pickRate: 1.56 } }, banRate: 6.69, winRate: 58.17, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/melissa.png" },
    { id: "rafaela", name: "Rafaela", roles: { Roam: { pickRate: 1.19 } }, banRate: 10.90, winRate: 57.82, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/rafaela.png" },
    { id: "khufra", name: "Khufra", roles: { Roam: { pickRate: 0.63 } }, banRate: 5.35, winRate: 54.85, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/khufra.png" },
    { id: "miya", name: "Miya", roles: { Gold: { pickRate: 2.49 } }, banRate: 15.84, winRate: 54.54, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/miya.png" },
    { id: "lukas", name: "Lukas", roles: { EXP: { pickRate: 0.85 } }, banRate: 8.34, winRate: 54.29, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/lukas.png" },
    { id: "minotaur", name: "Minotaur", roles: { Roam: { pickRate: 1.18 } }, banRate: 7.57, winRate: 54.01, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/minotaur.png" },
    { id: "diggie", name: "Diggie", roles: { Roam: { pickRate: 0.33 } }, banRate: 9.82, winRate: 53.98, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/diggie.png" },
    { id: "gord", name: "Gord", roles: { Mid: { pickRate: 1.54 } }, banRate: 3.80, winRate: 53.89, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/gord.png" },
    { id: "floryn", name: "Floryn", roles: { Roam: { pickRate: 1.60 } }, banRate: 30.17, winRate: 53.68, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/floryn.png" },
    { id: "hanzo", name: "Hanzo", roles: { Jungle: { pickRate: 0.65 } }, banRate: 7.83, winRate: 53.51, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/hanzo.png" },
    { id: "eudora", name: "Eudora", roles: { Mid: { pickRate: 2.37 } }, banRate: 40.71, winRate: 53.47, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/eudora.png" },
    { id: "lolita", name: "Lolita", roles: { Roam: { pickRate: 0.10 } }, banRate: 0.28, winRate: 53.20, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/lolita.png" },
    { id: "gloo", name: "Gloo", roles: { EXP: { pickRate: 0.50 }, Roam: { pickRate: 0.29 } }, banRate: 57.03, winRate: 52.92, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/gloo.png" },
    { id: "hirara", name: "Hirara", roles: { Jungle: { pickRate: 0.81 } }, banRate: 77.55, winRate: 52.83, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/hirara.png" },
    { id: "argus", name: "Argus", roles: { EXP: { pickRate: 0.25 } }, banRate: 0.19, winRate: 52.82, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/argus.png" },
    { id: "atlas", name: "Atlas", roles: { Roam: { pickRate: 1.44 } }, banRate: 38.90, winRate: 52.78, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/atlas.png" },
    { id: "barats", name: "Barats", roles: { Jungle: { pickRate: 0.50 }, EXP: { pickRate: 0.30 } }, banRate: 2.86, winRate: 52.73, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/barats.png" },
    { id: "dyrroth", name: "Dyrroth", roles: { EXP: { pickRate: 0.85 }, Jungle: { pickRate: 0.50 } }, banRate: 1.67, winRate: 52.09, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/dyrroth.png" },
    { id: "estes", name: "Estes", roles: { Roam: { pickRate: 0.56 } }, banRate: 21.14, winRate: 51.88, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/estes.png" },
    { id: "fredrinn", name: "Fredrinn", roles: { Jungle: { pickRate: 0.55 }, EXP: { pickRate: 0.30 } }, banRate: 7.19, winRate: 51.83, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/fredrinn.png" },
    { id: "irithel", name: "Irithel", roles: { Gold: { pickRate: 0.58 } }, banRate: 0.20, winRate: 51.74, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/irithel.png" },
    { id: "ling", name: "Ling", roles: { Jungle: { pickRate: 1.67 } }, banRate: 10.26, winRate: 51.73, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/ling.png" },
    { id: "valir", name: "Valir", roles: { Mid: { pickRate: 0.52 }, Roam: { pickRate: 0.30 } }, banRate: 1.44, winRate: 51.72, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/valir.png" },
    { id: "yi_sun_shin", name: "Yi Sun-shin", roles: { Jungle: { pickRate: 2.49 } }, banRate: 18.32, winRate: 51.71, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/yi-sun-shin.png" },
    { id: "benedetta", name: "Benedetta", roles: { EXP: { pickRate: 0.36 }, Jungle: { pickRate: 0.20 } }, banRate: 0.62, winRate: 51.71, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/benedetta.png" },
    { id: "kadita", name: "Kadita", roles: { Mid: { pickRate: 0.63 }, Roam: { pickRate: 0.50 } }, banRate: 5.60, winRate: 51.65, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/kadita.png" },
    { id: "saber", name: "Saber", roles: { Jungle: { pickRate: 0.45 }, Roam: { pickRate: 0.26 } }, banRate: 14.53, winRate: 51.65, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/saber.png" },
    { id: "odette", name: "Odette", roles: { Mid: { pickRate: 0.50 } }, banRate: 0.17, winRate: 51.62, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/odette.png" },
    { id: "belerick", name: "Belerick", roles: { EXP: { pickRate: 0.90 }, Roam: { pickRate: 0.58 } }, banRate: 68.24, winRate: 51.50, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/belerick.png" },
    { id: "hanabi", name: "Hanabi", roles: { Gold: { pickRate: 2.11 } }, banRate: 5.43, winRate: 51.31, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/hanabi.png" },
    { id: "faramis", name: "Faramis", roles: { Mid: { pickRate: 0.08 }, Roam: { pickRate: 0.06 } }, banRate: 0.38, winRate: 51.08, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/faramis.png" },
    { id: "guinevere", name: "Guinevere", roles: { EXP: { pickRate: 1.10 }, Jungle: { pickRate: 0.61 } }, banRate: 26.54, winRate: 51.05, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/guinevere.png" },
    { id: "popol_and_kupa", name: "Popol and Kupa", roles: { Gold: { pickRate: 0.15 }, Jungle: { pickRate: 0.07 } }, banRate: 0.09, winRate: 50.99, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/popol-and-kupa.png" },
    { id: "bane", name: "Bane", roles: { EXP: { pickRate: 0.16 }, Jungle: { pickRate: 0.10 } }, banRate: 0.09, winRate: 50.97, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/bane.png" },
    { id: "yve", name: "Yve", roles: { Mid: { pickRate: 0.12 } }, banRate: 0.04, winRate: 50.93, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/yve.png" },
    { id: "aamon", name: "Aamon", roles: { Jungle: { pickRate: 0.57 } }, banRate: 1.35, winRate: 50.84, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/aamon.png" },
    { id: "minsitthar", name: "Minsitthar", roles: { EXP: { pickRate: 0.42 }, Roam: { pickRate: 0.30 } }, banRate: 13.32, winRate: 50.76, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/minsitthar.png" },
    { id: "zhask", name: "Zhask", roles: { Mid: { pickRate: 0.30 } }, banRate: 0.14, winRate: 50.72, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/zhask.png" },
    { id: "sun", name: "Sun", roles: { EXP: { pickRate: 0.70 }, Jungle: { pickRate: 0.59 } }, banRate: 40.25, winRate: 50.69, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/sun.png" },
    { id: "alice", name: "Alice", roles: { Mid: { pickRate: 0.50 }, EXP: { pickRate: 0.34 } }, banRate: 2.96, winRate: 50.63, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/alice.png" },
    { id: "kagura", name: "Kagura", roles: { Mid: { pickRate: 0.95 } }, banRate: 0.76, winRate: 50.59, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/kagura.png" },
    { id: "beatrix", name: "Beatrix", roles: { Gold: { pickRate: 1.14 } }, banRate: 1.37, winRate: 50.58, powerSpike: "All", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/beatrix.png" },
    { id: "natalia", name: "Natalia", roles: { Roam: { pickRate: 0.16 }, Jungle: { pickRate: 0.10 } }, banRate: 1.41, winRate: 50.54, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/natalia.png" },
    { id: "paquito", name: "Paquito", roles: { EXP: { pickRate: 1.20 }, Jungle: { pickRate: 0.73 } }, banRate: 67.91, winRate: 50.51, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/paquito.png" },
    { id: "aulus", name: "Aulus", roles: { Jungle: { pickRate: 0.22 } }, banRate: 0.22, winRate: 50.42, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/aulus.png" },
    { id: "moskov", name: "Moskov", roles: { Gold: { pickRate: 1.18 } }, banRate: 0.19, winRate: 50.34, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/moskov.png" },
    { id: "silvanna", name: "Silvanna", roles: { EXP: { pickRate: 0.40 }, Roam: { pickRate: 0.24 } }, banRate: 0.76, winRate: 50.30, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/silvanna.png" },
    { id: "cyclops", name: "Cyclops", roles: { Mid: { pickRate: 0.38 }, Jungle: { pickRate: 0.20 } }, banRate: 0.13, winRate: 50.30, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/cyclops.png" },
    { id: "chip", name: "Chip", roles: { Roam: { pickRate: 0.08 } }, banRate: 0.73, winRate: 50.29, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/chip.png" },
    { id: "badang", name: "Badang", roles: { EXP: { pickRate: 1.22 } }, banRate: 1.97, winRate: 50.28, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/badang.png" },
    { id: "leomord", name: "Leomord", roles: { Jungle: { pickRate: 0.39 }, EXP: { pickRate: 0.20 } }, banRate: 0.86, winRate: 50.15, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/leomord.png" },
    { id: "carmilla", name: "Carmilla", roles: { Roam: { pickRate: 0.99 } }, banRate: 1.97, winRate: 50.13, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/carmilla.png" },
    { id: "zetian", name: "Zetian", roles: { Mid: { pickRate: 2.11 } }, banRate: 9.04, winRate: 50.13, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/zhuxin.png" },
    { id: "freya", name: "Freya", roles: { EXP: { pickRate: 0.34 }, Jungle: { pickRate: 0.20 } }, banRate: 1.56, winRate: 50.06, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/freya.png" },
    { id: "uranus", name: "Uranus", roles: { EXP: { pickRate: 0.46 } }, banRate: 0.38, winRate: 50.05, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/uranus.png" },
    { id: "natan", name: "Natan", roles: { Gold: { pickRate: 0.37 } }, banRate: 0.10, winRate: 49.98, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/natan.png" },
    { id: "terizla", name: "Terizla", roles: { EXP: { pickRate: 0.38 } }, banRate: 0.11, winRate: 49.91, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/terizla.png" },
    { id: "cecilion", name: "Cecilion", roles: { Mid: { pickRate: 0.65 } }, banRate: 0.11, winRate: 49.85, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/cecilion.png" },
    { id: "edith", name: "Edith", roles: { EXP: { pickRate: 0.11 }, Roam: { pickRate: 0.08 } }, banRate: 0.09, winRate: 49.84, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/edith.png" },
    { id: "sora", name: "Sora", roles: { EXP: { pickRate: 0.94 } }, banRate: 7.46, winRate: 49.78, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/cici.png" },
    { id: "khaleed", name: "Khaleed", roles: { EXP: { pickRate: 0.24 } }, banRate: 0.14, winRate: 49.53, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/khaleed.png" },
    { id: "yu_zhong", name: "Yu Zhong", roles: { EXP: { pickRate: 0.80 } }, banRate: 0.54, winRate: 49.45, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/yu-zhong.png" },
    { id: "thamuz", name: "Thamuz", roles: { EXP: { pickRate: 0.30 }, Jungle: { pickRate: 0.19 } }, banRate: 0.52, winRate: 49.44, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/thamuz.png" },
    { id: "alucard", name: "Alucard", roles: { Jungle: { pickRate: 0.26 }, EXP: { pickRate: 0.10 } }, banRate: 0.15, winRate: 49.43, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/alucard.png" },
    { id: "arlott", name: "Arlott", roles: { EXP: { pickRate: 0.43 }, Roam: { pickRate: 0.20 } }, banRate: 0.58, winRate: 49.23, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/arlott.png" },
    { id: "julian", name: "Julian", roles: { Jungle: { pickRate: 0.36 }, Mid: { pickRate: 0.20 }, EXP: { pickRate: 0.10 } }, banRate: 0.49, winRate: 49.22, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/julian.png" },
    { id: "bruno", name: "Bruno", roles: { Gold: { pickRate: 0.23 } }, banRate: 0.06, winRate: 49.17, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/bruno.png" },
    { id: "ruby", name: "Ruby", roles: { EXP: { pickRate: 0.31 }, Roam: { pickRate: 0.20 } }, banRate: 0.32, winRate: 49.12, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/ruby.png" },
    { id: "vexana", name: "Vexana", roles: { Mid: { pickRate: 1.29 } }, banRate: 0.53, winRate: 49.11, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/vexana.png" },
    { id: "akai", name: "Akai", roles: { Jungle: { pickRate: 0.45 }, Roam: { pickRate: 0.24 } }, banRate: 16.67, winRate: 49.10, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/akai.png" },
    { id: "gusion", name: "Gusion", roles: { Jungle: { pickRate: 0.83 }, Mid: { pickRate: 0.50 } }, banRate: 5.38, winRate: 49.10, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/gusion.png" },
    { id: "yin", name: "Yin", roles: { EXP: { pickRate: 0.16 }, Jungle: { pickRate: 0.10 } }, banRate: 0.40, winRate: 48.96, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/yin.png" },
    { id: "nolan", name: "Nolan", roles: { Jungle: { pickRate: 0.73 } }, banRate: 0.94, winRate: 48.92, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/nolan.png" },
    { id: "vale", name: "Vale", roles: { Mid: { pickRate: 0.34 } }, banRate: 0.06, winRate: 48.92, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/vale.png" },
    { id: "aldous", name: "Aldous", roles: { EXP: { pickRate: 0.14 }, Mid: { pickRate: 0.10 } }, banRate: 0.17, winRate: 48.90, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/aldous.png" },
    { id: "phoveus", name: "Phoveus", roles: { EXP: { pickRate: 0.38 } }, banRate: 0.85, winRate: 48.85, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/phoveus.png" },
    { id: "brody", name: "Brody", roles: { Gold: { pickRate: 0.88 } }, banRate: 0.45, winRate: 48.80, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/brody.png" },
    { id: "esmeralda", name: "Esmeralda", roles: { EXP: { pickRate: 0.87 }, Mid: { pickRate: 0.40 } }, banRate: 3.91, winRate: 48.79, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/esmeralda.png" },
    { id: "obsidia", name: "Obsidia", roles: { EXP: { pickRate: 0.65 } }, banRate: 0.46, winRate: 48.79, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/phoveus.png" },
    { id: "hilda", name: "Hilda", roles: { Roam: { pickRate: 0.30 }, EXP: { pickRate: 0.15 } }, banRate: 2.61, winRate: 48.69, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/hilda.png" },
    { id: "ixia", name: "Ixia", roles: { Gold: { pickRate: 0.67 } }, banRate: 0.54, winRate: 48.68, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/ixia.png" },
    { id: "clint", name: "Clint", roles: { Gold: { pickRate: 0.85 } }, banRate: 0.36, winRate: 48.67, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/clint.png" },
    { id: "joy", name: "Joy", roles: { EXP: { pickRate: 0.20 }, Jungle: { pickRate: 0.15 } }, banRate: 0.32, winRate: 48.57, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/joy.png" },
    { id: "xavier", name: "Xavier", roles: { Mid: { pickRate: 0.58 } }, banRate: 0.07, winRate: 48.44, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/xavier.png" },
    { id: "lunox", name: "Lunox", roles: { Mid: { pickRate: 0.25 }, Jungle: { pickRate: 0.14 } }, banRate: 0.10, winRate: 48.39, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/lunox.png" },
    { id: "suyou", name: "Suyou", roles: { Jungle: { pickRate: 0.70 }, EXP: { pickRate: 0.46 } }, banRate: 2.14, winRate: 48.38, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/suyou.png" },
    { id: "x_borg", name: "X.Borg", roles: { EXP: { pickRate: 0.32 }, Jungle: { pickRate: 0.20 } }, banRate: 1.25, winRate: 48.28, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/x.borg.png" },
    { id: "angela", name: "Angela", roles: { Roam: { pickRate: 1.85 } }, banRate: 11.22, winRate: 48.27, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/angela.png" },
    { id: "aurora", name: "Aurora", roles: { Mid: { pickRate: 0.35 } }, banRate: 0.10, winRate: 48.13, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/aurora.png" },
    { id: "karrie", name: "Karrie", roles: { Gold: { pickRate: 0.82 } }, banRate: 2.58, winRate: 48.00, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/karrie.png" },
    { id: "harith", name: "Harith", roles: { Gold: { pickRate: 0.22 }, Mid: { pickRate: 0.15 } }, banRate: 0.47, winRate: 47.82, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/harith.png" },
    { id: "lapu_lapu", name: "Lapu-Lapu", roles: { EXP: { pickRate: 0.59 } }, banRate: 0.26, winRate: 47.71, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/lapu-lapu.png" },
    { id: "martis", name: "Martis", roles: { Jungle: { pickRate: 0.25 }, EXP: { pickRate: 0.16 } }, banRate: 0.21, winRate: 47.67, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/martis.png" },
    { id: "kimmy", name: "Kimmy", roles: { Gold: { pickRate: 0.37 }, Jungle: { pickRate: 0.20 } }, banRate: 0.22, winRate: 47.60, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/kimmy.png" },
    { id: "harley", name: "Harley", roles: { Jungle: { pickRate: 0.50 }, Mid: { pickRate: 0.28 } }, banRate: 5.45, winRate: 47.56, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/harley.png" },
    { id: "lesley", name: "Lesley", roles: { Gold: { pickRate: 1.85 } }, banRate: 9.93, winRate: 47.54, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/lesley.png" },
    { id: "helcurt", name: "Helcurt", roles: { Roam: { pickRate: 0.35 }, Jungle: { pickRate: 0.29 } }, banRate: 19.67, winRate: 47.54, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/helcurt.png" },
    { id: "jawhead", name: "Jawhead", roles: { Roam: { pickRate: 0.15 }, EXP: { pickRate: 0.12 } }, banRate: 0.14, winRate: 47.52, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/jawhead.png" },
    { id: "novaria", name: "Novaria", roles: { Mid: { pickRate: 1.11 } }, banRate: 1.50, winRate: 47.50, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/novaria.png" },
    { id: "claude", name: "Claude", roles: { Gold: { pickRate: 1.24 } }, banRate: 0.27, winRate: 47.45, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/claude.png" },
    { id: "zhuxin", name: "Zhuxin", roles: { Mid: { pickRate: 0.34 } }, banRate: 2.72, winRate: 47.42, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/zhuxin.png" },
    { id: "johnson", name: "Johnson", roles: { Roam: { pickRate: 0.45 } }, banRate: 0.78, winRate: 47.39, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/johnson.png" },
    { id: "lylia", name: "Lylia", roles: { Mid: { pickRate: 0.52 } }, banRate: 0.19, winRate: 47.36, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/lylia.png" },
    { id: "selena", name: "Selena", roles: { Roam: { pickRate: 0.83 }, Mid: { pickRate: 0.50 } }, banRate: 3.29, winRate: 47.13, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/selena.png" },
    { id: "kaja", name: "Kaja", roles: { Roam: { pickRate: 0.40 }, Mid: { pickRate: 0.29 } }, banRate: 45.06, winRate: 47.00, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/kaja.png" },
    { id: "grock", name: "Grock", roles: { Roam: { pickRate: 0.25 }, EXP: { pickRate: 0.16 } }, banRate: 1.02, winRate: 46.87, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/grock.png" },
    { id: "pharsa", name: "Pharsa", roles: { Mid: { pickRate: 0.35 } }, banRate: 0.06, winRate: 46.84, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/pharsa.png" },
    { id: "wanwan", name: "Wanwan", roles: { Gold: { pickRate: 0.16 } }, banRate: 0.07, winRate: 46.71, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/wanwan.png" },
    { id: "balmond", name: "Balmond", roles: { Jungle: { pickRate: 0.42 }, EXP: { pickRate: 0.30 } }, banRate: 0.50, winRate: 46.57, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/balmond.png" },
    { id: "baxia", name: "Baxia", roles: { Jungle: { pickRate: 0.07 }, Roam: { pickRate: 0.04 } }, banRate: 0.36, winRate: 46.27, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/baxia.png" },
    { id: "layla", name: "Layla", roles: { Gold: { pickRate: 0.52 } }, banRate: 0.44, winRate: 46.14, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/layla.png" },
    { id: "hylos", name: "Hylos", roles: { Roam: { pickRate: 0.30 } }, banRate: 0.18, winRate: 46.00, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/hylos.png" },
    { id: "roger", name: "Roger", roles: { Jungle: { pickRate: 0.19 }, Gold: { pickRate: 0.10 } }, banRate: 0.06, winRate: 46.00, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/roger.png" },
    { id: "luo_yi", name: "Luo Yi", roles: { Mid: { pickRate: 0.16 } }, banRate: 0.04, winRate: 45.99, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/luo-yi.png" },
    { id: "change", name: "Chang'e", roles: { Mid: { pickRate: 0.47 } }, banRate: 0.11, winRate: 45.87, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/chang'e.png" },
    { id: "chou", name: "Chou", roles: { EXP: { pickRate: 0.60 }, Roam: { pickRate: 0.49 } }, banRate: 1.76, winRate: 45.87, powerSpike: "All", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/chou.png" },
    { id: "cici", name: "Cici", roles: { EXP: { pickRate: 0.24 } }, banRate: 0.25, winRate: 45.76, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/cici.png" },
    { id: "valentina", name: "Valentina", roles: { Mid: { pickRate: 0.29 } }, banRate: 0.16, winRate: 45.34, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/valentina.png" },
    { id: "nana", name: "Nana", roles: { Mid: { pickRate: 0.79 } }, banRate: 0.77, winRate: 45.14, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/nana.png" },
    { id: "karina", name: "Karina", roles: { Jungle: { pickRate: 0.35 } }, banRate: 0.49, winRate: 45.13, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/karina.png" },
    { id: "mathilda", name: "Mathilda", roles: { Roam: { pickRate: 0.20 }, Mid: { pickRate: 0.10 } }, banRate: 0.85, winRate: 44.91, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/mathilda.png" },
    { id: "zilong", name: "Zilong", roles: { EXP: { pickRate: 0.18 }, Jungle: { pickRate: 0.10 } }, banRate: 0.24, winRate: 44.52, powerSpike: "Late", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/zilong.png" },
    { id: "tigreal", name: "Tigreal", roles: { Roam: { pickRate: 1.39 } }, banRate: 4.10, winRate: 44.45, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/tigreal.png" },
    { id: "gatotkaca", name: "Gatotkaca", roles: { EXP: { pickRate: 0.20 }, Roam: { pickRate: 0.12 } }, banRate: 0.13, winRate: 44.45, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/gatotkaca.png" },
    { id: "alpha", name: "Alpha", roles: { Jungle: { pickRate: 0.25 }, EXP: { pickRate: 0.16 } }, banRate: 0.14, winRate: 44.20, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/alpha.png" },
    { id: "granger", name: "Granger", roles: { Jungle: { pickRate: 1.00 }, Gold: { pickRate: 0.46 } }, banRate: 0.97, winRate: 43.94, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/granger.png" },
    { id: "kalea", name: "Kalea", roles: { Roam: { pickRate: 0.11 } }, banRate: 0.30, winRate: 42.57, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/kalea.png" },
    { id: "fanny", name: "Fanny", roles: { Jungle: { pickRate: 0.74 } }, banRate: 2.21, winRate: 42.47, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/fanny.png" },
    { id: "lancelot", name: "Lancelot", roles: { Jungle: { pickRate: 0.55 } }, banRate: 0.18, winRate: 42.33, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/lancelot.png" },
    { id: "franco", name: "Franco", roles: { Roam: { pickRate: 0.72 } }, banRate: 2.94, winRate: 41.99, powerSpike: "Early", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/franco.png" },
    { id: "hayabusa", name: "Hayabusa", roles: { Jungle: { pickRate: 0.66 } }, banRate: 0.69, winRate: 47.49, powerSpike: "Mid", image: "https://raw.githubusercontent.com/fshangala/mlbb-heroes-dataset/master/images/hayabusa.png" }
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

// Automatically ensure .lanes and local image paths are populated
const HERO_DATASET = Array.from(heroMap.values()).map(hero => ({
    ...hero,
    lanes: getHeroLanes(hero),
    image: `/assets/heroes/${hero.id}.png` // Loads the downloaded Fandom PNG
}));

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RAW_HERO_DATASET, HERO_DATASET, getHeroLanes, getHeroPickRate, getHeroBanRate };
}