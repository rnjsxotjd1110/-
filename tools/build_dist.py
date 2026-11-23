#!/usr/bin/env python3
"""index.html의 <script src>를 모두 안에 넣어 한 파일 실행본(dist/dice_orrery.html)을 만든다.
사용: python3 tools/build_dist.py"""
import os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
def inline(m):
    src = open(os.path.join(ROOT, m.group(1)), encoding='utf-8').read()
    return '<script>\n' + src.replace('</script', '<\\/script') + '\n</script>'
out = re.sub(r'<script src="([^"]+)"></script>', inline, html)
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
p = os.path.join(ROOT, 'dist', 'dice_orrery.html')
open(p, 'w', encoding='utf-8').write(out)
print(p, len(out.encode('utf-8')), 'bytes')
