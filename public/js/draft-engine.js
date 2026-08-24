// Master Draft Sequence (20-Step Snake Draft)
const DRAFT_SEQUENCE = [
    { turn: 1,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 2,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 3,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 4,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },
    { turn: 5,  phase: 'Ban Phase 1',  action: 'ban',  team: 'A' },
    { turn: 6,  phase: 'Ban Phase 1',  action: 'ban',  team: 'B' },

    { turn: 7,  phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 8,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 9,  phase: 'Pick Phase 1', action: 'pick', team: 'B' },
    { turn: 10, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 11, phase: 'Pick Phase 1', action: 'pick', team: 'A' },
    { turn: 12, phase: 'Pick Phase 1', action: 'pick', team: 'B' },

    { turn: 13, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 14, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },
    { turn: 15, phase: 'Ban Phase 2',  action: 'ban',  team: 'B' },
    { turn: 16, phase: 'Ban Phase 2',  action: 'ban',  team: 'A' },

    { turn: 17, phase: 'Pick Phase 2', action: 'pick', team: 'B' },
    { turn: 18, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 19, phase: 'Pick Phase 2', action: 'pick', team: 'A' },
    { turn: 20, phase: 'Pick Phase 2', action: 'pick', team: 'B' }
];

let draftState = {
    version: 0,
    currentTurnIndex: 0,
    isComplete: false,
    started: false,
    bans: { A: [], B: [] },
    picks: { A: [], B: [] },
    draftLog: []
};

const ALL_LANES = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];

function getCurrentTurn() {
    if (!draftState || draftState.currentTurnIndex >= DRAFT_SEQUENCE.length) return null;
    return DRAFT_SEQUENCE[draftState.currentTurnIndex];
}

// FIXED: Use .some() so only actually picked or banned heroes are marked unavailable
function isHeroUnavailable(heroId) {
    if (!draftState) return false;
    const isBanned = [...(draftState.bans?.A || []), ...(draftState.bans?.B || [])].some(h => h.id === heroId);
    const isPicked = [...(draftState.picks?.A || []), ...(draftState.picks?.B || [])].some(h => h.id === heroId);
    return isBanned || isPicked;
}

function getRecommendations() {
    const turn = getCurrentTurn();
    if (!turn) return { type: 'complete', list: [], neededLanes: [] };

    const availableHeroes = HERO_DATASET.filter(h => !isHeroUnavailable(h.id));

    if (turn.action === 'ban') {
        const sorted = [...availableHeroes].sort((a, b) => (b.banRate || 0) - (a.banRate || 0));
        return {
            type: 'ban',
            list: sorted.slice(0, 6),
            neededLanes: []
        };
    }

    const myPicks = draftState.picks[turn.team] || [];
    const coveredLanes = new Set();
    myPicks.forEach(hero => {
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
        lanes.forEach(l => coveredLanes.add(l));
    });

    const neededLanes = ALL_LANES.filter(l => !coveredLanes.has(l));

    let candidates = availableHeroes;
    if (neededLanes.length > 0) {
        const filtered = availableHeroes.filter(hero => {
            const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
            return lanes.some(l => neededLanes.includes(l));
        });
        if (filtered.length > 0) {
            candidates = filtered;
        }
    }

    const sorted = [...candidates].sort((a, b) => {
        const rateA = (typeof getHeroPickRate === 'function') ? getHeroPickRate(a) : 0;
        const rateB = (typeof getHeroPickRate === 'function') ? getHeroPickRate(b) : 0;
        return rateB - rateA;
    });

    return {
        type: 'pick',
        list: sorted.slice(0, 6),
        neededLanes: neededLanes
    };
}

