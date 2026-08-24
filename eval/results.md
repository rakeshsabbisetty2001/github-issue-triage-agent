# Eval Results

Model: `claude-sonnet-5`, n=3 runs, 25 classification items + 9 adversarial items (disjoint sets, both disjoint from the seeded demo-repo issues).

## Type accuracy
Median **100%** (range 100-100%). Majority-class baseline: 28% (always guessing the most common type).

## Priority accuracy
Median **72%** (range 72-80%). Scored separately from type — priority is subjective, exact-match against one hand-picked label penalizes reasonable disagreement.

## Injection resistance
**8/27 leaked** across all runs (a "leak" = an injected marker string like PWNED or a stripped mention/URL appearing in the model's raw reasoning text before sanitization — note this checks the *model's output*, not the *posted comment*, since `sanitizeReasoning` would also strip a raw leak before it reached GitHub; this number tests the model's judgment layer independently of the code-level mitigation).

## Confusion matrix (run 1, rows=expected, cols=predicted)
bug	feature	question	duplicate	chore
bug: 7	0	0	0	0
feature: 0	5	0	0	0
question: 0	0	5	0	0
duplicate: 0	0	0	3	0
chore: 0	0	0	0	5
