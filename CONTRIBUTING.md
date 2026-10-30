# Contributing

## Before you change code

1. Read [AGENTS.md](AGENTS.md) and `.agents/skills/jalali-calendar-invariants/SKILL.md`.
2. Keep Gregorian storage and the 1200-1599 Jalali range.
3. Do not edit Frappe or ERPNext core.
4. Do not upgrade `persian-date` or `persian-datepicker` in the same change as a feature.

## Development environment

Use a disposable Frappe 16 site or a local Node checkout for unit tests. Do not use an operational site.

```bash
npm ci
npm run test:unit
```

For browser tests:

```bash
npx playwright install chromium
npm run test:browser
```

## Pull requests

- Target `main` unless a maintainer asks for another branch.
- Keep the diff to one problem.
- Add or update a regression test for a behavior change.
- Run `npm test`, `npm run test:python`, `npm run test:docs` and `npm run test:pack` when you touch runtime files, docs or packaging.
- Do not bump `1.6.5` unless a maintainer asked for a release.

## Vendor changes

Vendored files keep their MIT headers. A vendor update needs:

1. A written compatibility reason
2. Exhaustive mapping tests
3. Playwright in all three timezone projects
4. Review of [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

## License

By contributing you agree to the MIT License. Keep the nidyasoft copyright notice in `LICENSE`.
