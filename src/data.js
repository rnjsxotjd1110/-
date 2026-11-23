// 모든 수치는 여기 한 곳에 둔다 (R-027). 시뮬레이터와 게임이 같은 파일을 쓴다.
var G = (typeof G !== 'undefined') ? G : {};
G.DATA = {
  version: 1,
  // 천체 단계 문턱 (질량). 1단계는 질량이 생기는 순간.
  tierTable: [10, 120, 1200, 9000, 6e4, 2.5e5, 9e5], tierFactorHigh: 16,  // 2~8단계 문턱, 9·10단계는 ×High
  tierMultBase: 1.35,           // 단계 배율 = base^(단계-1)
  prodPerMass: 0.3,             // 질량^massExp 1당 초당 별가루
  massExp: 0.6,
  harmonyPerTier: 0.015,         // 조화: 1 + h × Σ단계
  rarityExp: 0.5,              // 희소도 = (p최대/p)^exp
  outerRarityStep: 1.6,         // 표준 범위 밖 궤도 한 칸마다
  alignBase: 2,                 // 정렬 배율 = alignBase + 주사위 수
  manualMult: 2,                // 손 굴림 배율
  manualCooldown: 0.2,          // 손 굴림 최소 간격(초)

  // 반복 구매
  power: { cost0: 10, costK: 1.8, grow: 1.07 },  // 굴림 힘: P = (1+lv/2)·grow^lv
  wind: { cost0: 30, costK: 2.2, int0: 3.0, intK: 0.92, intMin: 0.05 },
  diceCost: { 3: 1.2e5, 4: 1.5e7, 5: 2e11, 6: 1e15 },
  forge: { cost0: 150, costK: 2.4, unlock: 3 }, // 주사위 3개부터
  maxFaceBase: 6, maxFaceOver: 9,

  // 하늘 이벤트
  eventGap: [100, 170],
  eventLife: 13,

  // 오프라인
  offlineCapH: 12, offlineEff: 0.5,

  // 초신성
  novaTier: 8,
  coreGain: { k: 3, div: 6e6, exp: 0.5 },
  // 중력 붕괴
  collapseTier: 10,
  collapseHeavy: 2.4, collapseHeavyLate: 1.5,
  singMassExp: 0.7,             // 특이점 누적에 따른 질량 배율 (1+특이점)^exp             // 붕괴할 때마다 단계 문턱 배율
  singGain: { k: 1, div: 40, exp: 0.6 },
  trayCapacity: 36
};

// 일회성 개량 (별가루). eff: 효과 키, v: 값, req: 해금 조건(이번 판 누적 별가루)
G.UPGRADES = [
  { id: 'lens1', cat: 'lens', cost: 60, req: 25, eff: 'prod', v: 1.5 },
  { id: 'heavy', cat: 'ring', cost: 250, req: 120, eff: 'align', v: 2 },
  { id: 'felt', cat: 'gear', cost: 600, req: 300, eff: 'interval', v: 0.8 },
  { id: 'harm1', cat: 'harp', cost: 1800, req: 900, eff: 'harmony', v: 0.01 },
  { id: 'reson', cat: 'orbit', cost: 4500, req: 2500, eff: 'neighbor', v: 0.1 },
  { id: 'net', cat: 'comet', cost: 8000, req: 4000, eff: 'event', v: 2 },
  { id: 'lens2', cat: 'lens', cost: 2e4, req: 1e4, eff: 'prod', v: 2 },
  { id: 'scope', cat: 'scope', cost: 6e4, req: 3e4, eff: 'rarity', v: 0.08 },
  { id: 'hand', cat: 'hand', cost: 1.2e5, req: 6e4, eff: 'manual', v: 1 },
  { id: 'grav', cat: 'weight', cost: 2.5e5, req: 1.2e5, eff: 'tierMult', v: 0.1 },
  { id: 'twin', cat: 'dice', cost: 6e5, req: 3e5, eff: 'twin', v: 0.15 },
  { id: 'debris', cat: 'comet', cost: 1.5e6, req: 8e5, eff: 'debris', v: 30 },
  { id: 'lens3', cat: 'lens', cost: 4e6, req: 2e6, eff: 'prod', v: 2 },
  { id: 'alres', cat: 'ring', cost: 1e7, req: 5e6, eff: 'alignSpread', v: 0.5 },
  { id: 'gear2', cat: 'gear', cost: 2.5e7, req: 1.2e7, eff: 'interval', v: 0.7 },
  { id: 'harm2', cat: 'harp', cost: 6e7, req: 3e7, eff: 'harmony', v: 0.01 },
  { id: 'outer', cat: 'scope', cost: 1.5e8, req: 7e7, eff: 'outerLens', v: 3 },
  { id: 'inner', cat: 'lens', cost: 1.5e8, req: 7e7, eff: 'innerLens', v: 3 },
  { id: 'lens4', cat: 'lens', cost: 6e8, req: 3e8, eff: 'prod', v: 2.5 },
  { id: 'press', cat: 'weight', cost: 2e9, req: 1e9, eff: 'threshold', v: 0.7 },
  { id: 'heavy2', cat: 'ring', cost: 8e9, req: 4e9, eff: 'align', v: 3 },
  { id: 'reson2', cat: 'orbit', cost: 3e10, req: 1.5e10, eff: 'neighbor', v: 0.15 },
  { id: 'lens5', cat: 'lens', cost: 1.5e11, req: 7e10, eff: 'prod', v: 3 },
  { id: 'scope2', cat: 'scope', cost: 8e11, req: 4e11, eff: 'rarity', v: 0.08 },
  { id: 'gear3', cat: 'gear', cost: 4e12, req: 2e12, eff: 'interval', v: 0.6 },
  { id: 'grav2', cat: 'weight', cost: 2e13, req: 1e13, eff: 'tierMult', v: 0.1 },
  { id: 'harm3', cat: 'harp', cost: 1e14, req: 5e13, eff: 'harmony', v: 0.015 },
  { id: 'twin2', cat: 'dice', cost: 6e14, req: 3e14, eff: 'twin', v: 0.2 },
  { id: 'lens6', cat: 'lens', cost: 4e15, req: 2e15, eff: 'prod', v: 3 },
  { id: 'press2', cat: 'weight', cost: 3e16, req: 1.5e16, eff: 'threshold', v: 0.6 }
];

