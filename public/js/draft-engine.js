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

function isHeroUnavailable(heroId) {
    if (!draftState) return false;
    const isBanned = [...(draftState.bans?.A || []), ...(draftState.bans?.B || [])].filter(Boolean).some(h => h.id === heroId);
    const isPicked = [...(draftState.picks?.A || []), ...(draftState.picks?.B || [])].filter(Boolean).some(h => h.id === heroId);
    return isBanned || isPicked;
}

/**
 * Robust Bipartite Lane Assignment Solver
 * Determines strictly unfilled lanes considering flex heroes.
 */
function getTeamOpenLanes(picks) {
    const activeHeroes = (picks || []).filter(Boolean);
    if (activeHeroes.length === 0) return [...ALL_LANES];

    // Priority to single-role heroes first (e.g. Melissa -> Gold, Zetian -> Mid)
    const singleRoleOccupied = new Set();
    activeHeroes.forEach(hero => {
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
        if (lanes.length === 1) {
            singleRoleOccupied.add(lanes[0]);
        }
    });

    // Solve flex assignment
    let maxCoverage = new Set(singleRoleOccupied);

    function backtrack(idx, currentAssignment) {
        if (idx === activeHeroes.length) {
            if (currentAssignment.size > maxCoverage.size) {
                maxCoverage = new Set(currentAssignment);
            }
            return;
        }

        const hero = activeHeroes[idx];
        const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);

        for (const lane of lanes) {
            if (!currentAssignment.has(lane)) {
                currentAssignment.add(lane);
                backtrack(idx + 1, currentAssignment);
                currentAssignment.delete(lane);
            }
        }
        // Also allow passing if over-indexed
        backtrack(idx + 1, currentAssignment);
    }

    backtrack(0, new Set(singleRoleOccupied));

    return ALL_LANES.filter(l => !maxCoverage.has(l));
}

function getRecommendations() {
    const turn = getCurrentTurn();
    if (!turn || draftState.isComplete) {
        return { type: 'complete', list: [], neededLanes: [] };
    }

    const availableHeroes = HERO_DATASET.filter(h => !isHeroUnavailable(h.id));

    const activeTeam = turn.team;
    const opponentTeam = activeTeam === 'A' ? 'B' : 'A';

    const myPicks = draftState.picks[activeTeam] || [];
    const oppPicks = draftState.picks[opponentTeam] || [];

    const myOpenLanes = getTeamOpenLanes(myPicks);
    const oppOpenLanes = getTeamOpenLanes(oppPicks);

    // 1. BAN RECOMMENDATIONS (Strict Opponent Open Lane Denial)
    if (turn.action === 'ban') {
        let banCandidates = availableHeroes;

        // If opponent has already locked in lanes, ban ONLY heroes that map to their OPEN lanes
        if (oppOpenLanes.length > 0 && oppOpenLanes.length < 5) {
            const laneDenialCandidates = availableHeroes.filter(hero => {
                const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
                return lanes.some(l => oppOpenLanes.includes(l));
            });
            if (laneDenialCandidates.length > 0) {
                banCandidates = laneDenialCandidates;
            }
        }

        const sorted = [...banCandidates].sort((a, b) => {
            const scoreA = ((typeof getHeroBanRate === 'function' ? getHeroBanRate(a) : (a.banRate || 0)) * 0.7) +
                           ((typeof getHeroPickRate === 'function' ? getHeroPickRate(a) : (a.pickRate || 0)) * 0.3);
            const scoreB = ((typeof getHeroBanRate === 'function' ? getHeroBanRate(b) : (b.banRate || 0)) * 0.7) +
                           ((typeof getHeroPickRate === 'function' ? getHeroPickRate(b) : (b.pickRate || 0)) * 0.3);
            return scoreB - scoreA;
        });

        return {
            type: 'ban',
            list: sorted.slice(0, 6),
            neededLanes: oppOpenLanes
        };
    }

    // 2. PICK RECOMMENDATIONS (Strict Own-Team Open Lane Filling)
    if (turn.action === 'pick') {
        let pickCandidates = availableHeroes;

        // Strictly enforce: Candidates MUST be capable of filling one of the team's remaining open lanes
        if (myOpenLanes.length > 0) {
            const strictlyOpenLaneCandidates = availableHeroes.filter(hero => {
                const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
                return lanes.some(l => myOpenLanes.includes(l));
            });
            if (strictlyOpenLaneCandidates.length > 0) {
                pickCandidates = strictlyOpenLaneCandidates;
            }
        }

        const sorted = [...pickCandidates].sort((a, b) => {
            const getBestScore = (hero) => {
                const lanes = (typeof getHeroLanes === 'function') ? getHeroLanes(hero) : (hero.lanes || []);
                const matchingOpen = lanes.filter(l => myOpenLanes.includes(l));
                let roleScore = (typeof getHeroPickRate === 'function') ? getHeroPickRate(hero) : (hero.pickRate || 0);

                matchingOpen.forEach(lane => {
                    if (hero.roles && hero.roles[lane]) {
                        roleScore = Math.max(roleScore, hero.roles[lane].pickRate || 0);
                    }
                });
                return roleScore;
            };

            return getBestScore(b) - getBestScore(a);
        });

        return {
            type: 'pick',
            list: sorted.slice(0, 6),
            neededLanes: myOpenLanes
        };
    }

    return { type: 'complete', list: [], neededLanes: [] };
}

