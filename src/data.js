// 모든 수치는 여기 한 곳에 둔다 (R-027). 시뮬레이터와 게임이 같은 파일을 쓴다.
var G = (typeof G !== 'undefined') ? G : {};
G.DATA = {
  version: 1,
  // 천체 단계 문턱 (질량). 1단계는 질량이 생기는 순간.
  tierTable: [10, 120, 1500, 2e4, 3e5, 2.5e6, 1.2e7], tierFactorHigh: 45,  // 2~8단계 문턱, 9·10단계는 ×High (붕괴 무거움 포함)
  tierMultBase: 1.35,           // 단계 배율 = base^(단계-1)
  prodPerMass: 0.3,             // 질량^massExp 1당 초당 별가루
  massExp: 0.6,
  harmonyPerTier: 0.015,         // 조화: 1 + h × Σ단계
  rarityExp: 0.5,              // 희소도 = (p최대/p)^exp
  outerRarityStep: 1.6,         // 표준 범위 밖 궤도 한 칸마다
  alignBase: 2,                 // 정렬 배율 = alignBase + 주사위 수
  manualMult: 2,                // 손 굴림 배율
  manualCooldown: 0.4,          // 손 굴림 최소 간격(초)

  // 반복 구매
  power: { cost0: 10, costK: 1.8, grow: 1.075 },  // 굴림 힘: P = (1+lv/2)·grow^lv
  wind: { cost0: 30, costK: 2.2, int0: 3.0, intK: 0.92, intMin: 0.05 },
  diceCost: { 3: 1.2e5, 4: 1.5e7, 5: 5e9, 6: 1e14 },
  forge: { unlock: 3 },          // 눈 옮기기: 주사위 3개부터
  moveStart: 3, moveGain: 2,     // 판 시작 옮기기 횟수, 처음 보는 천체 단계마다 +
  maxFaceBase: 6, maxFaceOver: 9,
  outerCap: 4,                   // 표준 범위 밖 궤도 희소도 상한 (특이점 연구로 8, 16)
  rareMin: 4,                    // 묶음 굴림에서도 실제로 추첨하는 희소도
  fate: { sec: 150, min: 40, max: 3, massSec: 20 }, // 운명 굴림: 약 sec초치 태엽 굴림마다 1회, 최대 max, 질량 = massSec초치 굴림

  // 하늘 이벤트
  eventGap: [100, 170],
  eventLife: 18,

  // 오프라인
  offlineCapH: 12, offlineEff: 0.5,

  // 초신성
  novaTier: 8,
  coreGain: { k: 3, div: 6e6, exp: 0.5 },
  // 중력 붕괴
  collapseTier: 10,
  collapseHeavy: 2.6, collapseHeavyLate: 1.25,
  singMassExp: 0.7,             // 특이점 누적에 따른 질량 배율 (1+특이점)^exp             // 붕괴할 때마다 단계 문턱 배율
  singGain: { k: 1, div: 40, exp: 0.45 },
  trayCapacity: 36,
  perDieMass: 1.15,              // 주사위 하나당 질량 배율
  shapeBonus: { d4: 0.2, d8: 0.12, d12: 1.4 }, // d4 정렬 +20%/개, d8 희소도 지수 +, d12 질량 ×/개
  endChalStage: 3,              // 엔딩에 필요한 관측 과제 단계
  refine: { cost0: 60, costK: 3, v: 1.5 },     // 별핵 정제: 질량 ×1.5 반복
  compress: { cost0: 10, costK: 2, v: 2 }     // 특이점 압축: 질량 ×2 반복
};