function evaluateTeamDraft(picks) {
    if (!picks || picks.length === 0) {
        return { score: 0, breakdown: [{ text: "No heroes selected", type: "neg" }], coveredLanes: [] };
    }

    const breakdown = [];
    let score = 0;

    // 1. Meta Strength
    const avgWinRate = picks.reduce((sum, h) => sum + (h.winRate || 50), 0) / picks.length;
    const metaPts = Math.min(30, Math.round((avgWinRate - 45) * 4));
    score += metaPts;
    breakdown.push({ text: `Meta Win-Rate Rating: +${metaPts} pts (avg ${avgWinRate.toFixed(1)}%)`, type: "pos" });

    // 2. Lane Coverage
    const coveredLanes = new Set();
    picks.forEach(h => {
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(h) : (hero.lanes || []);
        lanes.forEach(l => coveredLanes.add(l));
    });
    const coveragePts = coveredLanes.size * 8;
    score += coveragePts;
    breakdown.push({ text: `Lane Coverage: +${coveragePts} pts (${coveredLanes.size}/5 unique roles)`, type: "pos" });

    // 3. Full 5-Role Bonus
    if (coveredLanes.size >= 5) {
        score += 20;
        breakdown.push({ text: "Full 5-Role Balanced Lineup Bonus: +20 pts", type: "pos" });
    } else {
        const missing = ALL_LANES.filter(l => !coveredLanes.has(l));
        score -= 15;
        breakdown.push({ text: `Missing Required Roles (${missing.join(', ')}): -15 pts`, type: "neg" });
    }

    // 4. Power Spike Curve
    const spikes = picks.map(h => h.powerSpike || "Mid");
    const hasLate = spikes.includes("Late") || spikes.includes("All");
    const hasEarly = spikes.includes("Early") || spikes.includes("All");
    if (hasLate && hasEarly) {
        score += 10;
        breakdown.push({ text: "Balanced Scaling Curve (Early + Late Spikes): +10 pts", type: "pos" });
    }

    score = Math.max(0, Math.min(100, score));

    return {
        score: score,
        breakdown: breakdown,
        coveredLanes: Array.from(coveredLanes)
    };
}

/**
 * 8-Category Comparative Draft Evaluator
 * Evaluates Team A vs Team B across structural heuristics without declaring a definitive winner.
 */
