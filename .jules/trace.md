## $(date +%Y-%m-%d) - Add tests for poll input normalization validation

**Learning:** The "normalizePollInput" and "resolvePollMaxSelections" functions had low coverage. We can comprehensively cover their validation and edge cases to ensure they handle invalid configurations defensively without failing.

**Action:** Add validation edge cases to "src/polls.test.ts" such as missing options, empty questions, invalid maxSelections, and invalid duration constraints, which brought coverage from ~76% up to 100% on statements.
