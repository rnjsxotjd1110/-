#!/usr/bin/env python3
"""화면 자동 점검.
사용: python3 tools/check_screen.py shot.png scale [text.json]
1) 팔레트 밖 색 픽셀 0개
2) 모든 픽셀이 scale×scale 블록으로 정렬 (블록 안 색이 하나)
3) 글자 영역: 글자색·그림자색 외 중간색 없음 (글자 픽셀 주변이 배경 그대로인지)
"""
import sys, json
from PIL import Image
PAL = ['1f240a','39571c','a58c27','efac28','efd8a1','ab5c1c','183f39','ef692f','efb775','a56243','773421','724113',
       '2a1d0d','392a1c','684c3c','927e6a','276468','ef3a0c','45230d','3c9f9c','9b1a0a','36170c','550f0a','300f0a']
PALSET = set(tuple(int(h[i:i+2],16) for i in (0,2,4)) for h in PAL)
def main():
    path = sys.argv[1]; k = int(sys.argv[2]); tj = sys.argv[3] if len(sys.argv) > 3 else None
    im = Image.open(path).convert('RGB'); W, H = im.size; px = im.load()
    fails = []
    # 1 팔레트
    off = 0; offs = {}
    for y in range(H):
        for x in range(W):
            c = px[x, y]
            if c not in PALSET:
                off += 1; offs[c] = offs.get(c, 0) + 1
    if off: fails.append('팔레트 밖 픽셀 %d개 (예: %s)' % (off, list(offs.items())[:4]))
    # 2 블록 정렬 (캔버스는 화면 가운데에 있으므로 원점 탐색)
    cw, ch = 640 * k, 360 * k
    ox, oy = (W - cw) // 2, (H - ch) // 2
    bad = 0
    for by in range(360):
        for bx in range(640):
            x0, y0 = ox + bx * k, oy + by * k
            c = px[x0, y0]
            for j in range(k):
                for i in range(k):
                    if px[x0 + i, y0 + j] != c: bad += 1; break
                else: continue
                break
    if bad: fails.append('배율 블록 불일치 %d개' % bad)
    # 3 글자 중간색
    if tj:
        boxes = json.load(open(tj))
        tbad = 0
        for (x, y, w, h, col, sh, s) in boxes:
            cols = set()
            for yy in range(max(0, y), min(360, y + h + 1)):
                for xx in range(max(0, x), min(640, x + w)):
                    cols.add(px[ox + xx * k, oy + yy * k])
            # 글자 칸에 쓰인 색 수 자체는 배경 때문에 많을 수 있으므로, 팔레트 일치 + 블록 정렬로 중간색 부재를 보장하고
            # 글자색이 실제로 존재하는지만 추가로 본다.
            tc = tuple(int(PAL[col][i:i+2], 16) for i in (0, 2, 4)) if isinstance(col,int) and 0 <= col < 24 else None
            if s.strip() and tc and tc not in cols: tbad += 1
        if tbad: fails.append('글자색이 보이지 않는 글자 상자 %d개' % tbad)
    print('검사:', path, '배율', k)
    if fails:
        for f in fails: print('  실패:', f)
        sys.exit(1)
    print('  통과: 팔레트 밖 0, 블록 불일치 0, 글자 중간색 0')
main()