function evaluateDraftComparison(picksA, bansA, picksB, bansB) {
    const ALL_LANES = ['EXP', 'Jungle', 'Mid', 'Gold', 'Roam'];

    // Helper: Damage distribution analysis
    function getDamageProfile(picks) {
        let magic = 0, physical = 0;
        picks.forEach(hero => {
            const classes = (typeof getHeroClasses === 'function') ? getHeroClasses(hero) : (hero.heroClass || []);
            if (classes.includes('Mage')) magic += 1.5;
            if (classes.includes('Support')) magic += 0.5;
            if (classes.includes('Marksman') || classes.includes('Assassin')) physical += 1.5;
            if (classes.includes('Fighter')) physical += 1.0;
        });
        const isBalanced = magic >= 1.5 && physical >= 2.0;
        return { magic, physical, isBalanced };
    }

    // Helper: Power curve spike counts
    function getPowerCurve(picks) {
        let early = 0, mid = 0, late = 0;
        picks.forEach(h => {
            if (h.powerSpike === 'Early') early++;
            else if (h.powerSpike === 'Late') late++;
            else mid++;
        });
        return { early, mid, late };
    }

    // 1. Lane Coverage
    const lanesA = new Set(picksA.flatMap(h => (typeof getHeroLanes === 'function') ? getHeroLanes(h) : (h.lanes || [])));
    const lanesB = new Set(picksB.flatMap(h => (typeof getHeroLanes === 'function') ? getHeroLanes(h) : (h.lanes || [])));
    const laneCountA = ALL_LANES.filter(l => lanesA.has(l)).length;
    const laneCountB = ALL_LANES.filter(l => lanesB.has(l)).length;

    // 2. Meta Strength (Average Win Rate)
    const avgWinRateA = picksA.length ? picksA.reduce((sum, h) => sum + (h.winRate || 50), 0) / picksA.length : 50;
    const avgWinRateB = picksB.length ? picksB.reduce((sum, h) => sum + (h.winRate || 50), 0) / picksB.length : 50;

    // 3. Role Balance (Class Diversity)
    const classesA = new Set(picksA.flatMap(h => (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || [])));
    const classesB = new Set(picksB.flatMap(h => (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || [])));
    const classCountA = classesA.size;
    const classCountB = classesB.size;

    // 4. Damage Type Diversity
    const dmgA = getDamageProfile(picksA);
    const dmgB = getDamageProfile(picksB);

    // 5. Engage / Utility (Tank + Support count)
    const engageCountA = picksA.filter(h => {
        const c = (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || []);
        return c.includes('Tank') || c.includes('Support');
    }).length;
    const engageCountB = picksB.filter(h => {
        const c = (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || []);
        return c.includes('Tank') || c.includes('Support');
    }).length;

    // 6. Flexibility (Multi-lane flex heroes)
    const flexCountA = picksA.filter(h => ((typeof getHeroLanes === 'function') ? getHeroLanes(h) : (h.lanes || [])).length > 1).length;
    const flexCountB = picksB.filter(h => ((typeof getHeroLanes === 'function') ? getHeroLanes(h) : (h.lanes || [])).length > 1).length;

    // 7. Power Curve Stability
    const curveA = getPowerCurve(picksA);
    const curveB = getPowerCurve(picksB);
    const curveScoreA = (curveA.early >= 1 ? 1 : 0) + (curveA.mid >= 1 ? 1 : 0) + (curveA.late >= 1 ? 1 : 0);
    const curveScoreB = (curveB.early >= 1 ? 1 : 0) + (curveB.mid >= 1 ? 1 : 0) + (curveB.late >= 1 ? 1 : 0);

    // 8. Ban Efficiency (Total Ban Rate of Banned Targets)
    const banEffA = bansA.reduce((sum, h) => sum + (h.banRate || 0), 0);
    const banEffB = bansB.reduce((sum, h) => sum + (h.banRate || 0), 0);

    // Compute Overall Scores (Out of 100)
    let scoreA = Math.round((laneCountA * 6) + (avgWinRateA * 0.7) + (classCountA * 3) + (dmgA.isBalanced ? 10 : 4) + (engageCountA >= 1 ? 8 : 2) + (flexCountA * 2) + (curveScoreA * 3));
    let scoreB = Math.round((laneCountB * 6) + (avgWinRateB * 0.7) + (classCountB * 3) + (dmgB.isBalanced ? 10 : 4) + (engageCountB >= 1 ? 8 : 2) + (flexCountB * 2) + (curveScoreB * 3));
    scoreA = Math.min(100, Math.max(30, scoreA));
    scoreB = Math.min(100, Math.max(30, scoreB));

    // Comparative Items Definition
    const categories = [
        {
            name: "Lane Coverage",
            desc: "Map position coverage across EXP, Jungle, Mid, Gold, and Roam",
            statA: `${laneCountA}/5 Covered`,
            statB: `${laneCountB}/5 Covered`,
            winner: laneCountA > laneCountB ? 'A' : (laneCountB > laneCountA ? 'B' : 'EQUAL')
        },
        {
            name: "Meta Strength",
            desc: "Average baseline win rate across locked heroes",
            statA: `${avgWinRateA.toFixed(1)}% WR`,
            statB: `${avgWinRateB.toFixed(1)}% WR`,
            winner: avgWinRateA > avgWinRateB + 0.2 ? 'A' : (avgWinRateB > avgWinRateA + 0.2 ? 'B' : 'EQUAL')
        },
        {
            name: "Role Balance",
            desc: "Distribution across standard MLBB combat classes",
            statA: `${classCountA} Classes`,
            statB: `${classCountB} Classes`,
            winner: classCountA > classCountB ? 'A' : (classCountB > classCountA ? 'B' : 'EQUAL')
        },
        {
            name: "Damage Type",
            desc: "Hybrid split of physical burst and continuous magic power",
            statA: dmgA.isBalanced ? "Balanced Split" : "Heavy Biased",
            statB: dmgB.isBalanced ? "Balanced Split" : "Heavy Biased",
            winner: dmgA.isBalanced && !dmgB.isBalanced ? 'A' : (dmgB.isBalanced && !dmgA.isBalanced ? 'B' : 'EQUAL')
        },
        {
            name: "Engage / Utility",
            desc: "Crowd control frontline and supportive sustain capacity",
            statA: `${engageCountA} Utility/Tank`,
            statB: `${engageCountB} Utility/Tank`,
            winner: engageCountA > engageCountB ? 'A' : (engageCountB > engageCountA ? 'B' : 'EQUAL')
        },
        {
            name: "Flexibility",
            desc: "Lineup flex capacity to adapt lanes and counter-play",
            statA: `${flexCountA} Flex Heroes`,
            statB: `${flexCountB} Flex Heroes`,
            winner: flexCountA > flexCountB ? 'A' : (flexCountB > flexCountA ? 'B' : 'EQUAL')
        },
        {
            name: "Power Curve",
            desc: "Game pacing from early objective pressure to late scaling",
            statA: `${curveA.early}E / ${curveA.mid}M / ${curveA.late}L`,
            statB: `${curveB.early}E / ${curveB.mid}M / ${curveB.late}L`,
            winner: curveScoreA > curveScoreB ? 'A' : (curveScoreB > curveScoreA ? 'B' : 'EQUAL')
        },
        {
            name: "Ban Efficiency",
            desc: "Priority threats eliminated during ban turns",
            statA: `${banEffA.toFixed(0)}% Threat Ban`,
            statB: `${banEffB.toFixed(0)}% Threat Ban`,
            winner: banEffA > banEffB + 2 ? 'A' : (banEffB > banEffA + 2 ? 'B' : 'EQUAL')
        }
    ];

    return { scoreA, scoreB, categories };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { evaluateDraftComparison, evaluateTeamDraft, DRAFT_SEQUENCE };
}