#!/usr/bin/env python3
"""갈무리 BDF -> src/fontdata.js 변환.
src/ 아래 모든 .js 파일에 쓰인 글자 + 출력 가능한 ASCII만 골라 담는다(서브셋).
사용: python3 tools/build_font.py
"""
import os, re, glob, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = {
    'g11': 'Galmuri11.bdf',
    'g11b': 'Galmuri11-Bold.bdf',
    'g9': 'Galmuri9.bdf',
    'g7': 'Galmuri7.bdf',
    'g14': 'Galmuri14.bdf',
}

def parse_bdf(path):
    glyphs = {}
    with open(path, encoding='utf-8', errors='replace') as f:
        lines = f.read().split('\n')
    i = 0
    n = len(lines)
    while i < n:
        ln = lines[i]
        if ln.startswith('STARTCHAR'):
            enc = None; dw = 0; bbx = None; rows = []
            i += 1
            while not lines[i].startswith('ENDCHAR'):
                l = lines[i]
                if l.startswith('ENCODING'):
                    enc = int(l.split()[1])
                elif l.startswith('DWIDTH'):
                    dw = int(l.split()[1])
                elif l.startswith('BBX'):
                    bbx = list(map(int, l.split()[1:5]))
                elif l.startswith('BITMAP'):
                    i += 1
                    while not lines[i].startswith('ENDCHAR'):
                        rows.append(lines[i].strip())
                        i += 1
                    continue
                i += 1
            if enc is not None and enc >= 0 and bbx:
                glyphs[enc] = (dw, bbx, rows)
        i += 1
    return glyphs

def collect_chars():
    chars = set(chr(c) for c in range(32, 127))
    chars.update('·…×−→←↑↓✦◆●○■□▶◀—–“”‘’%°')
    files = glob.glob(os.path.join(ROOT, 'src', '**', '*.js'), recursive=True)
    for fp in files:
        if fp.endswith('fontdata.js'):
            continue
        with open(fp, encoding='utf-8') as f:
            for ch in f.read():
                if ord(ch) > 126:
                    chars.add(ch)
    return chars

def main():
    chars = collect_chars()
    out = {}
    missing = {}
    for key, fn in FONTS.items():
        g = parse_bdf(os.path.join(ROOT, 'assets', 'font', fn))
        data = {}
        for ch in sorted(chars):
            c = ord(ch)
            if c not in g:
                missing.setdefault(key, []).append(ch)
                continue
            dw, (w, h, xo, yo), rows = g[c]
            # 행을 w비트 이진 문자열 대신 hex 그대로 보존
            data[c] = [dw, w, h, xo, yo, ''.join(r.rjust(2, '0') for r in rows), len(rows[0]) if rows else 0]
        # 기준선 위 높이: 'A'와 '가' 중 큰 값
        asc = 0
        for c in (65, 44032):
            if c in g:
                dw, (w, h, xo, yo), rows = g[c]
                asc = max(asc, h + yo)
        out[key] = {'asc': asc, 'g': data}
    js = '// 자동 생성: tools/build_font.py (갈무리 2.40.3, SIL OFL 1.1)\n'
    js += 'var FONTDATA = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
    js += "if (typeof module !== 'undefined') module.exports = FONTDATA;\n"
    with open(os.path.join(ROOT, 'src', 'fontdata.js'), 'w', encoding='utf-8') as f:
        f.write(js)
    total = len(chars)
    print('chars', total, 'bytes', len(js))
    for k, v in missing.items():
        vis = [c for c in v if c.strip()]
        if vis:
            print('missing', k, ''.join(vis[:80]))

if __name__ == '__main__':
    main()
