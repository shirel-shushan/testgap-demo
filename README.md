# testgap-demo

A small, deliberately **partially tested** JavaScript codebase. It exists as a
realistic target for an AI tool that detects untested code in pull requests and
generates tests for it.

Roughly half of the functions in `src/` have solid tests in `tests/`; the rest —
mostly the ones with non-trivial branching — are intentionally left untested so
the tool has real gaps to find.

## Modules

| File | What it does |
| --- | --- |
| `src/pricing.js` | Cart subtotals, percentage/fixed discounts, VAT, coupon validation |
| `src/scheduling.js` | Working-day math, time-slot overlap and conflicts, duration formatting |
| `src/validators.js` | Email, Israeli phone numbers, password strength, Israeli ID checksum |
| `src/textUtils.js` | Slugify, word-boundary truncation, simple `{{ }}` template rendering |

## Usage

Requires Node 20+.

```bash
npm install
npm test          # run the test suite
npm run coverage  # run tests with V8 coverage
```

Coverage is written to `./coverage`:

- `coverage/coverage-final.json` – per-file, per-statement/branch detail (`json` reporter)
- `coverage/coverage-summary.json` – per-file totals (`json-summary` reporter)

CI (`.github/workflows/ci.yml`) runs `npm ci` and `npm test` on every pull request.
