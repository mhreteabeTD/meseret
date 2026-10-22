#!/usr/bin/env python3
"""Grade 8 Maths Unit 1, sections 1.2.1–1.4.2 and the unit review (docs/G8-MATHS-U1-DESIGN.md)."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import refs
ROOT = sys.argv[1]
OUT = os.path.join(ROOT, 'content/g8/maths/u1')
BOOK = {"title": "Mathematics Grade 8 Student Textbook", "grade": 8, "subject": "maths", "unit": 1, "unit_title": "Rational Numbers"}
G, P, E, TT = True, "practise", "exercise", "test"
def kw(en, am, d): return {"en": en, "am": am, "def": d, "machine": True}
def ex(en, am): return {"en": {"text": en}, "am": {"text": am, "machine": True}}
def lesson(sec, slug, pages, title, competency, minutes, keywords, ideas, exercises, test, notes, refreshers=None):
    lid = f"g8.maths.u1.s{slug}"; n = [0]
    def tag(s): n[0] += 1; s["id"] = f"{lid}.{n[0]}"
    for i in ideas:
        for s in i["screens"]: tag(s)
    for e in exercises:
        for s in e["items"]: tag(s)
    for s in test: tag(s)
    L = {"id": lid, "book": dict(BOOK, pages=pages, section=sec), "title": title, "competency": competency, "minutes": minutes,
         "keywords": keywords, "ideas": ideas, "exercises": exercises, "test": test, "notes": notes, "review": {"status": "validated"}, "version": 1}
    if refreshers: L["refreshers"] = refreshers
    refs.walk(L)
    json.dump(L, open(os.path.join(OUT, f"s{slug}.json"), "w"), ensure_ascii=False, indent=1)
def blank(step, ask, a, why, clue, **k): return dict({"kind": "blank", "step": step, "graded": True, "num": True, "ask": ask, "a": a, "why": why, "clue": clue}, **k)
def mcq(step, text, opts, ans, why, clue, **k): return dict({"kind": "mcq", "step": step, "graded": True, "text": text, "opts": opts, "ans": ans, "why": why, "clue": clue}, **k)
def tf(step, text, a, why, clue, **k): return dict({"kind": "tf", "step": step, "graded": True, "text": text, "a": a, "why": why, "clue": clue}, **k)
def cmp(step, a, b, ans, why, clue="Cross-multiply, or use a common denominator.", **k): return mcq(step, f"Which sign is correct? {a} ? {b}", ["<", ">", "="], ans, why, clue, **k)

REF_LCM = {"name": "Least common multiple", "screens": [
  {"kind": "steps", "step": "method", "title": "LCM of 4 and 6", "text": "List multiples until one appears in both lists.",
   "steps": ["Multiples of 4: 4, 8, 12, 16, …", "Multiples of 6: 6, 12, 18, …", "12 is the first one in both lists.", "So LCM(4, 6) = 12."]},
  mcq("check", "What is the LCM of 6 and 8?", ["24", "48", "14", "12"], "24", "Multiples of 8: 8, 16, 24. 24 is also a multiple of 6.", "List multiples of 8 and stop at the first that 6 divides.")]}
REF_EQUIV = {"name": "Equivalent fractions", "screens": [
  {"kind": "steps", "step": "method", "title": "Make 3/5 into tenths", "text": "Multiply top and bottom by the same number.",
   "steps": ["We want denominator 10.", "What times 5 gives 10? 10 ÷ 5 = 2.", "Multiply the top AND the bottom by 2, so the value does not change.", "(3 × 2)/(5 × 2) = 6/10. So 3/5 = 6/10."]},
  mcq("check", "3/4 = ?/12", ["9", "3", "6", "12"], "9", "4 × 3 = 12, so 3 × 3 = 9.", "What times 4 gives 12?")]}
REF_SIGNS = {"name": "Integer signs", "screens": [
  {"kind": "steps", "step": "method", "title": "Adding integers", "text": "Use the number line.",
   "steps": ["−9 + 5: start at −9 on the number line.", "Adding +5 means moving 5 steps right: −8, −7, −6, −5, −4.", "You land on −4.", "Same signs: add the sizes, keep the sign.", "Different signs: subtract the sizes, take the sign of the bigger size."]},
  mcq("check", "−7 + 3 = ?", ["−4", "4", "−10", "10"], "−4", "Different signs: 7 − 3 = 4, and 7 is bigger, so −4.", "Which number is further from 0?")]}
REF_MIXED = {"name": "Mixed ↔ improper", "screens": [
  {"kind": "steps", "step": "method", "title": "Change 2 5/7 to an improper fraction", "text": "Whole × denominator + numerator.",
   "steps": ["2 wholes = 2 × 7 = 14 sevenths.", "Add the 5 sevenths: 14 + 5 = 19 sevenths.", "Keep the denominator 7.", "So 2 5/7 = 19/7."]},
  mcq("check", "3 2/5 = ?", ["17/5", "6/5", "32/5", "15/5"], "17/5", "3 × 5 + 2 = 17.", "Whole × denominator + numerator.")]}
REF_PCT = {"name": "Percent to decimal", "screens": [
  {"kind": "steps", "step": "method", "title": "15% as a decimal", "text": "Percent means out of 100.",
   "steps": ["15% = 15/100.", "15 ÷ 100 = 0.15.", "So 15% = 0.15."]},
  mcq("check", "7% as a decimal is", ["0.07", "0.7", "7", "0.007"], "0.07", "7 ÷ 100 = 0.07.", "Divide by 100.")]}

# =====================================================================
# 1.2.1 Comparing rational numbers
# =====================================================================
lesson("1.2.1", "1-2-1", "14–17", "Comparing rational numbers", "Compare rational numbers using decimals, common denominators, cross-products and the number line.", 12,
  [kw("Decimal", "አስርዮሽ", "A number written with a decimal point, like 4.25."),
   kw("Place value", "የቦታ ዋጋ", "The value of a digit from its position: ones, tenths, hundredths, …"),
   kw("Equivalent fractions", "ተመጣጣኝ ክፍልፋዮች", "Fractions that mark the same point on the number line, like 1/2 and 2/4."),
   kw("LCM", "ትንሹ የጋራ ብዜት", "Least common multiple: the smallest number that two numbers both divide."),
   kw("Cross-product", "መስቀለኛ ብዜት", "To compare a/b and c/d, compare a × d with b × c."),
   kw("Number line", "የቁጥር መስመር", "A line with 0 in the middle. The number further left is smaller.")],
  [{"id": "math.compare-decimals", "name": "Comparing decimals",
    "explain": ex("To compare decimals, start from the left. Compare the integer parts. If they are equal, compare tenths, then hundredths. The first place that differs decides.",
                  "አስርዮሾችን ለማነፃፀር ከግራ ጀምር። መጀመሪያ ሙሉ ክፍሎቹን አነፃፅር። እኩል ከሆኑ አስረኛዎችን፣ ከዚያ መቶኛዎችን አነፃፅር።"),
    "screens": [
      {"kind": "guess", "step": "hook", "added": True, "title": "Cold night", "ask": "One night Debre Birhan was −2 °C and Addis Ababa was 8 °C. Which was colder?",
       "opts": ["Debre Birhan", "Addis Ababa", "The same"], "after": "−2 is left of 8 on the number line, so −2 < 8. Debre Birhan was colder."},
      {"kind": "read", "step": "read", "title": "Comparing decimals",
       "paras": ["We compare numbers every day: wins and losses, temperatures, profit and loss.", "A rational number a/b becomes a decimal when you divide a by b."],
       "note": "Compare decimals place by place from the left: integer part, then tenths, then hundredths."},
      {"kind": "steps", "step": "method", "title": "Example 1.10",
       "steps": ["4.25 and 12.33: integer parts 4 < 12, so 4.25 < 12.33.", "15.52 and 15.05: integers equal; tenths 5 > 0, so 15.52 > 15.05.", "45.667 and 45.684: tenths equal; hundredths 6 < 8, so 45.667 < 45.684."]},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Decimal", "A number written with a decimal point, like 4.25."], ["Place value", "The value of a digit from its position: ones, tenths, hundredths, …"]]},
      cmp("check", "6.7", "6.89", "<", "Integers equal; tenths 7 < 8. So 6.7 < 6.89.", "Compare the tenths.", gen={"t": "compare", "kind": "dec"}),
      cmp(P, "−3", "−5", ">", "−3 is to the right of −5.", "Which is closer to 0?", title="Activity 1.2"),
      tf(P, "6.53 < 6.053", False, "Tenths: 5 > 0, so 6.53 > 6.053.", "Compare the tenths digits.", gen={"t": "compare", "kind": "dec"})]},
   {"id": "math.compare-fractions", "name": "Comparing fractions", "requires": ["math.lcm"],
    "explain": ex("With the same denominator, the bigger numerator is bigger. With different denominators, change both to the LCM of the denominators and compare numerators. Or cross-multiply: a/b > c/d when a × d > b × c.",
                  "ተመሳሳይ ተካፋይ ሲኖር ትልቅ ላዕላይ ያለው ይበልጣል። የተለያየ ከሆነ ወደ ትንሹ የጋራ ብዜት ቀይርና ላዕላዮቹን አነፃፅር። ወይም መስቀለኛ አባዛ።"),
    "screens": [
      {"kind": "fracbar", "step": "hook", "added": True, "title": "Which is bigger, 3/5 or 1/2?",
       "bars": [{"parts": 5, "shade": [{"n": 3, "color": "a", "label": "3/5"}]}, {"parts": 2, "shade": [{"n": 1, "color": "b", "label": "1/2"}]}],
       "after": "The 3/5 bar is a little longer. So 3/5 > 1/2."},
      {"kind": "read", "step": "read", "title": "Same denominator",
       "paras": ["If the denominators are the same, the bigger numerator is the bigger number.", "Example 1.11: 15/7 > 13/7 because 15 > 13."]},
      {"kind": "read", "step": "read", "title": "Different denominators",
       "paras": ["Equivalent fractions mark the same point on the number line.", "Method 1: find the LCM of the denominators. Rewrite both fractions. Compare the numerators.", "Method 2 (cross-product): a/b < c/d when a × d < b × c."],
       "note": "a/b = (a × m)/(b × m) for any non-zero integer m."},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Equivalent fractions", "Fractions that mark the same point on the number line, like 1/2 and 2/4."], ["LCM", "The smallest number that two numbers both divide."], ["Cross-product", "To compare a/b and c/d, compare a × d with b × c."]]},
      {"kind": "steps", "step": "method", "title": "Example 1.12 a: 3/5 and 1/2", "steps": ["The denominators are 5 and 2. Their LCM is 10.", "10 ÷ 5 = 2, so multiply top and bottom of 3/5 by 2: (3 × 2)/(5 × 2) = 6/10.", "10 ÷ 2 = 5, so multiply top and bottom of 1/2 by 5: (1 × 5)/(2 × 5) = 5/10.", "Now the denominators are equal. Compare the numerators: 6 > 5.", "So 6/10 > 5/10, which means 3/5 > 1/2."]},
      cmp("check", "11/16", "7/8", "<", "7/8 = 14/16, and 11 < 14.", "Write 7/8 with denominator 16.", needs="math.lcm", gen={"t": "compare", "kind": "frac"}),
      cmp(P, "5/7", "8/3", "<", "5 × 3 = 15 and 7 × 8 = 56. 15 < 56.", "Cross-multiply.", title="Example 1.13 a", gen={"t": "compare", "kind": "frac"}),
      cmp(P, "−12/7", "6/9", "<", "A negative number is less than a positive number.", "Which one is negative?", gen={"t": "compare", "kind": "neg"}),
      blank(P, "3/5 = ___/10", ["6"], "5 × 2 = 10, so 3 × 2 = 6.", "What times 5 gives 10?", needs="math.lcm"),
      tf(P, "12/8 = 10/15", False, "12 × 15 = 180 and 8 × 10 = 80. They are not equal.", "Cross-multiply.")]},
   {"id": "math.compare-numberline", "name": "Comparing on the number line",
    "explain": ex("On a number line the number further left is smaller. Every positive number is greater than every negative number. Of two negatives, the one with the bigger absolute value is smaller.",
                  "በቁጥር መስመር ላይ በግራ ያለው ያንሳል። ማንኛውም አዎንታዊ ቁጥር ከማንኛውም አሉታዊ ቁጥር ይበልጣል። ከሁለት አሉታዊዎች ፍጹም ዋጋው የሚበልጠው ያንሳል።"),
    "screens": [
      {"kind": "numline", "step": "explore", "title": "Figure 1.13", "min": -2, "max": 2, "sub": 2,
       "points": [{"v": "-1", "label": "−1", "info": "is the smallest here: furthest left."}, {"v": "-1/2", "label": "−1/2", "info": "is less than 0 and greater than −1."}, {"v": "0", "label": "0", "info": "sits between the negatives and positives."}, {"v": "1/2", "label": "1/2", "info": "is greater than 0."}],
       "need": 3, "ask": "Tap the points from left to right."},
      {"kind": "read", "step": "read", "title": "Comparing with the number line",
       "paras": ["Of two numbers on the line, the one on the left is smaller."],
       "table": [["Fact", "Example"], ["Every positive number is greater than 0.", "1/2 > 0"], ["Every negative number is less than 0.", "−1/2 < 0"], ["Positives are greater than negatives.", "1/2 > −1"], ["Of two negatives, the bigger absolute value is smaller.", "−45 < −23"]]},
      {"kind": "name", "step": "name", "title": "Left is smaller", "defs": [["Number line", "A line with 0 in the middle. The number further left is smaller."]]},
      mcq("check", "Which is smaller, −45 or −23?", ["−45", "−23"], "−45", "|−45| > |−23|, so −45 is further left.", "Which is further from 0?"),
      mcq(P, "Exercise 1.4 Q3 e: which is to the left on the number line?", ["−1/3", "−1.5"], "−1.5", "−1.5 < −1/3 because 1.5 > 1/3.", "Which is further from 0?"),
      tf(P, "|−3/5| < 3/5", False, "|−3/5| = 3/5. They are equal.", "Find |−3/5| first.")]}],
  [{"book_name": "Exercise 1.4", "items": [
      tf(E, "Q1 a: −0.15 < 1.5", True, "A negative is less than a positive.", "Which one is negative?"),
      tf(E, "Q1 b: 23/5 > 32/5", False, "Same denominator: 23 < 32.", "Compare the numerators."),
      tf(E, "Q1 e: 3 5/7 > 21/6", True, "3 5/7 ≈ 3.71 and 21/6 = 3.5.", "Change both to decimals."),
      tf(E, "Q1 h: 3 4/7 = 25/7", True, "3 × 7 + 4 = 25.", "Change the mixed number to an improper fraction."),
      cmp(E, "−21/12", "−28/16", "=", "Both equal −7/4.", "Simplify both fractions."),
      cmp(E, "8/20", "0.35", ">", "8/20 = 0.4 and 0.4 > 0.35.", "Change 8/20 to a decimal.")]}],
  [cmp(TT, "3/4", "5/7", ">", "3 × 7 = 21 and 4 × 5 = 20.", "", gen={"t": "compare", "kind": "frac"}),
   cmp(TT, "4.07", "4.7", "<", "Tenths: 0 < 7.", "", gen={"t": "compare", "kind": "dec"}),
   cmp(TT, "−2/3", "−3/4", ">", "|−2/3| < |−3/4|, so −2/3 is to the right.", "", gen={"t": "compare", "kind": "neg"})],
  [{"kind": "correction", "text": "The book's equivalent-fractions note says m is a rational number different from 0; m must be a non-zero integer for a/b = (a × m)/(b × m) to stay a fraction of integers. Shown as an integer here."},
   {"kind": "review", "text": "Exercise 1.4 Q2 is printed ambiguously. Read as: a 15/9 ? 18/9, b −21/12 ? −28/16, c 8/20 ? 0.35, d 3 5/6 ? 3 7/8, e |−3/10| ? 3/10, f 12/13 ? 13/9. Teacher to confirm."},
   {"kind": "note", "text": "Exercise 1.4 Q4 (letters on a number line, Figure 1.14) needs the figure; left out."}],
  {"math.lcm": REF_LCM})

# =====================================================================
# 1.2.2 Ordering rational numbers
# =====================================================================
lesson("1.2.2", "1-2-2", "18–19", "Ordering rational numbers", "Write rational numbers in ascending or descending order.", 8,
  [kw("Ascending order", "ከትንሽ ወደ ትልቅ ቅደም ተከተል", "From the smallest to the largest."),
   kw("Descending order", "ከትልቅ ወደ ትንሽ ቅደም ተከተል", "From the largest to the smallest.")],
  [{"id": "math.order-rationals", "name": "Ordering", "requires": ["math.lcm"],
    "explain": ex("To order rational numbers, put them in the same form first: all with one common denominator, or all as decimals. Then line them up from smallest to largest (ascending) or largest to smallest (descending).",
                  "ሬሽናል ቁጥሮችን ለመደርደር መጀመሪያ በአንድ ዓይነት መልክ አስቀምጣቸው፤ በጋራ ተካፋይ ወይም በአስርዮሽ። ከዚያ ከትንሽ ወደ ትልቅ ወይም ከትልቅ ወደ ትንሽ ደርድራቸው።"),
    "screens": [
      {"kind": "guess", "step": "hook", "title": "Exercise 1.5 Q3: Samuel's plants",
       "text": "Differences from the average growth: Rahel 3 1/4 cm, Kassa −2.2 cm, Alemitu 1.7 cm, Munir −1 7/10 cm.",
       "ask": "Whose plant grew the most?", "opts": ["Rahel", "Kassa", "Alemitu", "Munir"], "after": "Rahel: 3 1/4 = 3.25 is the largest difference."},
      {"kind": "read", "step": "read", "title": "Ordering rational numbers",
       "paras": ["Ordering means writing numbers in ascending or descending order.", "It is like ordering distances in miles and kilometres: use one unit first.", "For fractions, use one common denominator or change them to decimals."]},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Ascending order", "From the smallest to the largest."], ["Descending order", "From the largest to the smallest."]]},
      {"kind": "order", "step": "check", "graded": True, "title": "Example 1.14 i a: ascending", "items": ["−45", "−25", "18", "28", "30"], "why": "−45 < −25 < 18 < 28 < 30.", "clue": "Negatives first; the bigger negative size is smaller."},
      {"kind": "steps", "step": "method", "title": "Example 1.14 i b: 3/5, 4/9, 7/3, 5/6, 11/18",
       "steps": ["The denominators are 5, 9, 3, 6 and 18. Their LCM is 90.", "3/5 = (3 × 18)/(5 × 18) = 54/90, because 90 ÷ 5 = 18.", "4/9 = (4 × 10)/(9 × 10) = 40/90, because 90 ÷ 9 = 10.", "7/3 = (7 × 30)/(3 × 30) = 210/90, because 90 ÷ 3 = 30.", "5/6 = (5 × 15)/(6 × 15) = 75/90, because 90 ÷ 6 = 15.", "11/18 = (11 × 5)/(18 × 5) = 55/90, because 90 ÷ 18 = 5.", "Order the numerators: 40 < 54 < 55 < 75 < 210.", "So 4/9 < 3/5 < 11/18 < 5/6 < 7/3."]},
      {"kind": "order", "step": P, "graded": True, "title": "Decimals, ascending", "items": ["1.5", "1.53", "2.05", "2.5", "3.21"], "why": "1.5 < 1.53 < 2.05 < 2.5 < 3.21.", "clue": "Compare place by place.", "gen": {"t": "order", "desc": False}},
      {"kind": "order", "step": P, "graded": True, "title": "Descending", "items": ["45", "32", "−15", "−23"], "why": "45 > 32 > −15 > −23.", "clue": "Largest first.", "gen": {"t": "order", "desc": True}},
      {"kind": "order", "step": P, "graded": True, "title": "Samuel's plants: lowest to highest", "items": ["−2.2", "−1 7/10", "1.7", "3 1/4"], "why": "−2.2 < −1.7 < 1.7 < 3.25.", "clue": "Change them to decimals.", "gen": {"t": "order", "desc": False}}]}],
  [{"book_name": "Exercise 1.5", "items": [
      {"kind": "order", "step": E, "graded": True, "title": "Q1 b: ascending", "items": ["−12.51", "5.24", "6.75", "8.13", "12.42"], "why": "Negative first, then by integer part.", "clue": "Smallest first."},
      {"kind": "order", "step": E, "graded": True, "title": "Q1 a: ascending", "items": ["−5 2/3", "3/25", "4/9", "23/15", "11/7"], "why": "−5.67 < 0.12 < 0.44 < 1.53 < 1.57.", "clue": "Change them to decimals."},
      {"kind": "order", "step": E, "graded": True, "title": "Q2 a: descending", "items": ["23.86", "15.02", "13.72", "13.05"], "why": "Largest first.", "clue": "Compare integer parts, then tenths."},
      {"kind": "order", "step": E, "graded": True, "title": "Q2 c: descending", "items": ["4.23", "3 5/6", "3.75", "18/5", "3.21"], "why": "4.23 > 3.83 > 3.75 > 3.6 > 3.21.", "clue": "Change them to decimals."},
      mcq(E, "Q3 a: whose plant grew the most?", ["Rahel", "Kassa", "Alemitu", "Munir"], "Rahel", "3 1/4 is the largest difference.", "Look for the biggest number."),
      {"kind": "order", "step": E, "graded": True, "title": "Q3 b: lowest to highest", "items": ["−2.2", "−1 7/10", "1.7", "3 1/4"], "why": "−2.2 < −1.7 < 1.7 < 3.25.", "clue": "Change them to decimals."}]}],
  [{"kind": "order", "step": TT, "graded": True, "title": "Ascending", "items": ["−1/2", "1/3", "0.5", "3/4"], "why": "−0.5 < 0.33 < 0.5 < 0.75.", "clue": "", "gen": {"t": "order", "desc": False}},
   {"kind": "order", "step": TT, "graded": True, "title": "Descending", "items": ["2.5", "2 1/4", "−1", "−1.5"], "why": "2.5 > 2.25 > −1 > −1.5.", "clue": "", "gen": {"t": "order", "desc": True}},
   mcq(TT, "Which is the smallest: 3/4, 0.7, 5/8?", ["3/4", "0.7", "5/8"], "5/8", "5/8 = 0.625.", "")],
  [{"kind": "note", "text": "Exercise 1.5 Q1 c and Q2 b are long mixed lists; Q2 c and the plant table are used instead. All orders were computed exactly."}],
  {"math.lcm": REF_LCM})

# =====================================================================
# 1.3.1 Addition of rational numbers
# =====================================================================
lesson("1.3.1", "1-3-1", "20–25", "Addition of rational numbers", "Add rational numbers and use the properties of addition.", 14,
  [kw("Sum", "ድምር", "The answer to an addition."), kw("Addend", "ተደማሪ", "A number being added."),
   kw("Common denominator", "የጋራ ተካፋይ", "A denominator shared by two or more fractions."),
   kw("Commutative property", "የመለዋወጥ ባሕሪ", "Changing the order does not change the answer: a + b = b + a."),
   kw("Associative property", "የመቧደን ባሕሪ", "Changing the grouping does not change the answer: (a + b) + c = a + (b + c).")],
  [{"id": "math.add-same-denominator", "name": "Same denominators",
    "explain": ex("To add fractions with the same denominator, add the numerators and keep the denominator. 5/8 + 2/8 = 7/8. On a number line, adding a positive moves right and adding a negative moves left.",
                  "ተመሳሳይ ተካፋይ ያላቸውን ክፍልፋዮች ለመደመር ላዕላዮቹን ደምርና ተካፋዩን አቆይ። 5/8 + 2/8 = 7/8።"),
    "screens": [
      {"kind": "numline", "step": "hook", "title": "Activity 1.3: 6 + (−3)", "min": -1, "max": 8, "hops": [{"from": 0, "by": 6}, {"from": 6, "by": -3}],
       "ask": "Tap Hop twice. Where do you land?", "after": "6 + (−3) = 3. Adding a negative number moves left."},
      {"kind": "numline", "step": "explore", "title": "Activity 1.3: −9 + 5", "min": -10, "max": 1, "hops": [{"from": 0, "by": -9}, {"from": -9, "by": 5}],
       "ask": "Now −9 + 5.", "after": "−9 + 5 = −4."},
      {"kind": "fracbar", "step": "explore", "title": "Example 1.19: 5/8 + 2/8",
       "bars": [{"parts": 8, "shade": [{"n": 5, "color": "a", "label": "5/8"}, {"n": 2, "color": "b", "label": "+ 2/8"}]}], "after": "7 of 8 parts are shaded: 5/8 + 2/8 = 7/8."},
      {"kind": "read", "step": "read", "title": "Same denominators", "paras": ["To add fractions with the same denominator, add the numerators.", "Write the sum over the common denominator: a/b + c/b = (a + c)/b."]},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Sum", "The answer to an addition."], ["Addend", "A number being added."]]},
      blank("check", "3/5 + 6/5 = ___", ["9/5", "1 4/5", "1.8"], "Same denominator: add the numerators. (3 + 6)/5 = 9/5.", "Add the numerators.", gen={"t": "op", "op": "add", "same": True}),
      blank(P, "−3/4 + 11/4 = ___", ["2"], "Same denominator: (−3 + 11)/4 = 8/4. 8 ÷ 4 = 2.", "Add the numerators.", worked="−3 + 11 = 8, and 8/4 = 2.", gen={"t": "op", "op": "add", "same": True, "signs": True}),
      blank(P, "8/7 + 5/7 + 6/7 = ___", ["19/7", "2 5/7"], "(8 + 5 + 6)/7 = 19/7.", "Add all the numerators.")]},
   {"id": "math.add-different-denominator", "name": "Different denominators", "requires": ["math.lcm"],
    "explain": ex("When denominators differ, find their LCM. Rewrite each fraction with the LCM as the denominator. Then add the numerators. Always reduce the answer.",
                  "ተካፋዮቹ የተለያዩ ሲሆኑ ትንሹን የጋራ ብዜት ፈልግ። እያንዳንዱን ክፍልፋይ በዚያ ተካፋይ ጻፍ። ከዚያ ላዕላዮቹን ደምር።"),
    "screens": [
      {"kind": "fracbar", "step": "hook", "title": "Example 1.20: 1/6 + 1/2",
       "bars": [{"parts": 6, "shade": [{"n": 1, "color": "a", "label": "1/6"}, {"n": 3, "color": "b", "label": "+ 1/2 = 3/6"}]}], "after": "1/2 = (1 × 3)/(2 × 3) = 3/6, so 1/6 + 3/6 = 4/6. Divide top and bottom by 2: 4/6 = 2/3."},
      {"kind": "read", "step": "read", "title": "Different denominators",
       "table": [["Step", "Do this"], ["I", "Make all denominators positive."], ["II", "Find the LCM of the denominators."], ["III", "Write equivalent fractions with that denominator."], ["IV", "Add the numerators; keep the denominator."]],
       "paras": ["Example 1.16: 3/7 + 5/4 = 12/28 + 35/28 = 47/28."], "note": "Always reduce your final answer to its lowest terms."},
      {"kind": "name", "step": "name", "title": "Common denominator", "defs": [["Common denominator", "A denominator shared by two or more fractions."]]},
      mcq("check", "The LCM of 9, 6 and 4 is", ["18", "36", "72", "216"], "36", "36 is the smallest number that 9, 6 and 4 all divide.", "List multiples of 9.", needs="math.lcm"),
      blank(P, "5/6 + 3/8 = ___", ["29/24", "1 5/24"], "LCM of 6 and 8 is 24. 5/6 = (5 × 4)/(6 × 4) = 20/24 and 3/8 = (3 × 3)/(8 × 3) = 9/24. 20/24 + 9/24 = 29/24.", "Find the LCM of 6 and 8.", worked="LCM of 6 and 8 is 24. 24 ÷ 6 = 4, so 5/6 = (5 × 4)/(6 × 4) = 20/24. 24 ÷ 8 = 3, so 3/8 = (3 × 3)/(8 × 3) = 9/24. 20 + 9 = 29, so the sum is 29/24.", gen={"t": "op", "op": "add"}),
      blank(P, "11/9 + 5/6 + 3/4 = ___", ["101/36", "2 29/36"], "LCM of 9, 6 and 4 is 36. 11/9 = (11 × 4)/(9 × 4) = 44/36; 5/6 = (5 × 6)/(6 × 6) = 30/36; 3/4 = (3 × 9)/(4 × 9) = 27/36. 44 + 30 + 27 = 101, so 101/36.", "Find the LCM of 9, 6 and 4.", gen={"t": "op", "op": "add", "mixed": True})]},
   {"id": "math.add-sign-rules", "name": "Adding with signs", "requires": ["math.integer-signs"],
    "explain": ex("Both negative: add the absolute values and keep the minus sign. Different signs: subtract the smaller absolute value from the bigger, and take the sign of the number with the bigger absolute value.",
                  "ሁለቱም አሉታዊ ከሆኑ ፍጹም ዋጋዎቻቸውን ደምርና የመቀነስ ምልክቱን አቆይ። ምልክታቸው የተለያየ ከሆነ ትንሹን ፍጹም ዋጋ ከትልቁ ቀንስና የትልቁን ምልክት ውሰድ።"),
    "screens": [
      {"kind": "guess", "step": "hook", "added": True, "title": "Debts", "ask": "Abebe owes 8 Birr. Then he owes 11 Birr more. Is the total a debt or a gain?",
       "opts": ["A debt of 19 Birr", "A gain of 19 Birr", "A debt of 3 Birr"], "after": "−8 + (−11) = −19. Two negatives give a bigger negative."},
      {"kind": "read", "step": "read", "title": "Rule 1: both negative", "table": [["Step", "Do this"], ["i", "The sign is negative (−)."], ["ii", "Add the absolute values."], ["iii", "Put − in front of the sum."]], "paras": ["Example 1.17: −8/6 + (−11/8) = −65/24."]},
      {"kind": "read", "step": "read", "title": "Rule 2: different signs", "paras": ["Example 1.18 b: −5/6 + 3/4 = −1/12."], "table": [["Step", "Do this"], ["i", "Take the sign of the number with the bigger absolute value."], ["ii", "Subtract the smaller absolute value from the bigger."], ["iii", "Put that sign in front."]]},
      {"kind": "name", "step": "name", "title": "Addend", "defs": [["Addend", "A number being added."]]},
      mcq("check", "−5/6 + 3/4: the sign of the answer is", ["+", "−", "0"], "−", "|−5/6| = 10/12 is bigger than |3/4| = 9/12.", "Which number is further from 0?", needs="math.integer-signs"),
      {"kind": "steps", "step": "method", "title": "Example 1.18 a: −9/4 + 5/4", "steps": ["The signs are different, so use Rule 2.", "Absolute values: |−9/4| = 9/4 and |5/4| = 5/4.", "9/4 is bigger, so the answer takes its sign: −.", "Subtract the sizes: 9/4 − 5/4 = (9 − 5)/4 = 4/4.", "4/4 = 1, so the answer is −1."]},
      blank(P, "−5/6 + 3/4 = ___", ["-1/12"], "|−5/6| = (5 × 2)/(6 × 2) = 10/12 and |3/4| = (3 × 3)/(4 × 3) = 9/12. 10/12 is bigger, so the sign is −. 10/12 − 9/12 = 1/12. Answer −1/12.", "Decide the sign first.", input="signed", gen={"t": "op", "op": "add", "signs": True}),
      blank(P, "−8/6 + (−11/8) = ___", ["-65/24", "-2 17/24"], "Both negative, so the answer is negative. 8/6 = (8 × 4)/(6 × 4) = 32/24 and 11/8 = (11 × 3)/(8 × 3) = 33/24. 32/24 + 33/24 = 65/24, so −65/24.", "Both negative: add the sizes.", input="signed", worked="Both are negative, so the answer is negative. LCM of 6 and 8 is 24. 8/6 = (8 × 4)/(6 × 4) = 32/24 and 11/8 = (11 × 3)/(8 × 3) = 33/24. 32 + 33 = 65. Answer −65/24.", gen={"t": "op", "op": "add", "signs": True})]},
   {"id": "math.addition-properties", "name": "Properties of addition",
    "explain": ex("Addition is commutative: the order does not matter. It is associative: the grouping does not matter. Adding 0 changes nothing. A number plus its opposite is 0.",
                  "መደመር የመለዋወጥ ባሕሪ አለው፤ ቅደም ተከተሉ ለውጥ አያመጣም። የመቧደን ባሕሪም አለው። 0 መደመር ምንም አይለውጥም። ቁጥርና ተቃራኒው ሲደመሩ 0 ይሆናል።"),
    "screens": [
      {"kind": "guess", "step": "hook", "added": True, "title": "Does order matter?", "ask": "Is 1/3 + 3/5 the same as 3/5 + 1/3?", "opts": ["Yes", "No"], "after": "Yes. Both are 14/15. The order of adding does not matter."},
      {"kind": "read", "step": "read", "title": "Properties of addition", "paras": ["For any rational numbers a, b and c:"],
       "table": [["Property", "Rule"], ["Commutative", "a + b = b + a"], ["Associative", "a + (b + c) = (a + b) + c"], ["Property of 0", "a + 0 = a = 0 + a"], ["Opposites", "a + (−a) = 0"]]},
      {"kind": "steps", "step": "method", "title": "Example 1.21: 1/3 + 3/5 + 7/6", "steps": ["Way 1: add the first two first: 1/3 + 3/5.", "LCM of 3 and 5 is 15: 1/3 = (1 × 5)/(3 × 5) = 5/15 and 3/5 = (3 × 3)/(5 × 3) = 9/15.", "5/15 + 9/15 = 14/15.", "Now 14/15 + 7/6. LCM of 15 and 6 is 30: 14/15 = (14 × 2)/(15 × 2) = 28/30 and 7/6 = (7 × 5)/(6 × 5) = 35/30.", "28/30 + 35/30 = 63/30.", "Way 2: add the last two first: 3/5 + 7/6. LCM 30: (3 × 6)/(5 × 6) = 18/30 and (7 × 5)/(6 × 5) = 35/30, so 53/30.", "Now 1/3 + 53/30. 1/3 = (1 × 10)/(3 × 10) = 10/30. 10/30 + 53/30 = 63/30.", "Both ways give 63/30. Divide top and bottom by 3 (their GCF): 63/30 = 21/10."]},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Commutative property", "Changing the order does not change the answer: a + b = b + a."], ["Associative property", "Changing the grouping does not change the answer."]]},
      {"kind": "match", "step": "check", "graded": True, "title": "Match the property", "pairs": [["Commutative", "a + b = b + a"], ["Associative", "a + (b + c) = (a + b) + c"], ["Property of 0", "a + 0 = a"], ["Opposites", "a + (−a) = 0"]], "why": "These are the four properties of addition.", "clue": "Order, grouping, zero, opposite."},
      blank(P, "3/5 + 2 3/5 = ___", ["16/5", "3 1/5", "3.2"], "2 3/5 = (2 × 5 + 3)/5 = 13/5. Then 3/5 + 13/5 = (3 + 13)/5 = 16/5.", "Change 2 3/5 to an improper fraction.", gen={"t": "op", "op": "add", "mixed": True}),
      tf(P, "7/9 + (−7/9) = 0", True, "A number plus its opposite is 0.", "Are they opposites?"),
      blank(P, "Exercise 1.6 Q2: Monday was 23.72 °C. Thursday was 3.23 °C more. Thursday = ___ °C", ["26.95"], "23.72 + 3.23 = 26.95.", "Add the decimals.", gen={"t": "op", "op": "add", "word": True})]}],
  [{"book_name": "Exercise 1.6", "items": [
      blank(E, "Q1 a: 13/5 + 21/5 = ___", ["34/5", "6 4/5", "6.8"], "(13 + 21)/5 = 34/5.", "Same denominator."),
      blank(E, "Q1 b: 5/6 + 3/8 = ___", ["29/24", "1 5/24"], "20/24 + 9/24 = 29/24.", "LCM of 6 and 8 is 24."),
      blank(E, "Q1 c: 3/5 + 2 3/5 = ___", ["16/5", "3 1/5", "3.2"], "2 3/5 = (2 × 5 + 3)/5 = 13/5. Then 3/5 + 13/5 = (3 + 13)/5 = 16/5.", "Change the mixed number first."),
      blank(E, "Q1 d: 2 1/3 + 3/8 + 3 5/6 = ___", ["157/24", "6 13/24"], "56/24 + 9/24 + 92/24 = 157/24.", "LCM of 3, 8 and 6 is 24."),
      blank(E, "Q1 e: |−2/5 + 3/8| + |4/7 + 2/7| = ___", ["247/280"], "|−1/40| + 6/7 = 1/40 + 6/7 = 247/280.", "Work inside each pair of bars first."),
      blank(E, "Q2: Monday 23.72 °C; Thursday 3.23 °C more. Thursday = ___ °C", ["26.95"], "23.72 + 3.23 = 26.95.", "Add.")]}],
  [blank(TT, "2/3 + 1/4 = ___", ["11/12"], "8/12 + 3/12.", "", gen={"t": "op", "op": "add"}),
   blank(TT, "−7/10 + 1/5 = ___", ["-1/2", "-0.5"], "−7/10 + 2/10 = −5/10.", "", gen={"t": "op", "op": "add", "signs": True}),
   blank(TT, "1 1/2 + 2 2/3 = ___", ["25/6", "4 1/6"], "3/2 + 8/3 = 9/6 + 16/6.", "", gen={"t": "op", "op": "add", "mixed": True})],
  [{"kind": "note", "text": "Activity 1.3 c and d (2 + (−4), 6 + (−6)) are the same idea as a and b; a and b are shown as number-line hops."},
   {"kind": "note", "text": "Example 1.17 result −65/24 checked: 8/6 = 32/24, 11/8 = 33/24."}],
  {"math.lcm": REF_LCM, "math.integer-signs": REF_SIGNS})

# =====================================================================
# 1.3.2 Subtraction of rational numbers
# =====================================================================
lesson("1.3.2", "1-3-2", "26–28", "Subtraction of rational numbers", "Subtract rational numbers by adding the opposite.", 10,
  [kw("Difference", "ልዩነት", "The answer to a subtraction."), kw("Inverse operation", "ተቃራኒ ስሌት", "An operation that undoes another one. Subtraction undoes addition.")],
  [{"id": "math.subtract-rationals", "name": "Subtracting", "requires": ["math.lcm"],
    "explain": ex("Subtracting a number is the same as adding its opposite: a/b − c/d = a/b + (−c/d). Then use the addition rules. Subtraction is not commutative: 3 − 5 is not 5 − 3.",
                  "ቁጥርን መቀነስ ተቃራኒውን ከመደመር ጋር አንድ ነው። ከዚያ የመደመር ሕጎችን ተጠቀም። መቀነስ የመለዋወጥ ባሕሪ የለውም።"),
    "screens": [
      {"kind": "guess", "step": "hook", "title": "Activity 1.4", "ask": "Can 7/9 − 4/3 be written as an addition?", "opts": ["7/9 + 4/3", "7/9 + (−4/3)", "−7/9 + 4/3", "No"],
       "after": "Yes: subtracting 4/3 means adding −4/3."},
      {"kind": "fracbar", "step": "explore", "title": "Example 1.23: 7/9 − 2/3",
       "bars": [{"parts": 9, "shade": [{"n": 7, "color": "a", "label": "7/9"}], "mark": {"n": 6, "label": "cross out 6/9 = 2/3"}}], "after": "One shaded part is left: 7/9 − 2/3 = 1/9."},
      {"kind": "read", "step": "read", "title": "Subtraction", "paras": ["Subtraction is the inverse of addition.", "Subtracting c/d from a/b means adding the negative of c/d: a/b − c/d = a/b + (−c/d)."],
       "note": "The difference of two rational numbers is always a rational number."},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Difference", "The answer to a subtraction."], ["Inverse operation", "An operation that undoes another one. Subtraction undoes addition."]]},
      {"kind": "steps", "step": "method", "title": "Example 1.22 a: 7/9 − 4/3", "steps": ["Subtracting 4/3 means adding its opposite: 7/9 − 4/3 = 7/9 + (−4/3).", "The denominators are 9 and 3. Their LCM is 9.", "9 ÷ 3 = 3, so multiply top and bottom of −4/3 by 3: (−4 × 3)/(3 × 3) = −12/9.", "Now add: 7/9 + (−12/9) = (7 − 12)/9.", "7 − 12 = −5, so the answer is −5/9."]},
      mcq("check", "Activity 1.4 Q2: is 3/7 − 5/9 the same as 5/9 − 3/7?", ["Yes", "No"], "No", "One is −8/63 and the other is 8/63. Subtraction is not commutative.", "Try 3 − 5 and 5 − 3."),
      blank(P, "3/7 − (−5/9) = ___", ["62/63"], "Subtracting −5/9 means adding 5/9. LCM of 7 and 9 is 63: 3/7 = (3 × 9)/(7 × 9) = 27/63 and 5/9 = (5 × 7)/(9 × 7) = 35/63. 27 + 35 = 62, so 62/63.", "Subtracting a negative means adding.", gen={"t": "op", "op": "sub", "signs": True}),
      blank(P, "−1/12 − 9/8 = ___", ["-29/24", "-1 5/24"], "LCM of 12 and 8 is 24. −1/12 = (−1 × 2)/(12 × 2) = −2/24 and 9/8 = (9 × 3)/(8 × 3) = 27/24. −2/24 − 27/24 = −29/24.", "Add the opposite of 9/8.", input="signed", worked="Subtracting 9/8 means adding −9/8. LCM of 12 and 8 is 24. −1/12 = (−1 × 2)/(12 × 2) = −2/24. −9/8 = (−9 × 3)/(8 × 3) = −27/24. −2 + (−27) = −29, so −29/24.", gen={"t": "op", "op": "sub", "signs": True}),
      blank(P, "Exercise 1.7 Q3: a rope is 23 m. Pieces of 12/7 m and 7/4 m are cut off. Left = ___ m", ["547/28", "19 15/28", "≈19.54"], "LCM of 7 and 4 is 28. 23 = (23 × 28)/28 = 644/28; 12/7 = (12 × 4)/(7 × 4) = 48/28; 7/4 = (7 × 7)/(4 × 7) = 49/28. 644 − 48 − 49 = 547, so 547/28 m.", "LCM of 7 and 4 is 28.",
            worked="LCM of 7 and 4 is 28. 23 = 644/28 (23 × 28 = 644). 12/7 = (12 × 4)/(7 × 4) = 48/28. 7/4 = (7 × 7)/(4 × 7) = 49/28. 644 − 48 − 49 = 547. Left: 547/28 m ≈ 19.54 m.", gen={"t": "op", "op": "sub", "word": True})]}],
  [{"book_name": "Exercise 1.7", "items": [
      blank(E, "Q1 a: 4 5/6 − 2 3/4 = ___", ["25/12", "2 1/12"], "4 5/6 = (4 × 6 + 5)/6 = 29/6 and 2 3/4 = (2 × 4 + 3)/4 = 11/4. LCM 12: 29/6 = (29 × 2)/(6 × 2) = 58/12 and 11/4 = (11 × 3)/(4 × 3) = 33/12. 58 − 33 = 25, so 25/12.", "Change to improper fractions."),
      blank(E, "Q1 b: −5.3 − 3.45 = ___", ["-8.75"], "−5.3 + (−3.45) = −8.75.", "Both negative: add the sizes."),
      blank(E, "Q1 c: 6/13 − |−7/13| = ___", ["-1/13"], "6/13 − 7/13 = −1/13.", "|−7/13| = 7/13."),
      blank(E, "Q1 d: |−5/7| − |3/4| = ___", ["-1/28"], "|−5/7| = 5/7 and |3/4| = 3/4. LCM 28: 5/7 = (5 × 4)/(7 × 4) = 20/28 and 3/4 = (3 × 7)/(4 × 7) = 21/28. 20 − 21 = −1, so −1/28.", "LCM of 7 and 4 is 28."),
      blank(E, "Q2 a: y − (2/7 + 5) when y = 9/4: ___", ["-85/28", "-3 1/28"], "2/7 + 5 = 2/7 + 35/7 = 37/7. LCM of 4 and 7 is 28: 9/4 = (9 × 7)/(4 × 7) = 63/28 and 37/7 = (37 × 4)/(7 × 4) = 148/28. 63 − 148 = −85, so −85/28.", "2/7 + 5 = 37/7."),
      blank(E, "Q4: a basket of 58/3 kg has 18/7 kg apples and 11/9 kg oranges. Bananas = ___ kg", ["979/63", "15 34/63", "≈15.54"], "LCM of 3, 7 and 9 is 63. 58/3 = (58 × 21)/(3 × 21) = 1218/63; 18/7 = (18 × 9)/(7 × 9) = 162/63; 11/9 = (11 × 7)/(9 × 7) = 77/63. 1218 − 162 − 77 = 979, so 979/63 kg.", "LCM of 3, 7 and 9 is 63.")]}],
  [blank(TT, "5/6 − 1/4 = ___", ["7/12"], "10/12 − 3/12.", "", gen={"t": "op", "op": "sub"}),
   blank(TT, "−2/3 − 1/6 = ___", ["-5/6"], "−4/6 − 1/6.", "", gen={"t": "op", "op": "sub", "signs": True}),
   tf(TT, "Subtraction of rational numbers is commutative.", False, "3 − 5 ≠ 5 − 3.", "")],
  [{"kind": "note", "text": "Exercise 1.7 answers computed exactly: Q1 e −64.48, Q1 f −204/35, Q2 b 202/9 are left out of the item set for length."}],
  {"math.lcm": REF_LCM})

# =====================================================================
# 1.3.3 Multiplication
# =====================================================================
lesson("1.3.3", "1-3-3", "28–32", "Multiplication of rational numbers", "Multiply rational numbers and use the properties of multiplication.", 14,
  [kw("Product", "ብዜት", "The answer to a multiplication."), kw("Factor", "አባዢ", "A number being multiplied."),
   kw("Lowest terms", "ቀላሉ መልክ", "A fraction whose top and bottom share no common factor except 1."),
   kw("Distributive property", "የማከፋፈል ባሕሪ", "a × (b + c) = a × b + a × c.")],
  [{"id": "math.multiply-rationals", "name": "Multiplying fractions", "requires": ["math.mixed-improper"],
    "explain": ex("To multiply fractions, multiply the numerators and multiply the denominators. Then reduce. Change mixed numbers to improper fractions first. On a grid, 3/4 × 1/2 is the part shaded twice.",
                  "ክፍልፋዮችን ለማባዛት ላዕላዮቹን አባዛ፣ ተካፋዮቹንም አባዛ። ከዚያ አቅልል። ድብልቅ ቁጥሮችን መጀመሪያ ወደ ኢ-ትክክለኛ ቀይር።"),
    "screens": [
      {"kind": "guess", "step": "hook", "added": True, "title": "Half of three-quarters", "ask": "You eat half of 3/4 of an injera. How much of the injera is that?", "opts": ["3/8", "1/4", "3/4", "1/2"], "after": "Half of 3/4 is 3/8. Check it on the grid below."},
      {"kind": "grid", "step": "explore", "title": "Example 1.25 grid model: 1/2 × 3/4", "cols": 2, "rows": 4, "shadeCols": 1, "shadeRows": 3,
       "intro": "The square is 1 whole. Tap Next step.",
       "say": ["Cut the square into 2 equal columns. Shade 1 column (blue). That is 1/2 of the square.", "Now cut it into 4 equal rows. Shade 3 rows (yellow). That is 3/4 of the square.", "The square now has 2 × 4 = 8 equal boxes. 3 boxes are shaded with both colours. So 3/4 of 1/2 is 3/8: 3/4 × 1/2 = 3/8."]},
      {"kind": "read", "step": "read", "title": "Multiplying", "paras": ["Multiply the numerator by the numerator. Multiply the denominator by the denominator.", "Then reduce the answer to its lowest terms."]},
      {"kind": "steps", "step": "method", "title": "Example 1.25", "steps": ["a) 3/2 × 7/8: multiply the tops, 3 × 7 = 21, and the bottoms, 2 × 8 = 16.", "So 3/2 × 7/8 = 21/16. 21 and 16 share no factor, so it is already in lowest terms.", "b) −5/6 × 4/3: the signs are different, so the product is negative.", "Multiply: 5 × 4 = 20 and 6 × 3 = 18. That gives −20/18.", "Simplify: 20 and 18 are both divisible by 2 (their GCF).", "20 ÷ 2 = 10 and 18 ÷ 2 = 9, so −20/18 = −10/9."]},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Product", "The answer to a multiplication."], ["Factor", "A number being multiplied."], ["Lowest terms", "Top and bottom share no common factor except 1."]]},
      blank("check", "Activity 1.5 a: 5/7 × 8/11 = ___", ["40/77"], "(5 × 8)/(7 × 11) = 40/77.", "Multiply tops, then bottoms.", gen={"t": "op", "op": "mul"}),
      blank(P, "5/8 × 3/4 = ___", ["15/32"], "15/32.", "Multiply tops, then bottoms.", gen={"t": "op", "op": "mul"}),
      blank(P, "3 2/5 × 2 4/7 = ___", ["306/35", "8 26/35"], "3 2/5 = (3 × 5 + 2)/5 = 17/5 and 2 4/7 = (2 × 7 + 4)/7 = 18/7. 17 × 18 = 306 and 5 × 7 = 35, so 306/35.", "Change the mixed numbers first.", needs="math.mixed-improper", worked="3 2/5 = 17/5 and 2 4/7 = 18/7. 17 × 18 = 306 and 5 × 7 = 35.", gen={"t": "op", "op": "mul", "mixed": True}),
      {"kind": "fracbar", "step": P, "graded": True, "title": "Exercise 1.8 Q3 (grid as a bar): 1/3 × 2/5", "parts": 15, "need": 2, "ask": "1/3 of 2/5 is how many fifteenths? Shade that many parts.", "why": "1/3 × 2/5 = 2/15: 2 of 15 parts.", "clue": "Multiply the tops and the bottoms."}]},
   {"id": "math.multiply-sign-rules", "name": "Signs in multiplication",
    "explain": ex("Same signs give a positive product. Different signs give a negative product. Any number times 0 is 0. With many factors, an even number of negatives gives a positive answer; an odd number gives a negative answer.",
                  "ተመሳሳይ ምልክት አዎንታዊ ብዜት ይሰጣል። የተለያየ ምልክት አሉታዊ ብዜት ይሰጣል። ማንኛውም ቁጥር ከ0 ጋር ሲባዛ 0 ይሆናል።"),
    "screens": [
      {"kind": "sort", "step": "hook", "graded": False, "title": "Predict the sign", "bins": ["Positive", "Negative", "Zero"],
       "items": [["2/3 × 5/11", "Positive", "Both positive."], ["(−5/4) × (−7/3)", "Positive", "Both negative."], ["−3 × 5", "Negative", "Different signs."], ["−7/9 × 0", "Zero", "A factor is 0."]]},
      {"kind": "read", "step": "read", "title": "Table 1.1", "table": [["The two factors", "The product", "Example"], ["Both positive", "Positive", "2/3 × 5/11 = 10/33"], ["Both negative", "Positive", "(−5/4) × (−7/3) = 35/12"], ["Opposite signs", "Negative", "−3 × 5 = −15"], ["One or both 0", "Zero", "−7/9 × 0 = 0"]],
       "paras": ["Different signs: decide the sign, multiply the absolute values, then put the sign in front."], "note": "An even number of negative factors gives a positive product. An odd number gives a negative product."},
      {"kind": "steps", "step": "method", "title": "Example 1.26 a: 4/9 × (−5/2)", "steps": ["The signs are different (+ and −), so the product is negative.", "Multiply the absolute values: 4/9 × 5/2 = (4 × 5)/(9 × 2) = 20/18.", "Simplify: the GCF of 20 and 18 is 2. 20 ÷ 2 = 10 and 18 ÷ 2 = 9.", "So 20/18 = 10/9.", "Put the sign in front: the answer is −10/9."]},
      {"kind": "name", "step": "name", "title": "Factor", "defs": [["Factor", "A number being multiplied."]]},
      mcq("check", "(−2/5) × (−7/3) is", ["positive", "negative", "zero"], "positive", "Two negatives give a positive: 14/15.", "Same signs or different?"),
      blank(P, "3/7 × (−3/4) = ___", ["-9/28"], "Different signs: −9/28.", "Decide the sign first.", input="signed", gen={"t": "op", "op": "mul", "signs": True}),
      blank(P, "−8/7 × (−3/5) = ___", ["24/35"], "Same signs: +24/35.", "Two negatives.", input="signed", gen={"t": "op", "op": "mul", "signs": True}),
      blank(P, "−2/3 × 5/4 × 3/2 = ___", ["-5/4", "-1 1/4", "-1.25"], "One negative factor, so the answer is negative. 2 × 5 × 3 = 30 and 3 × 4 × 2 = 24, so 30/24. GCF of 30 and 24 is 6: 30 ÷ 6 = 5 and 24 ÷ 6 = 4. Answer −5/4.", "Count the negative factors.", input="signed", worked="1 negative (odd), so negative. 2 × 5 × 3 = 30 and 3 × 4 × 2 = 24. 30/24 = 5/4. Answer −5/4.")]},
   {"id": "math.multiplication-properties", "name": "Properties of multiplication",
    "explain": ex("Multiplication is commutative and associative. It distributes over addition: a × (b + c) = a × b + a × c. Times 0 gives 0. Times 1 keeps the number.",
                  "ማባዛት የመለዋወጥና የመቧደን ባሕሪ አለው። በመደመር ላይ ይከፋፈላል። በ0 ማባዛት 0 ይሰጣል። በ1 ማባዛት ቁጥሩን አይለውጥም።"),
    "screens": [
      {"kind": "guess", "step": "hook", "title": "Example 1.29", "ask": "Cloth costs Birr 162/4 per metre. Roughly how much do 35/9 m cost?", "opts": ["About Birr 40", "About Birr 160", "About Birr 600"], "after": "35/9 × 162/4 = (35 × 162)/(9 × 4) = 5670/36. GCF of 5670 and 36 is 18: 5670 ÷ 18 = 315 and 36 ÷ 18 = 2. 315/2 = Birr 157.50."},
      {"kind": "read", "step": "read", "title": "Properties", "paras": ["For any rational numbers a, b and c:"], "table": [["Property", "Rule"], ["Commutative", "a × b = b × a"], ["Associative", "a × (b × c) = (a × b) × c"], ["Distributive", "a × (b + c) = a × b + a × c"], ["Property of 0", "a × 0 = 0"], ["Property of 1", "a × 1 = a"]]},
      {"kind": "steps", "step": "method", "title": "Example 1.28 c: 2/5 × (3/7 + 4/3)", "steps": ["Distribute: 2/5 × (3/7 + 4/3) = 2/5 × 3/7 + 2/5 × 4/3.", "2/5 × 3/7 = (2 × 3)/(5 × 7) = 6/35.", "2/5 × 4/3 = (2 × 4)/(5 × 3) = 8/15.", "Now add 6/35 + 8/15. The LCM of 35 and 15 is 105.", "6/35 = (6 × 3)/(35 × 3) = 18/105, because 105 ÷ 35 = 3.", "8/15 = (8 × 7)/(15 × 7) = 56/105, because 105 ÷ 15 = 7.", "18/105 + 56/105 = 74/105."]},
      {"kind": "name", "step": "name", "title": "Distributive property", "defs": [["Distributive property", "a × (b + c) = a × b + a × c."]]},
      {"kind": "match", "step": "check", "graded": True, "title": "Match the property", "pairs": [["(8/9 × 5/4) × 0 = 0", "Property of 0"], ["2 3/5 × 1 = 2 3/5", "Property of 1"], ["3/5 × 6/7 = 6/7 × 3/5", "Commutative"], ["2/5 × (3/7 + 4/3) = 2/5 × 3/7 + 2/5 × 4/3", "Distributive"]], "why": "Each line shows one property.", "clue": "Look for 0, 1, swapped order, or brackets opened."},
      blank(P, "Exercise 1.8 Q2: a plane covers 1250 km per hour. In 23/6 hours it covers ___ km", ["14375/3", "4791 2/3", "≈4791.67"], "1250 × 23/6 = (1250 × 23)/6 = 28750/6. Divide top and bottom by 2: 14375/3 km ≈ 4791.67 km.", "Multiply 1250 by 23/6.", worked="1250 × 23 = 28750. 28750/6 = 14375/3 ≈ 4791.67 km.", gen={"t": "op", "op": "mul", "word": True}),
      blank(P, "Exercise 1.8 Q1 f: −3(5x + 5) when x = 3/4: ___", ["-105/4", "-26 1/4", "-26.25"], "5x = 5 × 3/4 = 15/4. 15/4 + 5 = 15/4 + 20/4 = 35/4. −3 × 35/4 = −105/4.", "Work inside the bracket first.")]}],
  [{"book_name": "Exercise 1.8", "items": [
      blank(E, "Q1 a: 5/8 × 3/4 = ___", ["15/32"], "15/32.", "Multiply tops and bottoms."),
      blank(E, "Q1 b: 3/7 × (−3/4) = ___", ["-9/28"], "−9/28.", "Different signs."),
      blank(E, "Q1 c: −8/7 × (−3/5) = ___", ["24/35"], "24/35.", "Two negatives."),
      blank(E, "Q1 d: 2 3/5 × 4 2/3 = ___", ["182/15", "12 2/15"], "13/5 × 14/3 = 182/15.", "Change to improper fractions."),
      blank(E, "Q1 e: −2/3 × 5/4 × 3/2 = ___", ["-5/4", "-1 1/4"], "−30/24 = −5/4.", "One negative factor."),
      blank(E, "Q2: 1250 km per hour for 23/6 hours = ___ km", ["14375/3", "4791 2/3", "≈4791.67"], "1250 × 23/6.", "Multiply.")]}],
  [blank(TT, "2/3 × 9/10 = ___", ["3/5"], "18/30 = 3/5.", "", gen={"t": "op", "op": "mul"}),
   blank(TT, "−4/5 × 15/8 = ___", ["-3/2", "-1 1/2"], "−60/40.", "", gen={"t": "op", "op": "mul", "signs": True}),
   mcq(TT, "The product of three negative numbers is", ["positive", "negative", "zero"], "negative", "An odd number of negatives.", "")],
  [{"kind": "note", "text": "The book numbers two examples 1.25; kept as printed. Exercise 1.8 Q3 asks for a grid model of 1/3 × 2/5; shown here as a 15-part bar."},
   {"kind": "note", "text": "Example 1.29 answer: 35/9 × 162/4 = 5670/36 = 315/2 = Birr 157.50 (checked)."}],
  {"math.mixed-improper": REF_MIXED})

# =====================================================================
# 1.3.4 Division
# =====================================================================
lesson("1.3.4", "1-3-4", "32–35", "Division of rational numbers", "Divide rational numbers using the reciprocal.", 12,
  [kw("Quotient", "ድርሻ", "The answer to a division."), kw("Dividend", "ተካፋይ ቁጥር", "The number being divided."),
   kw("Divisor", "አካፋይ ቁጥር", "The number you divide by."), kw("Reciprocal", "ተገላቢጦሽ", "The number you multiply by to get 1. The reciprocal of a/b is b/a.")],
  [{"id": "math.divide-rationals", "name": "Dividing", "requires": ["math.multiply-rationals"],
    "explain": ex("Dividing by a fraction asks how many of it fit. To divide, multiply by the reciprocal of the divisor: a/b ÷ c/d = a/b × d/c. Same signs give a positive quotient; different signs give a negative one.",
                  "በክፍልፋይ ማካፈል ስንቱ እንደሚገባ ይጠይቃል። ለማካፈል በአካፋዩ ተገላቢጦሽ አባዛ። ተመሳሳይ ምልክት አዎንታዊ፣ የተለያየ ምልክት አሉታዊ ድርሻ ይሰጣል።"),
    "screens": [
      {"kind": "guess", "step": "hook", "title": "Activity 1.6 Q1", "ask": "How many groups of 3/4 are in 12?", "opts": ["9", "16", "36", "4"], "after": "12 ÷ 3/4 = 12 × 4/3 = 16."},
      {"kind": "grid", "step": "explore", "title": "Example 1.30: 4 1/3 ÷ 2/3", "mode": "groups", "wholes": 4, "d": 3, "part": 1, "group": 2,
       "intro": "Question: how many pieces of 2/3 fit into 4 1/3? Tap Next step.",
       "say": ["Each row is 1 whole, cut into 3 equal parts. Each part is 1/3.", "Shade 4 1/3: 4 whole rows and 1 more third. 4 wholes are 4 × 3 = 12 thirds. Add 1 third: 13 thirds.", "A piece of 2/3 is 2 thirds. Colour every 2 thirds as one group: #1 to #6. That uses 6 × 2 = 12 thirds.", "1 third is left over. It is half of a 2/3 piece. So 6 groups and a half: 4 1/3 ÷ 2/3 = 6 1/2 = 13/2."]},
      {"kind": "read", "step": "read", "title": "Words for division", "paras": ["In a ÷ b = c, c is the quotient, a is the dividend and b is the divisor.", "a ÷ b is also written a/b."]},
      {"kind": "read", "step": "read", "title": "Rules for division",
       "table": [["Step", "Do this"], ["1 a", "Same signs: the quotient is +."], ["1 b", "Different signs: the quotient is −."], ["2", "Divide the absolute values."]],
       "paras": ["a/b ÷ c/d = a/b × d/c, where c ≠ 0."]},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Quotient", "The answer to a division."], ["Dividend", "The number being divided."], ["Divisor", "The number you divide by."]]},
      mcq("check", "Example 1.31: −324 ÷ (−18) = ?", ["18", "−18", "1/18"], "18", "Same signs give +. 324 ÷ 18 = 18.", "Same signs or different?"),
      {"kind": "steps", "step": "method", "title": "Example 1.32 a: 6/14 ÷ 3/7", "steps": ["The divisor is 3/7. Its reciprocal is 7/3 (flip it).", "Dividing by 3/7 is the same as multiplying by 7/3: 6/14 ÷ 3/7 = 6/14 × 7/3.", "Multiply the tops: 6 × 7 = 42. Multiply the bottoms: 14 × 3 = 42.", "42/42 = 1, because any number divided by itself is 1."]},
      blank(P, "−3 ÷ 9/15 = ___", ["-5"], "The reciprocal of 9/15 is 15/9. −3 × 15/9 = −45/9. 45 ÷ 9 = 5, so −5.", "Multiply by the reciprocal of 9/15.", input="signed", worked="Write −3 as −3/1. Flip 9/15 to get 15/9. −3/1 × 15/9 = (−3 × 15)/(1 × 9) = −45/9. 45 ÷ 9 = 5, so the answer is −5.", gen={"t": "op", "op": "div", "signs": True}),
      blank(P, "−5/7 ÷ (−4) = ___", ["5/28"], "The reciprocal of −4 is −1/4. −5/7 × (−1/4) = (5 × 1)/(7 × 4) = 5/28. Two negatives give +.", "The reciprocal of −4 is −1/4.", input="signed", gen={"t": "op", "op": "div", "signs": True}),
      blank(P, "5/8 ÷ 3/4 = ___", ["5/6"], "Flip 3/4 to 4/3. 5/8 × 4/3 = (5 × 4)/(8 × 3) = 20/24. GCF of 20 and 24 is 4: 20 ÷ 4 = 5 and 24 ÷ 4 = 6, so 5/6.", "Flip the divisor and multiply.", gen={"t": "op", "op": "div"})]},
   {"id": "math.reciprocal", "name": "Reciprocals",
    "explain": ex("Two numbers are reciprocals when their product is 1. The reciprocal of a/b is b/a. Zero has no reciprocal.",
                  "ሁለት ቁጥሮች ብዜታቸው 1 ሲሆን ተገላቢጦሽ ናቸው። የa/b ተገላቢጦሽ b/a ነው። 0 ተገላቢጦሽ የለውም።"),
    "screens": [
      {"kind": "guess", "step": "hook", "added": True, "title": "Make 1", "ask": "3/4 × ? = 1", "opts": ["4/3", "3/4", "1/4", "−3/4"], "after": "3/4 × 4/3 = (3 × 4)/(4 × 3) = 12/12 = 1."},
      {"kind": "read", "step": "read", "title": "Reciprocal", "paras": ["a/b × b/a = ab/ba = 1.", "Then b/a is called the reciprocal of a/b."]},
      {"kind": "name", "step": "name", "title": "Reciprocal", "defs": [["Reciprocal", "The number you multiply by to get 1. The reciprocal of a/b is b/a."]]},
      {"kind": "match", "step": "check", "graded": True, "title": "Match each number to its reciprocal", "pairs": [["3/4", "4/3"], ["−2/5", "−5/2"], ["7", "1/7"], ["1 1/2", "2/3"]], "why": "Each pair multiplies to 1.", "clue": "Flip the fraction. Keep the sign."},
      blank(P, "Exercise 1.9 Q2: Rahel has 3/4 kg of kolo. Each bag holds 3/8 kg. Number of bags = ___", ["2"], "3/4 ÷ 3/8 = 3/4 × 8/3 = (3 × 8)/(4 × 3) = 24/12 = 2.", "Divide the total by the bag size.", added=True, worked="Flip 3/8 to 8/3. 3/4 × 8/3 = (3 × 8)/(4 × 3) = 24/12. 24 ÷ 12 = 2 bags.", gen={"t": "op", "op": "div", "word": True}),
      blank(P, "Activity 1.6 Q2: how many groups of 2/5 are in 3 3/5? ___", ["9"], "3 3/5 = (3 × 5 + 3)/5 = 18/5. 18/5 ÷ 2/5 = 18/5 × 5/2 = 90/10 = 9.", "Change 3 3/5 to fifths.")]}],
  [{"book_name": "Exercise 1.9", "items": [
      blank(E, "Q1 a: 5/8 ÷ 3/4 = ___", ["5/6"], "5/8 × 4/3 = 5/6.", "Multiply by the reciprocal."),
      blank(E, "Q1 b: −3/5 ÷ 6/7 = ___", ["-7/10"], "Flip 6/7 to 7/6. −3/5 × 7/6 = −21/30. GCF of 21 and 30 is 3: 21 ÷ 3 = 7 and 30 ÷ 3 = 10, so −7/10.", "Multiply by the reciprocal."),
      blank(E, "Q1 c: −8/9 ÷ (−5/3) = ___", ["8/15"], "Two negatives give +. Flip 5/3 to 3/5. 8/9 × 3/5 = 24/45. GCF of 24 and 45 is 3: 24 ÷ 3 = 8 and 45 ÷ 3 = 15, so 8/15.", "Two negatives."),
      blank(E, "Q1 d: 2 3/5 ÷ (−4/3) = ___", ["-39/20", "-1 19/20"], "2 3/5 = (2 × 5 + 3)/5 = 13/5. Flip −4/3 to −3/4. 13/5 × (−3/4) = −39/20.", "Change 2 3/5 to 13/5."),
      blank(E, "Q2: Rahel made 3/4 pound of trail mix and puts 3/8 pound in each bag. Bags = ___", ["2"], "3/4 ÷ 3/8 = 3/4 × 8/3 = 24/12 = 2.", "Divide.")]}],
  [blank(TT, "2/3 ÷ 4/9 = ___", ["3/2", "1 1/2", "1.5"], "2/3 × 9/4 = 18/12.", "", gen={"t": "op", "op": "div"}),
   blank(TT, "−6/7 ÷ 3/14 = ___", ["-4"], "−6/7 × 14/3 = −84/21.", "", gen={"t": "op", "op": "div", "signs": True}),
   mcq(TT, "The reciprocal of −5/8 is", ["−8/5", "8/5", "5/8"], "−8/5", "−5/8 × −8/5 = 1.", "")],
  [{"kind": "note", "text": "Exercise 1.9 Q2 uses pounds and trail mix; the exercise keeps the book's words, the practise item uses kolo and kg (added)."},
   {"kind": "note", "text": "Activity 1.6 Q3 (grid model of 3 1/3 ÷ 2/3 = 5) follows the same idea as Example 1.30."}],
  {"math.multiply-rationals": {"name": "Multiplying fractions", "screens": [
      {"kind": "steps", "step": "method", "title": "2/3 × 4/5", "text": "Multiply tops, multiply bottoms.", "steps": ["2 × 4 = 8.", "3 × 5 = 15.", "So 2/3 × 4/5 = 8/15."]},
      mcq("check", "3/4 × 2/7 = ?", ["3/14", "6/11", "5/28", "6/7"], "3/14", "6/28 = 3/14.", "Multiply tops and bottoms, then reduce.")]}})

# =====================================================================
# 1.4.1 Sharing
# =====================================================================
lesson("1.4.1", "1-4-1", "35–36", "Sharing among friends", "Use rational numbers to share things fairly.", 6,
  [kw("Share", "ማካፈል", "To divide something into equal parts for several people.")],
  [{"id": "math.sharing-fractions", "name": "Fair shares", "requires": ["math.divide-rationals"],
    "explain": ex("When something is shared equally, each person gets the whole divided by the number of people. If part is taken first, find what is left, then divide that.",
                  "አንድ ነገር በእኩል ሲካፈል እያንዳንዱ ሙሉውን በሰዎች ቁጥር ተካፍሎ ያገኛል። መጀመሪያ ክፍል ከተወሰደ የቀረውን ፈልገህ አካፍል።"),
    "screens": [
      {"kind": "guess", "step": "hook", "title": "Example 1.33", "ask": "Four friends share one cake equally. Each gets", "opts": ["1/4", "4", "1/2", "4/1"], "after": "Each friend gets one fourth: 1/4 of the cake."},
      {"kind": "read", "step": "read", "title": "1.4 Real life applications", "paras": ["We use rational numbers for sharing, loans, savings, discounts, prices and budgets."]},
      {"kind": "read", "step": "read", "title": "Example 1.34: the sugarcane", "paras": ["Three brothers buy sugarcane. Their mother takes a fifth.", "The brothers share the rest equally. What fraction does each get?"]},
      {"kind": "fracbar", "step": "explore", "title": "Figure 1.22", "bars": [{"parts": 15, "shade": [{"n": 3, "color": "a", "label": "Brother 1: 1/5 = 3/15"}, {"n": 3, "color": "b", "label": "Brother 2"}, {"n": 3, "color": "c", "label": "Brother 3"}, {"n": 1, "color": "a", "label": "+ 1/15 each from the last fifth"}]}],
       "after": "Each brother gets 1/5 + 1/15 = 4/15. The mother keeps 3/15 = 1/5."},
      {"kind": "steps", "step": "method", "title": "Solution", "steps": ["Cut the sugarcane into 5 equal big pieces. Each big piece is 1/5.", "The mother takes 1 big piece. 4 big pieces are left.", "Each brother takes 1 big piece: 1/5 each. That uses 3 pieces.", "1 big piece is still left. Cut it into 3 equal parts: 1/5 ÷ 3 = 1/5 × 1/3 = 1/15.", "Each brother gets 1/5 + 1/15.", "LCM of 5 and 15 is 15: 1/5 = (1 × 3)/(5 × 3) = 3/15.", "3/15 + 1/15 = 4/15. Each brother gets 4/15."]},
      {"kind": "name", "step": "name", "title": "Share", "defs": [["Share", "To divide something into equal parts for several people."]]},
      mcq("check", "Why does each brother get an extra 1/15?", ["1/5 split into 3 parts is 1/15", "1/3 of 1/3 is 1/15", "15 − 1 = 14"], "1/5 split into 3 parts is 1/15", "1/5 ÷ 3 = 1/5 × 1/3 = 1/15.", "Look at the last big piece."),
      blank(P, "Five friends share 2 injera equally. Each gets ___ injera.", ["2/5", "0.4"], "2 ÷ 5 = 2/5.", "Divide 2 by 5.", added=True),
      blank(P, "Three brothers share 3/4 kg of coffee equally. Each gets ___ kg.", ["1/4", "0.25"], "3/4 ÷ 3 = 3/4 × 1/3 = 3/12. Divide top and bottom by 3: 1/4.", "Divide 3/4 by 3.", added=True, gen={"t": "share"}),
      blank(P, "Review Q9: Eleni baked 32 cupcakes and iced 24. Fraction iced = ___", ["3/4", "24/32", "0.75"], "24/32: GCF of 24 and 32 is 8. 24 ÷ 8 = 3 and 32 ÷ 8 = 4, so 3/4.", "Iced over total, then reduce.", gen={"t": "share"})]}],
  [{"book_name": "Practice 1.4.1", "items": [
      blank(E, "Six students share 4 loaves of bread equally. Each gets ___ loaf.", ["2/3"], "4 ÷ 6 = 4/6. Divide top and bottom by 2: 2/3.", "Divide and reduce.", added=True),
      blank(E, "A mother takes 1/4 of a cake. 3 children share the rest. Each child gets ___", ["1/4"], "3/4 ÷ 3 = 3/4 × 1/3 = 3/12. Divide top and bottom by 3: 1/4.", "Find what is left first.", added=True),
      blank(E, "Eleni iced 24 of 32 cupcakes. Fraction iced = ___", ["3/4"], "24/32: GCF of 24 and 32 is 8. 24 ÷ 8 = 3 and 32 ÷ 8 = 4, so 3/4.", "Reduce 24/32.")]}],
  [blank(TT, "A mother takes 1/3 of a sugarcane. 2 brothers share the rest. Each gets ___", ["1/3"], "2/3 ÷ 2.", "", gen={"t": "share"}),
   blank(TT, "Eight friends share 3 pizzas. Each gets ___ pizza.", ["3/8"], "3 ÷ 8.", "")],
  [{"kind": "note", "text": "The book has no exercise for 1.4.1; Practice 1.4.1 is added (marked added). Review Exercise Q9 is used here."}],
  {"math.divide-rationals": {"name": "Dividing fractions", "screens": [
      {"kind": "steps", "step": "method", "title": "3/4 ÷ 3", "text": "Dividing by 3 is multiplying by 1/3.", "steps": ["Write 3 as 3/1. Its reciprocal is 1/3.", "So 3/4 ÷ 3 = 3/4 × 1/3.", "Multiply: (3 × 1)/(4 × 3) = 3/12.", "Simplify: divide top and bottom by 3. 3 ÷ 3 = 1 and 12 ÷ 3 = 4, so 3/12 = 1/4."]},
      mcq("check", "2/5 ÷ 2 = ?", ["1/5", "4/5", "2/10", "1/10"], "1/5", "2/5 ÷ 2 = 2/5 × 1/2 = 2/10. Divide top and bottom by 2: 1/5.", "Multiply by 1/2.")]}})

# =====================================================================
# 1.4.2 Interest and loans
# =====================================================================
lesson("1.4.2", "1-4-2", "36–37", "Calculating interest and loans", "Calculate simple interest, principal, rate and time with I = PRT.", 10,
  [kw("Interest", "ወለድ", "Money paid for the use of money."), kw("Principal", "ዋና ገንዘብ", "The money that is borrowed or saved."),
   kw("Rate", "መጠን", "The percent of interest per year."), kw("Time", "ጊዜ", "How long the money is used, in years."),
   kw("Simple interest", "ቀላል ወለድ", "Interest on the original principal only: I = P × R × T.")],
  [{"id": "math.simple-interest", "name": "Simple interest", "requires": ["math.percent-decimal"],
    "explain": ex("Simple interest is I = P × R × T. P is the principal, R the yearly rate as a decimal, and T the time in years. Change months to years by dividing by 12. To find P, R or T, divide I by the other two.",
                  "ቀላል ወለድ I = P × R × T ነው። P ዋና ገንዘብ፣ R ዓመታዊ መጠን በአስርዮሽ፣ T ጊዜ በዓመት ነው። ወራትን በ12 አካፍለህ ወደ ዓመት ቀይር።"),
    "screens": [
      {"kind": "guess", "step": "hook", "added": True, "title": "Extra money", "ask": "You lend a friend 100 Birr. She returns 110 Birr after a year. The extra 10 Birr is called", "opts": ["interest", "principal", "rate", "time"], "after": "The extra money is interest. The 100 Birr is the principal."},
      {"kind": "read", "step": "read", "title": "Simple interest", "paras": ["Interest is a payment for the use of money. The borrower pays it; the lender receives it."],
       "table": [["Word", "Meaning"], ["Principal (P)", "The money borrowed or saved."], ["Interest (I)", "The money paid for its use."], ["Time (T)", "How long, in years."], ["Rate (R)", "The percent per year."], ["Simple interest", "Interest on the original principal: I = PRT."]]},
      {"kind": "slider", "step": "explore", "title": "Explore I = P × R × T", "ask": "Move the sliders. What makes the interest grow?",
       "vars": [{"k": "P", "label": "Principal (Birr)", "min": 500, "max": 30000, "step": 100, "v": 21100}, {"k": "R", "label": "Rate (% per year)", "min": 1, "max": 20, "v": 15}, {"k": "T", "label": "Time (months)", "min": 1, "max": 36, "v": 5}],
       "formula": "P * R / 100 * T / 12", "out": "Interest = Birr {v}", "note": "T is in years: 5 months = 5/12 year."},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Principal", "The money that is borrowed or saved."], ["Interest", "Money paid for the use of money."], ["Rate", "The percent of interest per year."], ["Time", "How long the money is used, in years."], ["Simple interest", "Interest on the original principal only: I = P × R × T."]]},
      {"kind": "steps", "step": "method", "title": "Example 1.35: Abebe's loan", "steps": ["Write what you know: P = Birr 21100, R = 15%, T = 5 months.", "Change the rate to a decimal: 15% = 15 ÷ 100 = 0.15.", "Change the time to years: 5 months = 5/12 of a year (a year has 12 months).", "I = P × R × T = 21100 × 0.15 × 5/12.", "21100 × 0.15 = 3165.", "3165 × 5 = 15825, and 15825 ÷ 12 = 1318.75.", "Abebe pays Birr 1318.75 interest."]},
      mcq("check", "In I = PRT, 8 months is T =", ["8", "8/12", "12/8", "0.8"], "8/12", "T must be in years: 8 ÷ 12.", "How many months are in a year?", needs="math.percent-decimal"),
      {"kind": "steps", "step": "method", "title": "Example 1.36: find P", "steps": ["Write what you know: I = Birr 250, R = 10%, T = 2 1/2 years.", "R = 10% = 10 ÷ 100 = 0.1. T = 2 1/2 = 2.5 years.", "I = P × R × T, so P = I ÷ (R × T).", "R × T = 0.1 × 2.5 = 0.25.", "P = 250 ÷ 0.25 = 1000.", "The principal is Birr 1000."]},
      blank(P, "Exercise 1.10 Q1: Birr 1200 at 10% for 5 years. Interest = Birr ___", ["600"], "1200 × 0.1 × 5 = 600.", "I = P × R × T.", gen={"t": "interest", "find": "I"}),
      blank(P, "Exercise 1.10 Q2: what principal earns Birr 637 at 7% in 2 years? P = Birr ___", ["4550"], "637 ÷ (0.07 × 2) = 637 ÷ 0.14 = 4550.", "P = I ÷ (R × T).", gen={"t": "interest", "find": "P"}),
      blank(P, "Review Q10: Birr 500 earns Birr 50 at 9.5%. Time = ___ years", ["≈1.05", "20/19"], "T = 50 ÷ (500 × 0.095) = 50 ÷ 47.5 ≈ 1.05 years.", "T = I ÷ (P × R).", worked="500 × 0.095 = 47.5. 50 ÷ 47.5 = 1.0526… ≈ 1.05 years.", gen={"t": "interest", "find": "T"})]}],
  [{"book_name": "Exercise 1.10", "items": [
      blank(E, "Q1: Birr 1200 at 10% simple interest per year for 5 years. Interest = Birr ___", ["600"], "1200 × 0.10 × 5 = 600.", "I = PRT."),
      blank(E, "Q2: principal that brings Birr 637 at 7% in 2 years = Birr ___", ["4550"], "637 ÷ 0.14 = 4550.", "P = I ÷ (RT)."),
      blank(E, "Q3: Birr 6000 borrowed; Birr 7500 owed after 5 months. Rate = ___ % per year", ["60"], "I = 1500. R = 1500 ÷ (6000 × 5/12) = 0.6 = 60%.", "First find the interest: 7500 − 6000.")]}],
  [blank(TT, "Birr 2000 at 12% for 3 years. Interest = Birr ___", ["720"], "2000 × 0.12 × 3.", "", gen={"t": "interest", "find": "I"}),
   blank(TT, "Birr 900 earns Birr 108 in 2 years. Rate = ___ %", ["6"], "108 ÷ (900 × 2) = 0.06.", "", gen={"t": "interest", "find": "R"}),
   mcq(TT, "6 months in years is", ["1/2", "6", "1/6"], "1/2", "6/12 = 1/2.", "")],
  [{"kind": "review", "text": "Exercise 1.10 Q3 gives 60% per year. The arithmetic is right, but the rate is unrealistic. Teacher to confirm or change the numbers."},
   {"kind": "note", "text": "Example 1.35 checked: 21100 × 0.15 = 3165; 3165 × 5/12 = 1318.75."}],
  {"math.percent-decimal": REF_PCT})

# =====================================================================
# Unit summary and review exercise
# =====================================================================
lesson("Review", "1-5", "38–40", "Summary and review exercise", "Bring together the ideas of Unit 1.", 15,
  [kw("Rational number", "ሬሽናል ቁጥር", "A number that can be written as a/b, where a and b are integers and b ≠ 0."),
   kw("Absolute value", "ፍጹም ዋጋ", "The distance of a number from 0. It is never negative.")],
  [{"id": "math.rational-review", "name": "Summary for Unit 1",
    "explain": ex("A rational number is a/b with b not zero. You can place it on a number line, find its absolute value, compare and order it, and add, subtract, multiply and divide with sign rules. You also used rational numbers for sharing and interest.",
                  "ሬሽናል ቁጥር b ዜሮ ያልሆነበት a/b ነው። በቁጥር መስመር ላይ ማስቀመጥ፣ ፍጹም ዋጋውን ማግኘት፣ ማነፃፀርና በምልክት ሕጎች ማስላት ትችላለህ።"),
    "screens": [
      {"kind": "sort", "step": "hook", "graded": False, "title": "Warm up: what is the sign?", "bins": ["Positive", "Negative"],
       "items": [["(−) + (−)", "Negative", "Two negatives added stay negative."], ["(−) × (−)", "Positive", "Same signs multiply to +."], ["(+) ÷ (−)", "Negative", "Different signs give −."], ["(−) ÷ (−)", "Positive", "Same signs give +."]]},
      {"kind": "read", "step": "read", "title": "Summary for Unit 1",
       "paras": ["1. A rational number can be written a/b, where a and b are integers and b ≠ 0. The set is ℚ.", "2. Rational numbers can be shown on a number line.", "3. |x| = x if x > 0, 0 if x = 0, and −x if x < 0."],
       "table": [["Compare by", "Example"], ["Decimals", "0.6 > 0.5"], ["Same denominators", "6/10 > 5/10"], ["Cross-product", "3/5 > 1/2 since 6 > 5"]]},
      {"kind": "read", "step": "read", "title": "Sign rules",
       "paras": ["5. Subtraction is adding the opposite. 6. A number plus its opposite is 0."],
       "table": [["Operation", "Same signs", "Different signs"], ["Addition", "Keep the sign, add sizes", "Sign of the bigger size, subtract sizes"], ["Multiplication", "Positive", "Negative"], ["Division", "Positive", "Negative"]]},
      {"kind": "name", "step": "name", "title": "Key words", "defs": [["Rational number", "A number that can be written as a/b, where a and b are integers and b ≠ 0."], ["Absolute value", "The distance of a number from 0. It is never negative."]]},
      {"kind": "match", "step": "check", "graded": True, "title": "Match the rule", "pairs": [["negative + negative", "negative"], ["negative × negative", "positive"], ["positive ÷ negative", "negative"], ["a + (−a)", "0"]], "why": "These are the sign rules of the summary.", "clue": "Same signs multiply to +."},
      blank(P, "Review Q4 a: 3/4 + 9/7 + 2 = ___", ["113/28", "4 1/28"], "LCM of 4 and 7 is 28. 3/4 = (3 × 7)/(4 × 7) = 21/28; 9/7 = (9 × 4)/(7 × 4) = 36/28; 2 = 56/28. 21 + 36 + 56 = 113, so 113/28.", "LCM of 4 and 7 is 28.", gen={"t": "op", "op": "add", "mixed": True}),
      blank(P, "Review Q5 a: 2/7 − 3/8 = ___", ["-5/56"], "LCM of 7 and 8 is 56. 2/7 = (2 × 8)/(7 × 8) = 16/56 and 3/8 = (3 × 7)/(8 × 7) = 21/56. 16 − 21 = −5, so −5/56.", "LCM of 7 and 8 is 56.", input="signed", gen={"t": "op", "op": "sub", "signs": True}),
      blank(P, "Review Q6 a: 2 3/7 × 1/4 = ___", ["17/28"], "2 3/7 = (2 × 7 + 3)/7 = 17/7. 17/7 × 1/4 = (17 × 1)/(7 × 4) = 17/28.", "Change 2 3/7 to 17/7.", gen={"t": "op", "op": "mul", "mixed": True}),
      blank(P, "Review Q7 a: 3/4 ÷ (−5/2) = ___", ["-3/10"], "Flip −5/2 to −2/5. 3/4 × (−2/5) = −6/20. Divide top and bottom by 2: −3/10.", "Multiply by the reciprocal.", input="signed", gen={"t": "op", "op": "div", "signs": True})]}],
  [{"book_name": "Review Exercise", "items": [
      tf(E, "Q1 a: −5/3 > −8/11", False, "−5/3 ≈ −1.67 is left of −8/11 ≈ −0.73.", "Which is further from 0?"),
      tf(E, "Q1 b: 3 5/7 > 23/7 > 19/6", True, "26/7 ≈ 3.71 > 3.29 > 3.17.", "Change to decimals."),
      {"kind": "pick", "step": E, "graded": True, "text": "Q2 b: solve |x − 5| = 4.", "pool": ["9", "1", "−1", "−9"], "a": ["9", "1"], "why": "x − 5 = 4 or −4, so x = 9 or 1.", "clue": "The inside is 4 or −4."},
      {"kind": "pick", "step": E, "graded": True, "text": "Q2 c: solve |2x + 3| = 5.", "pool": ["1", "−4", "4", "−1"], "a": ["1", "−4"], "why": "2x + 3 = 5 gives 1; 2x + 3 = −5 gives −4.", "clue": "The inside is 5 or −5."},
      blank(E, "Q3: if x = −8 and y = 4, (3|x − 5| − |4y|) / |x + y| = ___", ["23/4", "5 3/4", "5.75"], "x − 5 = −13, so 3|x − 5| = 3 × 13 = 39. 4y = 16, so |4y| = 16. x + y = −4, so |x + y| = 4. (39 − 16)/4 = 23/4.", "|x − 5| = 13, |4y| = 16, |x + y| = 4."),
      blank(E, "Q10: how long for Birr 500 to earn Birr 50 at 9.5%? ___ years", ["≈1.05", "20/19"], "50 ÷ 47.5 ≈ 1.05.", "T = I ÷ (P × R).")]},
   {"book_name": "Chapter test", "test": True, "items": [
      {"kind": "numline", "step": TT, "graded": True, "min": -2, "max": 2, "sub": 4, "targets": [{"v": "-3/4", "label": "−3/4"}], "ask": "Tap where −3/4 goes.", "why": "Three quarters left of 0.", "clue": "", "gen": {"t": "place", "signs": True, "improper": True}},
      mcq(TT, "Smallest set containing −7?", ["ℕ", "W", "ℤ", "ℚ"], "ℤ", "A negative integer.", "", gen={"t": "classify"}),
      blank(TT, "|−9 + 4| = ___", ["5"], "|−5| = 5.", "", gen={"t": "abs"}),
      {"kind": "pick", "step": TT, "graded": True, "text": "Tap all solutions of |x| = 6.", "pool": ["6", "−6", "0", "12"], "a": ["6", "−6"], "why": "6 and −6.", "clue": "", "gen": {"t": "abseq"}},
      cmp(TT, "3/8", "2/5", "<", "15 < 16.", "", gen={"t": "compare"}),
      {"kind": "order", "step": TT, "graded": True, "title": "Ascending", "items": ["−1.5", "−1/2", "2/3", "1.2"], "why": "Smallest first.", "clue": "", "gen": {"t": "order"}},
      blank(TT, "−2/3 + 3/4 = ___", ["1/12"], "−8/12 + 9/12.", "", gen={"t": "op", "op": "add", "signs": True}),
      blank(TT, "5/6 − (−1/3) = ___", ["7/6", "1 1/6"], "5/6 + 2/6.", "", gen={"t": "op", "op": "sub", "signs": True}),
      blank(TT, "−3/5 × 10/9 = ___", ["-2/3"], "−30/45.", "", gen={"t": "op", "op": "mul", "signs": True}),
      blank(TT, "7/8 ÷ (−7/4) = ___", ["-1/2", "-0.5"], "7/8 × (−4/7).", "", gen={"t": "op", "op": "div", "signs": True}),
      blank(TT, "Mother takes 1/5; 2 children share the rest. Each gets ___", ["2/5"], "4/5 ÷ 2.", "", gen={"t": "share"}),
      blank(TT, "Birr 1500 at 8% for 2 years. Interest = Birr ___", ["240"], "1500 × 0.08 × 2.", "", gen={"t": "interest"})]}],
  [mcq(TT, "Which is NOT a rational number?", ["5/0", "0/5", "−5", "0.5"], "5/0", "The denominator cannot be 0.", ""),
   tf(TT, "The sum of two opposite numbers is 0.", True, "a + (−a) = 0.", ""),
   blank(TT, "−1/2 × (−1/2) = ___", ["1/4"], "Same signs give +.", "", gen={"t": "op", "op": "mul", "signs": True})],
  [{"kind": "note", "text": "Review Exercise answers computed exactly: Q2 d x = 7/3 or 1/3; Q2 e no solution; Q4 b −16/21; Q4 c 809/140; Q5 b −271/63; Q6 b 2.73; Q6 c 9/2; Q7 b −135/92; Q7 c 51/49; Q8 a 44/35; Q8 b 56/69; Q8 c 45/833. Six items are used; Q4–Q7 a are in the practise set."},
   {"kind": "note", "text": "The chapter test is generated fresh on every attempt (no clues), as an unseen test."},
   {"kind": "review", "text": "Review Q1 c reads |2 3/5| = |−2 3/5| (true) and Q1 d 3 5/6 < 3 4/5 < 2 2/7 (false); the printed layout is unclear. Teacher to confirm."}])
print("ok")