function evaluateTeamDraft(picks) {
    if (!picks || picks.length === 0) {
        return { score: 0, breakdown: [{ text: "No heroes selected", type: "neg" }], coveredLanes: [] };
    }

    const safePicks = picks.filter(Boolean);
    const breakdown = [];
    let score = 0;

    const avgWinRate = safePicks.length ? safePicks.reduce((sum, h) => sum + (h.winRate || 50), 0) / safePicks.length : 50;
    const metaPts = Math.min(30, Math.round((avgWinRate - 45) * 4));
    score += metaPts;
    breakdown.push({ text: `Meta Win-Rate Rating: +${metaPts} pts (avg ${avgWinRate.toFixed(1)}%)`, type: "pos" });

    const openLanes = getTeamOpenLanes(safePicks);
    const coveredCount = 5 - openLanes.length;
    const coveragePts = coveredCount * 8;
    score += coveragePts;
    breakdown.push({ text: `Lane Coverage: +${coveragePts} pts (${coveredCount}/5 unique roles)`, type: "pos" });

    if (coveredCount >= 5) {
        score += 20;
        breakdown.push({ text: "Full 5-Role Balanced Lineup Bonus: +20 pts", type: "pos" });
    } else {
        score -= 15;
        breakdown.push({ text: `Missing Required Roles (${openLanes.join(', ')}): -15 pts`, type: "neg" });
    }

    const spikes = safePicks.map(h => h.powerSpike || "Mid");
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
        coveredLanes: ALL_LANES.filter(l => !openLanes.includes(l))
    };
}

function evaluateDraftComparison(picksA, bansA, picksB, bansB) {
    const safeA = (picksA || []).filter(Boolean);
    const safeB = (picksB || []).filter(Boolean);
    const safeBansA = (bansA || []).filter(Boolean);
    const safeBansB = (bansB || []).filter(Boolean);

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

    function getPowerCurve(picks) {
        let early = 0, mid = 0, late = 0;
        picks.forEach(h => {
            if (h.powerSpike === 'Early') early++;
            else if (h.powerSpike === 'Late') late++;
            else mid++;
        });
        return { early, mid, late };
    }

    const openLanesA = getTeamOpenLanes(safeA);
    const openLanesB = getTeamOpenLanes(safeB);
    const laneCountA = 5 - openLanesA.length;
    const laneCountB = 5 - openLanesB.length;

    const avgWinRateA = safeA.length ? safeA.reduce((sum, h) => sum + (h.winRate || 50), 0) / safeA.length : 50;
    const avgWinRateB = safeB.length ? safeB.reduce((sum, h) => sum + (h.winRate || 50), 0) / safeB.length : 50;

    const classesA = new Set(safeA.flatMap(h => (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || [])));
    const classesB = new Set(safeB.flatMap(h => (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || [])));
    const classCountA = classesA.size;
    const classCountB = classesB.size;

    const dmgA = getDamageProfile(safeA);
    const dmgB = getDamageProfile(safeB);

    const engageCountA = safeA.filter(h => {
        const c = (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || []);
        return c.includes('Tank') || c.includes('Support');
    }).length;
    const engageCountB = safeB.filter(h => {
        const c = (typeof getHeroClasses === 'function') ? getHeroClasses(h) : (h.heroClass || []);
        return c.includes('Tank') || c.includes('Support');
    }).length;

    const flexCountA = safeA.filter(h => ((typeof getHeroLanes === 'function') ? getHeroLanes(h) : (h.lanes || [])).length > 1).length;
    const flexCountB = safeB.filter(h => ((typeof getHeroLanes === 'function') ? getHeroLanes(h) : (h.lanes || [])).length > 1).length;

    const curveA = getPowerCurve(safeA);
    const curveB = getPowerCurve(safeB);
    const curveScoreA = (curveA.early >= 1 ? 1 : 0) + (curveA.mid >= 1 ? 1 : 0) + (curveA.late >= 1 ? 1 : 0);
    const curveScoreB = (curveB.early >= 1 ? 1 : 0) + (curveB.mid >= 1 ? 1 : 0) + (curveB.late >= 1 ? 1 : 0);

    const banEffA = safeBansA.reduce((sum, h) => sum + (h.banRate || 0), 0);
    const banEffB = safeBansB.reduce((sum, h) => sum + (h.banRate || 0), 0);

    let scoreA = Math.round((laneCountA * 6) + (avgWinRateA * 0.7) + (classCountA * 3) + (dmgA.isBalanced ? 10 : 4) + (engageCountA >= 1 ? 8 : 2) + (flexCountA * 2) + (curveScoreA * 3));
    let scoreB = Math.round((laneCountB * 6) + (avgWinRateB * 0.7) + (classCountB * 3) + (dmgB.isBalanced ? 10 : 4) + (engageCountB >= 1 ? 8 : 2) + (flexCountB * 2) + (curveScoreB * 3));
    scoreA = Math.min(100, Math.max(30, scoreA));
    scoreB = Math.min(100, Math.max(30, scoreB));

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