// 별핵 연구: 갈래 3개 × 6. need: 같은 갈래 앞 단계
G.RESEARCH = [
  { id: 'g1', br: 0, cost: 1, eff: 'mass', v: 3 },
  { id: 'g2', br: 0, cost: 2, eff: 'harmony', v: 0.01 },
  { id: 'g3', br: 0, cost: 4, eff: 'startTier', v: 2 },
  { id: 'g4', br: 0, cost: 10, eff: 'coreMass', v: 0.6 },
  { id: 'g5', br: 0, cost: 25, eff: 'tierMult', v: 0.15 },
  { id: 'g6', br: 0, cost: 60, eff: 'overflow', v: 9 },
  { id: 'r1', br: 1, cost: 1, eff: 'startWind', v: 6 },
  { id: 'r2', br: 1, cost: 2, eff: 'startDice', v: 3 },
  { id: 'r3', br: 1, cost: 4, eff: 'interval', v: 0.75 },
  { id: 'r4', br: 1, cost: 10, eff: 'keepForge', v: 0.5 },
  { id: 'r5', br: 1, cost: 25, eff: 'align', v: 3 },
  { id: 'r6', br: 1, cost: 60, eff: 'twin', v: 0.5 },
  { id: 's1', br: 2, cost: 1, eff: 'eventFreq', v: 0.6 },
  { id: 's2', br: 2, cost: 2, eff: 'autoCatch', v: 1 },
  { id: 's3', br: 2, cost: 4, eff: 'offline', v: 1 },
  { id: 's4', br: 2, cost: 10, eff: 'autoUpgrade', v: 1 },
  { id: 's5', br: 2, cost: 25, eff: 'autoBuy', v: 1 },
  { id: 's6', br: 2, cost: 60, eff: 'autoNova', v: 1 }
];

// 관측 과제
G.CHALLENGES = [
  { id: 'c1', rule: 'noForge', reward: 'forgeCost', v: 0.25, req: 3 },
  { id: 'c2', rule: 'twoDice', reward: 'diceCost', v: 0.01, req: 3 },
  { id: 'c3', rule: 'oddOnly', reward: 'prod', v: 5, req: 4 },
  { id: 'c4', rule: 'noHarmony', reward: 'harmonyX', v: 2, req: 5 },
  { id: 'c5', rule: 'slowWind', reward: 'interval', v: 0.5, req: 6 },
  { id: 'c6', rule: 'heavySky', reward: 'threshold', v: 0.5, req: 8 }
];

// 특이점 연구
G.SRESEARCH = [
  { id: 'q1', cost: 1, eff: 'coreX', v: 3 },
  { id: 'q2', cost: 1, eff: 'mass', v: 10 },
  { id: 'q3', cost: 2, eff: 'shape', v: 'd4' },
  { id: 'q4', cost: 3, eff: 'keepResearch', v: 1 },
  { id: 'q5', cost: 5, eff: 'shape', v: 'd8' },
  { id: 'q6', cost: 8, eff: 'slot6', v: 1 },
  { id: 'q7', cost: 13, eff: 'offlineCap', v: 72 },
  { id: 'q8', cost: 21, eff: 'shape', v: 'd12' },
  { id: 'q9', cost: 34, eff: 'coreX', v: 5 },
  { id: 'q10', cost: 55, eff: 'tierMult', v: 0.25 },
  { id: 'q11', cost: 89, eff: 'autoCollapse', v: 1 },
  { id: 'q12', cost: 600, eff: 'ending', v: 1 }
];

G.EVENTS = ['comet', 'shower', 'flare', 'rogue', 'align', 'pulsar', 'meteor', 'moons'];

if (typeof module !== 'undefined') module.exports = G;
