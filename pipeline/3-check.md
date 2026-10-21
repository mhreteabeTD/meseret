# Stage 3 · Fact-check (a separate session or subagent that has NOT seen stage 2's prompt)

Input: one lesson JSON and the section's pages. Output: `content/.../s{section}.flags.md`, a list only. Never edit the lesson.

For every number, date, definition, formula, answer key and `why`: confirm against the pages and standard knowledge. Write one line per problem: `screen/item · what is wrong · correct value · source (page or reference) · confidence high|medium|low`. Low confidence → "teacher review". Also flag: sentences over 15 words, English above the grade, any term used before its `name` screen, any clue that gives away the answer, any `added` example that is not Ethiopian when it could be.