// 일회성 개량 (별가루). eff: 효과 키, v: 값, req: 해금 조건(이번 판 누적 별가루)
G.UPGRADES = [
  { id: 'lens1', cat: 'lens', cost: 60, req: 25, eff: 'prod', v: 1.5 },
  { id: 'heavy', cat: 'ring', cost: 250, req: 120, eff: 'align', v: 2 },
  { id: 'felt', cat: 'gear', cost: 600, req: 300, eff: 'interval', v: 0.7 },
  { id: 'harm1', cat: 'harp', cost: 1800, req: 900, eff: 'harmony', v: 0.01 },
  { id: 'reson', cat: 'orbit', cost: 6000, req: 3000, eff: 'neighbor', v: 0.15, pair: 'p1' },
  { id: 'net', cat: 'comet', cost: 6000, req: 3000, eff: 'event', v: 2, pair: 'p1' },
  { id: 'lens2', cat: 'lens', cost: 2e4, req: 1e4, eff: 'prod', v: 2 },
  { id: 'scope', cat: 'scope', cost: 8e4, req: 4e4, eff: 'rarity', v: 0.1, pair: 'p2' },
  { id: 'twin', cat: 'dice', cost: 8e4, req: 4e4, eff: 'twin', v: 0.25, pair: 'p2' },
  { id: 'hand', cat: 'hand', cost: 1.2e5, req: 6e4, eff: 'mass', v: 2 },
  { id: 'grav', cat: 'weight', cost: 2.5e5, req: 1.2e5, eff: 'tierMult', v: 0.1 },
  { id: 'debris', cat: 'comet', cost: 1.5e6, req: 8e5, eff: 'debris', v: 60, pair: 'p3' },
  { id: 'alres', cat: 'ring', cost: 1.5e6, req: 8e5, eff: 'alignSpread', v: 0.8, pair: 'p3' },
  { id: 'lens3', cat: 'lens', cost: 4e6, req: 2e6, eff: 'prod', v: 2 },
  { id: 'gear2', cat: 'gear', cost: 2.5e7, req: 1.2e7, eff: 'interval', v: 0.55 },
  { id: 'harm2', cat: 'harp', cost: 6e7, req: 3e7, eff: 'harmony', v: 0.01 },
  { id: 'outer', cat: 'scope', cost: 1.5e8, req: 7e7, eff: 'outerLens', v: 4, pair: 'p4' },
  { id: 'inner', cat: 'lens', cost: 1.5e8, req: 7e7, eff: 'innerLens', v: 4, pair: 'p4' },
  { id: 'lens4', cat: 'lens', cost: 6e8, req: 3e8, eff: 'prod', v: 2.5 },
  { id: 'press', cat: 'weight', cost: 2e9, req: 1e9, eff: 'threshold', v: 0.4 },
  { id: 'heavy2', cat: 'ring', cost: 6e9, req: 3e9, eff: 'align', v: 4, pair: 'p5' },
  { id: 'scope2', cat: 'scope', cost: 6e9, req: 3e9, eff: 'rarity', v: 0.15, pair: 'p5' },
  { id: 'lens5', cat: 'lens', cost: 4e10, req: 2e10, eff: 'prod', v: 3 },
  { id: 'gear3', cat: 'gear', cost: 4e12, req: 2e12, eff: 'interval', v: 0.6 },
  { id: 'grav2', cat: 'weight', cost: 2e13, req: 1e13, eff: 'tierMult', v: 0.1 },
  { id: 'reson2', cat: 'orbit', cost: 6e13, req: 3e13, eff: 'neighbor', v: 0.25, pair: 'p6' },
  { id: 'twin2', cat: 'dice', cost: 6e13, req: 3e13, eff: 'twin', v: 0.3, pair: 'p6' },
  { id: 'harm3', cat: 'harp', cost: 1e14, req: 5e13, eff: 'harmony', v: 0.015 },
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
  { id: 'r4', br: 1, cost: 10, eff: 'moveStart', v: 3 },
  { id: 'r5', br: 1, cost: 25, eff: 'align', v: 3 },
  { id: 'r6', br: 1, cost: 60, eff: 'twin', v: 0.5 },
  { id: 's1', br: 2, cost: 1, eff: 'eventFreq', v: 0.6 },
  { id: 's2', br: 2, cost: 2, eff: 'autoCatch', v: 1 },
  { id: 's3', br: 2, cost: 4, eff: 'offline', v: 1 },
  { id: 's4', br: 2, cost: 10, eff: 'autoUpgrade', v: 1 },
  { id: 's5', br: 2, cost: 25, eff: 'autoBuy', v: 1 },
  { id: 's6', br: 2, cost: 200, eff: 'autoNova', v: 1 }
];

// 관측 과제
// 관측 과제: 단계마다 궤도 목표 [[궤도, 천체 단계], ...]. 1~2단계는 초신성 구간, 3~5단계는 붕괴 뒤.
G.CHALLENGES = [
  { id: 'c1', rule: 'noMove', reward: 'moveStart', v: 1, req: 3, goals: [[[8, 7]], [[5, 7], [11, 7]], [[13, 9]], [[4, 9], [16, 9]], [[3, 10]]] },
  { id: 'c2', rule: 'twoDice', reward: 'perDie', v: 0.03, req: 3, goals: [[[3, 7]], [[2, 7], [10, 7]], [[11, 9]], [[1, 9], [11, 9]], [[0, 10]]] },
  { id: 'c3', rule: 'oddOnly', reward: 'oddProd', v: 1.5, req: 4, goals: [[[9, 7]], [[7, 7], [13, 7]], [[11, 9]], [[5, 9], [15, 9]], [[3, 10]]] },
  { id: 'c4', rule: 'noHarmony', reward: 'harmonyX', v: 0.25, req: 5, goals: [[[10, 7]], [[6, 7], [14, 7]], [[12, 9]], [[8, 9], [16, 9]], [[4, 10]]] },
  { id: 'c5', rule: 'slowWind', reward: 'interval', v: 0.88, req: 6, goals: [[[7, 7]], [[6, 7], [8, 7]], [[9, 9]], [[5, 9], [13, 9]], [[2, 10]]] },
  { id: 'c6', rule: 'heavySky', reward: 'threshold', v: 0.85, req: 8, goals: [[[10, 7]], [[9, 7], [11, 7]], [[10, 9]], [[8, 9], [12, 9]], [[14, 10]]] }
];

// 특이점 연구
G.SRESEARCH = [
  { id: 'q1', cost: 1, eff: 'coreX', v: 3 },
  { id: 'q2', cost: 1, eff: 'mass', v: 10 },
  { id: 'q3', cost: 2, eff: 'shape', v: 'd4' },
  { id: 'q4', cost: 3, eff: 'keepResearch', v: 1 },
  { id: 'q5', cost: 5, eff: 'shape', v: 'd8', outer: 8 },
  { id: 'q6', cost: 8, eff: 'slot6', v: 1 },
  { id: 'q7', cost: 13, eff: 'offlineCap', v: 72 },
  { id: 'q8', cost: 21, eff: 'shape', v: 'd12' },
  { id: 'q9', cost: 34, eff: 'coreX', v: 5 },
  { id: 'q10', cost: 55, eff: 'tierMult', v: 0.25, outer: 16 },
  { id: 'q11', cost: 89, eff: 'autoCollapse', v: 1 },
  { id: 'q12', cost: 1500, eff: 'ending', v: 1 }
];

G.EVENTS = ['comet', 'shower', 'flare', 'rogue', 'align', 'pulsar', 'meteor', 'moons'];

if (typeof module !== 'undefined') module.exports = G;
