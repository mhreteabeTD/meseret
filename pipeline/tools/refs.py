"""Move book references ("Example 1.31", "Exercise 1.6 Q2", "Q1 a") out of question text into a separate "ref" field."""
import re, json, sys, glob
NAME = r'(?:Challenge,\s+)?(?:Example|Exercise|Activity|Group work|Figure|Table|Definition|Review(?:\s+Exercise)?|Practice)'
RE = re.compile(rf'^({NAME}(?:\s+\d[\d.]*[a-z]?)?(?:\s+Q\d+)?(?:\s+[ivx]+(?=[\s:]|$))?(?:\s+[a-z](?=[\s:]|$))?|Q\d+(?:\s+[a-z](?=[\s:]|$))?)(?:\s*:\s*|\s+|$)(.*)$', re.S)
def split(v):
    m = RE.match(v or '')
    if not m: return None, v
    ref, rest = m.group(1).strip(), m.group(2).strip()
    if rest[:1].islower(): rest = rest[0].upper() + rest[1:]
    return ref, rest
def fix(s):
    if not isinstance(s, dict) or s.get('kind') in ('read', 'name'): return 0
    n = 0
    for k in ('title', 'text', 'ask'):
        if k in s and isinstance(s[k], str):
            ref, rest = split(s[k])
            if ref and (k != 'ask' or '___' in rest):
                if 'ref' not in s: s['ref'] = ref
                if rest: s[k] = rest
                elif k == 'title': del s[k]
                n += 1
    return n
def walk(L):
    n = 0
    for i in L.get('ideas', []):
        for s in i['screens']: n += fix(s)
    for e in L.get('exercises', []):
        for s in e['items']: n += fix(s)
    for s in L.get('test', []): n += fix(s)
    for r in (L.get('refreshers') or {}).values():
        for s in r['screens']: n += fix(s)
    return n
if __name__ == '__main__':
    tot = 0
    for f in sys.argv[1:]:
        L = json.load(open(f)); n = walk(L)
        if n: json.dump(L, open(f, 'w'), ensure_ascii=False, indent=1); tot += n; print(n, f)
    print('total', tot)
