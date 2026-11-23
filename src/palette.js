// Fantasy 24 (Lospec). 모든 화면 픽셀은 이 24색 중 하나다.
var G = (typeof G !== 'undefined') ? G : {};
G.PAL_HEX = [
  '1f240a', '39571c', 'a58c27', 'efac28', 'efd8a1', 'ab5c1c',
  '183f39', 'ef692f', 'efb775', 'a56243', '773421', '724113',
  '2a1d0d', '392a1c', '684c3c', '927e6a', '276468', 'ef3a0c',
  '45230d', '3c9f9c', '9b1a0a', '36170c', '550f0a', '300f0a'
];
// 이름표 (색 번호)
G.C = {
  OLIVEBLK: 0, DKGREEN: 1, OCHRE: 2, GOLD: 3, CREAM: 4, RUST: 5,
  DKTEAL: 6, ORANGE: 7, PEACH: 8, CLAY: 9, BRRED: 10, BROWN: 11,
  INK: 12, DKBROWN: 13, TAUPE: 14, GRAY: 15, TEAL: 16, RED: 17,
  DKRUST: 18, LTTEAL: 19, DKRED: 20, MAROON: 21, BLOOD: 22, REDBLK: 23,
  NONE: 255
};
// 명암 램프 (밝음 -> 어두움)
G.RAMP = {
  ivory: [4, 8, 9, 14],
  brass: [3, 2, 11, 18],
  stone: [15, 14, 13, 12],
  orange: [8, 7, 5, 10, 21],
  red: [7, 17, 20, 22, 23],
  teal: [19, 16, 6, 0],
  green: [2, 1, 0],
  rock: [15, 14, 13, 21, 12],
  clay: [8, 9, 10, 21, 23],
  gold: [4, 3, 7, 5, 10],
  white: [4, 8, 15, 14],
  sea: [19, 16, 6, 0, 12]
};
G.PAL_RGB = G.PAL_HEX.map(function (h) {
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
});
if (typeof module !== 'undefined') module.exports = G;
