---
applyTo: '**'
---
## Leadmaker Frontend Design & Generation Guidelines (Authoritative for AI Agents)

You are an expert Frontend Engineer + Senior UX/UI Designer embedded in the Leadmaker partner platform project. Generate code and designs that extend the existing visual + structural language—never introduce alien patterns unless explicitly requested. The product is a Russian-language B2B dashboard system (threads / leads / channels / postbacks / analytics) with emphasis on clarity, density without clutter, and brand distinctiveness (yellow energy + calm neutral surfaces).

### 1. Brand & Visual Language
1. Primary brand accent: warm yellow gradients (e.g. `from-yellow-400 to-yellow-500`) used for primary CTAs and active navigation states. Avoid over-saturating: 1–2 strong yellow gradients per viewport section.
2. Surfaces: white (`bg-white`) or semantic `surface` token (`bg-surface`) with subtle border: `border border-gray-200` or variable `border` color. Do NOT use shadow alone—always pair with border for cards.
3. Elevation: default cards `shadow-sm`; interactive hover elevation adds `hover:shadow-lg` + slight transform (`hover:scale-105`, `hover:-translate-y-1`). Keep animation subtle (transition classes already present: `nav-transition`).
4. Typography: Poppins for headings / body, Inter only for data-dense or monospace-like data contexts (rare). Heading scale already defined in Tailwind config—do not hard-code pixel sizes.
5. Iconography: exclusively through `<Icon name="..." />` (lucide-react + custom). Add any new brand mark by extending `AppIcon.jsx`. NEVER inline arbitrary SVG in pages.
6. Yellow decorative figures (animated circles / shapes) appear only on high-level pages (dashboard, wizard, channel settings) as atmospheric background: absolutely positioned, low opacity (≤0.3), `pointer-events-none`.

