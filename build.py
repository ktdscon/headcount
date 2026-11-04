"""index.src.html + 상세페이지 제목 → index.html 생성.
상세페이지(D:/컨소시엄/20261102_edu/courses)가 늘거나 바뀌면 다시 실행."""
import re, json, glob, html, os, sys
EDU = 'D:/컨소시엄/20261102_edu/courses'
HERE = os.path.dirname(os.path.abspath(__file__))
def norm(t): return re.sub(r'[^0-9A-Za-z가-힣]', '', html.unescape(t)).lower()
m = {}
for f in sorted(glob.glob(EDU + '/course-*.html')):
    t = re.search(r'<title>([^<|]*)', open(f, encoding='utf-8').read()).group(1).strip()
    m[norm(t)] = int(re.search(r'(\d+)', os.path.basename(f)).group(1))
src = open(os.path.join(HERE, 'index.src.html'), encoding='utf-8').read()
out = src.replace('__MAP__', json.dumps(m, ensure_ascii=False, separators=(',', ':')))
open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8', newline='\n').write(out)
print('index.html 생성, 상세페이지', len(m), '개 매핑')
if len(sys.argv) > 1:  # 로컬 테스트용: python build.py test.json
    t = re.sub(r"var API = '[^']*';", "var API = '%s';" % sys.argv[1], out)
    open(os.path.join(HERE, '_test.html'), 'w', encoding='utf-8', newline='\n').write(t)
    print('_test.html 생성 (API=%s)' % sys.argv[1])
