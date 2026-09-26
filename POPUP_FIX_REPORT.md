# Calendar popup regression fix

## Scope and checkout

Permanent origin: `https://github.com/shahrivar88/SmartProcess_ERPNext_Calender.git`.
Baseline: `main`, `4c782a28d3ae5b5f3d2b2039f701e15ea8520a37`, clean before editing.
This is an isolated local clone, not the installed production app. No push, commit,
deployment, database operation, service restart, or core/other-app edit was performed.
The Python app identity and version remain `jalali_shamsi_datepicker`, `1.6.0`.

## Root causes

1. Two position writers competed. The control centered the last globally visible
   popup after `show()`, while the vendor's debounced input focus/click handler
   called `show()` again after 200 ms. That rewrote document-offset left/top on a
   container the control had already changed to viewport-fixed positioning.
   Visibility and animation-frame workarounds did not cover every later show.
2. The vendor always generated six weeks and replaced the entire table on each
   render. The control exposed hidden rows on mousedown, then removed them using
   animation frames and 0/30/80/160 ms retries. Its observer remained attached to
   the replaced table. This permitted six-row frames and stale navigation behavior.

## Changes

- `public/js/jalali_controls.js`: instance-local view adapter removes empty trailing
  rows from the day view model before templating, with a minimum of five rows.
  It replaces the vendor position writer and runs layout synchronously after every
  render. No layout polling, delayed reveal, or table observer remains.
- Popup references are owned by their control, not found through a global
  `:visible:last` query. Position uses field center and viewport bounds, tracks
  both horizontal and vertical ancestor scrolling, and respects modal stacking.
- Unique listener namespaces, immediate outside-close binding, and an idempotent
  teardown prevent same-name controls and old callbacks from interfering. A small
  DOM-removal observer closes detached grid/filter inputs. Modal and route hooks
  are released. Frappe v16's emitter wraps handler functions; removal therefore
  uses the namespace on its jQuery emitter rather than its ineffective handler
  identity-based `off()` wrapper.
- Time controls are rebound after full renders. Time button clicks now reach the
  library's delegated handlers; typed time updates picker state before later
  spin/wheel operations, while preserving normalized host text.
- `public/css/custom.css`: fixed 228 px date/datetime width, automatic day-grid
  height, theme-token surface, no geometry animation, 196 px time-only width,
  explicit left-to-right time order and a valid sans-serif font fallback.
- `hooks.py` and `tests/metadata.test.js`: cache keys updated for changed assets.
- `tests/browser/popup.spec.js`, `playwright.config.js`, `package.json`,
  `package-lock.json`, `.gitignore`: reproducible browser regression suite and
  pinned test-only dependencies; generated browser results are ignored.

## Vendored 1.2.0 compatibility patch

`public/js/persian-datepicker.min.js` retains its MIT header. Its deliberately
small changes are listed here because its bundled source is a single minified line:

1. `_attachInputElementEvents` returns early when the opt-in `managedInput` option
   is true. The Frappe control already owns opening, outside clicks and keyboard
   behavior, so it must not also install uncancellable delayed vendor handlers.
2. Container IDs use a monotonic per-constructor counter instead of a random
   integer in a space of only 1000 IDs.
3. Vendor document click listeners are namespaced with their container ID.
4. API `destroy()` removes that namespace and cancels the navigator's two pending
   time timers before removing the view.

Calendar conversion, day access checks, formatting algorithms and selection
semantics were not modified in the vendor. The adapter relies on this bundled
version's `model.view`, `_getDayViewModel`, `afterRender`, and navigator methods;
re-run browser tests when updating the vendor.

## Verification

Install test dependencies with `npm ci`, then install the test browser with
`npx playwright install chromium` and run `npm test`.
For an existing Chrome installation on PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm test
```

The suite includes the existing 33 unit/metadata/conversion tests and 10 browser
scenarios in each of Asia/Tehran and America/New_York. Browser tests run the real
bundled picker, jQuery and app CSS/JS with a minimal Frappe control/emitter fixture.
They cover initial and subsequent show geometry frame-by-frame, all twelve months,
navigation and wheel, RTL/LTR, edge clamp, modal stacking/close, repeated lifecycle
cleanup, same-name controls, scroll/resize, detached inputs, route change,
Escape/Tab/outside click, readonly/disabled inputs, restricted days, Gregorian
parse, and datetime/time keyboard-plus-spin behavior. Screenshots are produced
under `test-results/` for visual inspection.

## Remaining limits

- The browser fixtures simulate modal/Quick Entry and grid/filter control hosts;
  they are not an end-to-end test against a running ERPNext site. Actual database
  storage and the site's full CSS/plugin environment were not exercised. Core
  parse/timezone delegation and identity remain unchanged.
- Existing tests explicitly document the vendor/core leap-calendar discrepancies
  around years 1209, 1275, 1308, 1341 and 1473. This patch preserves that existing
  behavior and the core validation safety net; it does not replace either calendar
  algorithm.
- A viewport smaller than the fixed popup itself cannot contain it fully. Normal
  viewport edge cases are clamped; no responsive full-screen mode is introduced.
- No live production smoke test or deployment has been performed.

## Final results

- Full run: **33 unit tests + 20 browser tests passed; zero failed/skipped**.
- `git diff --check`: passed.
- `graphify update .`: completed (AST only), 164 nodes / 214 edges.
- HEAD remains `4c782a2`; all edits are unstaged. Generated graph files are local untracked outputs.

```text
## main...origin/main
 M .gitignore
 M jalali_shamsi_datepicker/hooks.py
 M jalali_shamsi_datepicker/public/css/custom.css
 M jalali_shamsi_datepicker/public/js/jalali_controls.js
 M jalali_shamsi_datepicker/public/js/persian-datepicker.min.js
 M jalali_shamsi_datepicker/tests/metadata.test.js
?? POPUP_FIX_REPORT.md
?? graphify-out/
?? jalali_shamsi_datepicker/tests/browser/
?? package-lock.json
?? package.json
?? playwright.config.js
```