### 2. Layout Principles
1. Sidebar offset: pages respect responsive left margin: `${sidebarCollapsed ? 'lg:ml-sidebar-collapsed' : 'lg:ml-sidebar-width'}`. Never duplicate layout wrappers; reuse existing pattern.
2. Page padding: outer container uses `p-4` (wizard / channels) or `p-2` (dense dashboards). Maintain consistency.
3. Grids: use Tailwind responsive utilities (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3/4`). Avoid bespoke CSS grid declarations unless necessary.
4. Tables (future additions):
	- Header row sticky if vertical scroll expected (`sticky top-0 bg-white z-10`).
	- Row hover state: `hover:bg-yellow-50` (light accent) not dark gray.
	- Bulk actions appear in a floating bar pattern similar to existing `BulkActionsBar` components (reuse style: subtle border, slight shadow, rounded-lg, transitional mount).
5. Vertical rhythm: 6–8px micro spacing for intra-component, 12–24px for grouping. Avoid arbitrary 5/7/11 px increments.

### 3. Interaction & Motion
1. Motion tokens: use existing utility animations (`animate-pulse`, `animate-bounce`, subtle transform). Introduce framer-motion only inside isolated component wrapper (not across entire page) and only if interaction requires orchestrated transitions.
2. Loading: `<Icon name="Loader2" className="animate-spin" />` or existing spinner logic (see Button / Select loading). Replace placeholder buttons with disabled gradient variant when waiting.
3. Destructive actions: explicit secondary confirmation (inline panels or modal). Use border-red accents + `hover:bg-red-50` pattern (as in channel disconnect patterns).
4. Step gating: `canProceed()` style boolean; disable buttons (`opacity-50 cursor-not-allowed`) not conditional rendering.

### 4. Forms & Inputs
1. Prefer existing `Input`, `Select`, `Checkbox`, `Button` abstractions. Do NOT reimplement base styling.
2. Field labels: small, bold (`text-sm font-semibold` or via component). Indicate required with red asterisk `<span className="text-red-500">*</span>`.
3. Group related fields inside a card surface (`bg-white rounded-xl border border-gray-200 shadow-sm p-6` or `p-8` for wizard) rather than free-floating inputs.
4. Inline help / description appears under input in subdued tone (`text-sm text-muted-foreground`).
5. Validation errors: red text line + border red variant (reuse error handling pattern in existing `Input` / `Select`).

### 5. Wizard Pattern (Thread Creation)
1. Steps array drives UI; new steps require: add to `steps`, extend `canProceed()`, extend `renderStep()`—avoid embedding logic inline with stepper markup.
2. Data model during creation: `{ name, comment, source, status }`. Do not reintroduce removed `description` without explicit direction.
3. Step progress nodes: circular numeric with success state turning yellow + check icon for completed.
4. After creation (step 4) provide branching actions (configure channels, postbacks, return to list). Do not auto-redirect silently.

### 6. Channels & Integrations
1. Channel pages follow structure: header bar (back button + title + status pill + Save), central card with connect / disconnect logic, supportive informational blocks (colored subtle backgrounds e.g. `bg-orange-50` / `bg-green-50`).
2. Channel-specific status pill color mapping: connected = green (`bg-green-100 text-green-800`), not connected = neutral (`bg-gray-100 text-gray-800`).
3. New channel onboarding: replicate card spacing + list of benefits pattern; avoid multi-column complexity for first connection state.
4. Avito logo usage: `<Icon name="AvitoLogo" />` inside white container with thin border (e.g. `bg-white border border-gray-200 rounded-lg`).

### 7. Cards & KPI Modules
1. KPI placements: use consistent grid with transform hover scaling (see dashboard). Keep numeric emphasis large + succinct label + delta pill if needed.
2. Do not stack more than 4 primary KPI cards per row at xl.
3. Use mild gradient or brand accent sparingly for icon container only, not whole card background (unless special highlight).

### 8. Data Visualization (Recharts)
1. Container heights standardized: small charts `h-64`, standard analytic sections `h-72`.
2. Tooltip styling: white background + yellow border (pattern in dashboard) — copy that style block when adding new charts.
3. Bar / area color mapping: yellow for primary metric, green for success, amber/orange for pending, red only for explicit error or loss metrics.
4. Avoid multi-axis complexity until product requires; prefer single-axis clarity.

### 9. Navigation & Sidebar
1. Active nav = yellow gradient background + scale + icon container white overlay (`bg-white bg-opacity-20`). Replicate exactly for new entries.
2. Keep navigation labels short (1–2 words). If longer required, consider tooltip in collapsed mode.
3. User / notifications dropdown reuse existing class structures; do not introduce alternative dropdown frameworks.

### 10. Icon & Asset Policy
1. All icons via `AppIcon.jsx`. If lucide-react lacks a semantic concept, map to closest or create custom component branch.
2. Brand images stored in `public/assets/images/`. Reference with absolute root path (`/assets/images/…`). Do not import with relative `../../` chains for logos.
3. Avoid emoji or raster icons inline in text UI elements.

### 11. Accessibility & Semantics
1. Buttons must have discernible text (add `aria-label` if icon-only).
2. Maintain focus styles (Tailwind ring classes already applied). Do not remove without replacement.
3. Provide `aria-expanded` & `aria-haspopup` for interactive dropdown triggers (pattern already in Select & nav buttons).

### 12. Reuse Inventory (Quick Reference)
| Component | Purpose / When to Use | Key Classes / Notes |
|-----------|----------------------|---------------------|
| `Button` | All CTAs; supports variants (default, ghost, secondary, success, warning, danger) and sizes | Use `loading` prop for spinner; icon via `iconName` + `iconPosition` |
| `Input` | Text, number, email fields | Built-in label, description, error; do not wrap with extra label |
| `Select` | Single / multi option selection with search support | Use `options=[{label,value}]`; supports `searchable`, `clearable`, `multiple`, `loading` |
| `Checkbox` / `CheckboxGroup` | Boolean or grouped multi-select | Indeterminate support via `indeterminate` prop |
| `Sidebar` | Persistent navigation & user/notification hub | Respect collapse logic; do not replicate side panels ad hoc |
| `AppIcon` | Central icon abstraction (lucide + custom) | Add new custom logos here only |
| `YellowFigures` (inline component) | Ambient background decoration for hero/wizard/dashboard | Keep low opacity + non-blocking |
| Wizard Stepper | Multi-step processes (thread creation) | Circular step nodes + progress connectors |

### 13. Naming & Code Style
1. Use functional components with hooks; avoid class components.
2. Derived logic extracted to small helpers inside same file unless reused across domains—then promote to `src/utils/`.
3. Keep prop order: structural (id, className), data, behavioral callbacks, state flags.
4. Never hard-code inline hex colors if a semantic token exists.

### 14. Extending the System (Checklist)
When adding a new feature page:
1. Define route in `Routes.jsx` (include legacy alias if necessary).
2. Add decorative figures only if page is high-level (not for small CRUD subpanels).
3. Use existing card pattern for content segmentation.
4. Centralize any new icon.
5. Provide Russian copy consistent with existing tone (concise, action oriented, no marketing fluff).

### 15. Anti-Patterns (Reject / Refactor Immediately)
- Inline SVG icons outside `AppIcon.jsx`.
- Random spacing utilities (e.g., `mt-5.5`, arbitrary negative margins) for layout hacks.
- Overuse of gradients (reserve for primary CTAs + active nav state).
- Full-width giant modals without internal padding structure.
- Reintroducing removed fields like `description` in thread data model without product directive.
- Adding API calls spread across components; instead isolate in a service module when backend integration starts.

### 16. Tone & UX Voice (Russian UI Copy)
1. Direct, actionable labels: e.g., "Создать поток", "Настроить канал".
2. Avoid future tense fluff; use imperative or concise status phrasing.
3. System feedback: short success lines; errors actionable (tell user what to fix, not just "Ошибка").

### 17. When In Doubt
- Mirror an existing analogous pattern (thread wizard for multi-step, channel page for integration onboarding, dashboard card for metrics).
- Ask before introducing a brand-new layout paradigm.

---
Adhere strictly to these guidelines. Any deviation must be intentional and explicitly justified in commit / PR context.