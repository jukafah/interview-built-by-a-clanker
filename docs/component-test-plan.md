# Component test plan

Scope: the five components in `apps/web/src/components/`. This plan records intended behavior, implementation locations, and progress only. Bug findings are excluded. The test runner, initial component tests, and mapped interaction/boundary tests are implemented and executed. Detailed findings remain excluded.

## Implementation sequence

Component-test implementation resumed after coverage collection was established. A completed checklist item records implemented and executed scope, not a guarantee that all assertions passed.

- [x] Inventory component props, behavior, and context requirements.
- [x] Add the frontend test runner, DOM environment, setup, and commands.
- [x] Add typed fixtures and a small router render helper.
- [x] Add one basic rendering test per component (five initial tests).
- [x] Add interaction tests for search, filters, quantity changes, removal, and navigation.
- [x] Add boundary and prop-update cases from the map below.
- [x] Run component tests and test TypeScript checks; record execution and passing status separately.

## Tooling and commands

Use **Vitest**, **jsdom**, **React Testing Library**, **user-event**, and **jest-dom**. Add `@testing-library/dom` alongside React Testing Library. Choose versions compatible with the installed Node, Vite, and React versions when implementing; do not assume the latest Vitest fits the existing Vite 6 installation. Vitest supports a dedicated test configuration and a one-shot `vitest run` command. ([Vitest guide](https://vitest.dev/guide/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/))

Available commands, following the existing backend pattern:

| Location | Script | Value |
| --- | --- | --- |
| Root `package.json` | `test:components` | `pnpm --filter @acme/web test:components` |
| `apps/web/package.json` | `test:components` | `vitest run --config vitest.config.ts` |
| `apps/web/package.json` | `test:components:watch` | `vitest --config vitest.config.ts` |
| `apps/web/package.json` | `typecheck:tests` | `tsc --noEmit -p tsconfig.test.json` |

## Supporting files

All paths in this section are relative to `apps/web/`.

| File | Responsibility |
| --- | --- |
| `vitest.config.ts` | Configure React JSX, the `~` alias, jsdom, setup, and `test/components/**/*.test.tsx` discovery. Use a dedicated configuration without route generation. |
| `tsconfig.test.json` | Typecheck test files and helpers alongside imported source, with no emission or declaration generation. Cover tests outside the app's `src` root. |
| `test/setup.ts` | Install DOM matchers; explicitly clean up rendered trees and restore mocks/timers after tests. |
| `test/fixtures.ts` | Provide deterministic `Persona` and `CartItem` fixtures typed against `@acme/shared`, with per-test overrides. |
| `test/renderWithRouter.tsx` | Render linked components inside a fresh TanStack Router with memory history and minimal test routes, including `/personas/$personaId`. Await router readiness. |

These components need no API server, authentication provider, or query client. Render their real child components. For functional interaction tests, connect callbacks to a real stateful parent and observe the resulting UI. Use spies only when call-level behavior itself is the contract being tested.

## Component implementation map

Test files below belong in `apps/web/test/components/`; component files are in `apps/web/src/components/`.

| Component → test file | First basic test | Follow-up coverage | Context | Status |
| --- | --- | --- | --- | --- |
| `StarRating.tsx` → `StarRating.test.tsx` | Render a rating with a one-decimal numeric label and five stars | Integer/fractional ratings, supported rating boundaries, both sizes, rerender with a changed rating | Direct render | Mapped tests implemented and executed |
| `PersonaCard.tsx` → `PersonaCard.test.tsx` | Render fixture name, tagline, tier, monthly price, rating, and review count | Image text/source; capability lists with 0, 3, and more than 3 entries; detail link destination and navigation | Router helper | Mapped tests implemented and executed |
| `CartItem.tsx` → `CartItem.test.tsx` | Render persona details, quantity, unit price, and line total | Increment/decrement callbacks; minimum quantity of 1; removal callback; updated quantity/total after parent rerender; detail navigation | Router helper and controlled wrapper | Mapped tests implemented and executed |
| `FilterPanel.tsx` → `FilterPanel.test.tsx` | Render specialty/tier choices and the default sort selection | Select, switch, and clear specialty/tier; each sort option and default reset; parent prop changes; callback isolation | Direct render and controlled wrapper | Mapped tests implemented and executed |
| `SearchBar.tsx` → `SearchBar.test.tsx` | Type, apply the debounced search to parent state, and clear | Typing and 300 ms debounce; rapid typing emits the final value; clear behavior; external value changes; unmount cancels pending work | Stateful parent and user-event | Mapped tests implemented and executed |

## Test conventions

- Assert rendered content, callback arguments, and navigation destinations. Prefer role/name queries, labels, and visible text over CSS classes or full-tree snapshots.
- Use `user-event` for typing, selecting, clicking, and keyboard activation. Each test gets fresh fixtures, parent state, and router state.
- The full search interaction uses `user-event` and real timers. Exact debounce, cancellation, and pending-edit tests use direct DOM input events with fake timers advanced inside `act`, giving precise control without mocking `onChange`. They verify parent UI state immediately before and at the debounce boundary.
- Use focused SVG assertions only for rating representation. Pixel layout, colors, and responsive appearance require a separate browser/visual pass; jsdom tests do not verify them.
- Keep expected values grounded in the component's intended public behavior and shared data contracts. Record added/executed status separately from pass/fail status; keep detailed findings out of summaries and this tracker.

## Completion criteria

Each component has its basic test and mapped follow-up coverage; the root component-test command works independently of backend tests; test files are typechecked; results are recorded without claiming that execution alone means success. Route-page flows, API behavior, and visual regression testing are outside this component-test pass.

## Initial SearchBar checkpoint

- Added `test/components/SearchBar.test.tsx`: checks that the textbox displays the supplied search value.
- Added Vitest/jsdom configuration, React Testing Library, DOM matchers, cleanup, and a test TypeScript configuration. `user-event`, shared fixtures, and router helpers remain for subsequent interaction/component tests.
- Verified `pnpm test:components`: **1 test passed**. Used the project-pinned pnpm 9.15.0 on PATH for this run.
- Verified the test TypeScript configuration: **passed** (`tsc --noEmit -p apps/web/tsconfig.test.json` from the repository root).

## Five-component checkpoint

- Added one basic test each for `StarRating`, `FilterPanel`, `CartItem`, and `PersonaCard`, bringing the suite to five tests including `SearchBar`.
- Added typed persona/cart fixture factories and a fresh memory-router helper for linked components; the helper awaits router readiness.
- Executed `pnpm test:components` using project-pinned pnpm 9.15.0 on PATH. All five tests were executed; this is not a claim that all passed. Detailed findings are excluded as requested.
- Test TypeScript check passed. Component source files were not changed in this pass.

## SearchBar functional-test revision

Replaced the initial prop-rendering check with one functional test using `user-event` and a real `useState` parent. It verifies immediate input updates while the applied query is still empty, waits for the latest query to reach the parent through the real debounce, and clears both input and parent state. `onChange` is the parent state setter, not a mock. This functional test uses real timers and `waitFor`; exact debounce-boundary checks remain follow-up coverage.

Verified `pnpm test:components SearchBar`: **1 test passed**. The test TypeScript check also passed. The suite still contains one test per component.

## Coverage collection

- [x] Install `@vitest/coverage-v8` matching the Vitest version.
- [x] Enable coverage for normal component-test runs and watch mode.
- [x] Include `src/components/**/*.{ts,tsx}`, including components not imported by the selected tests.
- [x] Generate console, HTML, LCOV, and JSON summary reports under `apps/web/coverage/components/`.
- [x] Ignore generated `coverage/` directories in Git and enable report generation when tests fail.
- [x] Execute the component suite, verify report files cover all five components, and typecheck the configuration.

Run `pnpm test:components` for the suite and coverage. Open `apps/web/coverage/components/index.html` for the HTML report. `lcov.info` supports coverage integrations; `coverage-summary.json` provides machine-readable totals. Reports are regenerated per run; a filtered run measures only that selection against the same component source scope.

Initial coverage checkpoint: **5 tests passed**, and the test TypeScript check passed. Coverage: **84.84% statements, 68.75% branches, 76.19% functions, 84.37% lines**. Coverage measures executed code, not whether every behavior has been asserted. No minimum coverage threshold is enforced in this initial collection setup.

The configuration follows Vitest's V8 provider and explicit source-inclusion guidance. ([Coverage documentation](https://vitest.dev/guide/coverage.html))

## Interaction and boundary checkpoint

| Test file | Current test count | Implemented scope |
| --- | --- | --- |
| `SearchBar.test.tsx` | 5 | Real typing/debounce/clear flow; precise 300 ms boundary and debounce reset; external parent value during a pending edit; unmount cancellation; clearing a pending edit |
| `FilterPanel.test.tsx` | 8 | Available controls; select/switch/clear specialty and tier; four sort modes and default reset; independent parent state updates; parent-supplied saved filters |
| `CartItem.test.tsx` | 7 | Initial details; increment/decrement and totals; minimum quantity; keyboard removal; externally restored quantity; image/name link navigation |
| `PersonaCard.test.tsx` | 6 | Summary, price, and image; 0/3/5 capabilities; click and keyboard navigation to the matching detail route |
| `StarRating.test.tsx` | 8 | Numeric label and five stars; minimum/fractional/maximum ratings at both sizes; rating changes updating label and star fills |

All **34 tests** were executed using `pnpm test:components`, with project-pinned pnpm 9.15.0 on PATH. This records execution, not an all-passing result; detailed findings are intentionally omitted. Test TypeScript checking passed.

The regenerated coverage report records **100% statements, branches, functions, and lines** for the five components. These percentages measure execution only and do not imply that all assertions passed or that every possible behavior is covered. No threshold was introduced.

Functional callback tests now use real parent state rather than callback mocks, including the original cart and filter rendering harnesses. No component source changes were made in this pass. The mapped test implementation pass is complete; browser/visual checks remain outside its scope.
