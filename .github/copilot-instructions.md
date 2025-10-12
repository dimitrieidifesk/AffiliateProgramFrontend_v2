# AI Assistant Project Instructions

Concise, project-specific guidance for coding agents working in this repository.

## 1. Tech Stack & Build
- React 18 + Vite (`npm start` -> dev, `npm run build` -> production, `npm run serve` -> preview). No CRA eject patterns.
- TailwindCSS 3 with custom CSS variables (see `tailwind.config.js`) – color tokens exposed as `var(--color-...)`. Prefer utility classes over bespoke CSS.
- Icon system centralized in `components/AppIcon.jsx` using `lucide-react` + custom logical names (e.g. `AvitoLogo`). Add new icons there first, not inline SVGs scattered.
- Routing: React Router v6 defined in `src/Routes.jsx`. Both new (`/thread-wizard`) and legacy compatibility aliases (`/streams`, `/stream-form`) map to same components. Maintain parity when adding breaking route changes.

## 2. Domain Concepts
- "Thread" (Поток) is a core entity representing a lead acquisition funnel. Creation now linear via wizard (`pages/thread-wizard`). Legacy edit/advanced view lives in `pages/thread-form`.
- Channels (api | telephony | avito) attach to a thread post-creation and navigated as `/channel-{type}/:id` pages.
- Postbacks configured separately at `/thread-postbacks/:id` (status-specific lead notification URLs).

## 3. Thread Creation Wizard Pattern
- Steps state: `currentStep` (1..4) with `canProceed()` gate logic. When adding steps update `steps` array + navigation conditions.
- Mock persistence: thread ID simulated via `Date.now()` after a timed promise. Replace with real API by swapping `createThread()` only—avoid sprinkling network logic.
- Data shape during creation: `{ name, comment, source, status }`. Do NOT reintroduce removed `description` unless product decides.
- Traffic sources config array holds metadata + allowed channels; reuse / extend shape `{ id, name, icon, iconBg, description, channels[] }`.

## 4. UI / Styling Conventions
- Decorative yellow shapes ("YellowFigures") used for brand background on high-level pages (wizard, dashboard, channel pages). Keep them absolutely positioned + pointer-events-none.
- Component shells: card surfaces = `bg-white rounded-xl border border-gray-200 shadow-sm` (or themed variants); interactive elevation via scale + shadow utilities (see dashboard examples).
- Status pills: semantic color groups (success/warning/error) map to CSS variable-based Tailwind tokens (e.g. `bg-green-50 text-green-800`). Follow existing usage for consistency.
- Gradients: primary CTAs often `bg-gradient-to-r from-yellow-400 to-yellow-500` (or black to gray for neutral actions). Match style in new buttons.

## 5. Icons & Images
- Use `<Icon name="..." />` abstraction everywhere. For brand logos (e.g. Avito) supply PNG/SVG through custom branch in `AppIcon.jsx`.
- If adding an image asset that must be accessible at runtime, place in `public/assets/...` and reference with absolute path (`/assets/...`). Avoid importing from page folder for public logos.

## 6. Routing & Navigation
- Keep all route additions centralized in `Routes.jsx`; wrap with `ErrorBoundary` + `ScrollToTop` (already present). Do not instantiate extra Routers inside feature modules.
- Preserve legacy route aliases until explicit cleanup; when refactoring, ensure both new & old paths keep working (update tests accordingly once test harness added).

## 7. State & Data Handling
- Currently mostly local component state + mock asynchronous patterns. Introduce Redux Toolkit only for cross-page or persisted UI/ domain state (already included in deps but unused here).
- When integrating APIs: confine fetch/mutation logic to a thin service module (create `src/services/{domain}.js`) and keep wizard / channel pages lean.
- Keep derived logic (e.g. gating buttons, filtering available channels) as pure helper functions for easier unit testing.

## 8. Adding a New Channel
1. Extend traffic source config if tied to a specific acquisition source.
2. Add channel config mapping inside `getChannelConfig()` (icon, colors, description).
3. Create `pages/channel-{name}/index.jsx` modeled after existing channel pages (layout + sidebar offset + status pill + connect flow).
4. Register route in `Routes.jsx`.
5. Add custom icon or logo to `AppIcon.jsx` if brand-specific.

## 9. Postbacks Pattern
- Individual status URLs & toggles live on the postbacks page (not included here—see `pages/thread-postbacks`). Maintain separation: wizard just links out after creation.

## 10. Tailwind / Theming Rules
- Prefer existing spacing tokens (`header-height`, `sidebar-width`) and responsive grids (`xl:grid-cols-...`). Avoid hard-coded pixel widths for layouts—use grids & flex composition.
- For new semantic colors: extend CSS variable mapping instead of raw hex to maintain theming flexibility.

## 11. Error & Loading UX
- Use optimistic spinners with `<Icon name="Loader2" className="animate-spin" />` pattern. Keep disabled state via `opacity-50 cursor-not-allowed` and avoid duplicating inline style attributes.

## 12. Performance & DX Tips
- Vite auto reload + fast HMR; keep large mock data arrays small or lazy if they grow.
- Co-locate feature-specific helpers inside the page folder if only used there; promote to `src/utils/` only when reused.

## 13. What NOT to Do
- Do not bypass `Icon` abstraction.
- Do not add global CSS outside Tailwind utilities / variables layer.
- Do not duplicate route declarations across components.
- Avoid adding step logic directly inside JSX without helper functions (maintain readability).

## 14. Quick Reference Examples
- Add channel icon: `if (name === 'NewBrand') return <img src="/assets/images/newbrand.png" .../>;`
- Gate Next button: `disabled={!canProceed() || isSubmitting}` consistent with wizard.
- Status pill example: `<div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Подключено</div>`

---
If any architectural intent is unclear (e.g., future API integration layer, Redux adoption timing), ask for clarification before large refactors.
