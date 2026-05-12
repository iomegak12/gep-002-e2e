# Order Oasis — Dark-Mode Audit Report

**Date:** 2026-05-11
**Scope:** Dark mode only. Light-mode versions are noted for context but not audited for quality.
**Reference style (chosen by product):** Warm near-black background + gold/amber accent + glass-style dark cards, as in the screenshot the user attached.

> **Update (2026-05-12):** A complete consistent dark-mode mock set covering all 26 screens has been built at [mocks/](mocks/index.html). The original design-team folder referenced throughout this audit has since been moved to [archives/stitch_order_oasis_ui_design/](archives/stitch_order_oasis_ui_design/). Path references below still point to the original location for historical clarity; substitute `archives/stitch_order_oasis_ui_design/` in place of `stitch_order_oasis_ui_design/` if you need to open one.

---

## 1. Headline Finding

**The existing dark-mode mocks fall into four mutually inconsistent palette buckets.** Only two of the twelve dark-mode folders use the warm-dark + amber language the user chose as the reference. Everything else uses a different visual system — three different ones in fact. This requires a decision before mock generation can proceed: either re-do most of the existing dark screens to match the reference, or accept a different in-repo reference. See **§6 Decision Point**.

---

## 2. Coverage Table

Status legend:
- ✅ **Have (dark)** — a dark-mode folder exists.
- 🟡 **Light only** — only a light-mode folder exists; dark version needs to be generated.
- ❌ **Missing** — no folder for this screen in either mode.

| Spec ID | Screen | Status | Existing folder | Disposition |
|---|---|---|---|---|
| S01 | Login | ✅ Have (dark) | `login_screen_dark_mode` | Keep / regenerate to match reference (see §3) |
| S02 | Admin Reset Password | ❌ Missing | — | Generate |
| S03 | Change My Password | ✅ Have (dark) | `my_profile_dark_mode` | Keep / regenerate |
| S04 | App Shell / Top Nav | (implicit) | every dark folder | Establish in shared CSS during mock generation |
| S05 | Not-Found / Forbidden / Error | ❌ Missing | — | Generate (3 mocks) |
| S10 | Supplier Directory | ✅ Have (dark) | `suppliers_dark_mode` | **Keep — palette already matches reference** |
| S11 | Supplier Detail + Scorecard | ✅ Have (dark) | `supplier_detail_dark_mode` | Keep / regenerate |
| S12 | Create Supplier | ❌ Missing | — | Generate |
| S13 | Edit Supplier | ❌ Missing | — | Reuse S12 |
| S14 | Supplier Status Modals (approve / deactivate / reactivate / blacklist) | ❌ Missing | — | Generate (single page with all four modals) |
| S20 | PO List | ✅ Have (dark) | `purchase_orders_dark_mode` | **Keep — palette already matches reference** |
| S21 | PO Detail (Buyer) | ✅ Have (dark) | `po_detail_view_dark` | Keep / regenerate |
| S22 | Create PO Wizard | 🟡 Partial | `create_po_wizard_step_1_dark` (step 1 only) | Audit step 1; generate steps 2 / 3 / 4 |
| S23 | Edit PO (DRAFT) | ❌ Missing | — | Reuse S22 wizard |
| S24 | PO action modals (submit / cancel / fulfill / close) | ❌ Missing | — | Generate (single page with all four) |
| S30 | Approval Queue | ✅ Have (dark) | `approval_queue_dark_mode` | Keep / regenerate |
| S31 | PO Detail (Approver) | ✅ Have (dark) | `po_detail_approver_view_dark_mode` | Keep / regenerate |
| S32 | Reject PO Modal | 🟡 Light only | `reject_po_modal_light` | Generate dark version |
| S40 | Spend Analytics Dashboard | ✅ Have (dark) | `dashboard_dark_mode` | Keep / regenerate |
| S41 | Supplier Aggregations Dashboard | 🟡 Light only | `supplier_aggregations_light` | Generate dark version |
| S42 | Cycle-Time / Pending widgets | ✅ Have (dark) | `efficiency_analytics_dark` | Keep / regenerate |
| S50 | User Management List | 🟡 Light only | `user_management_light` | Generate dark version |
| S51 | Create User | ✅ Have (dark, assumed shared) | `user_form_dark` | Verify; reuse for S52 |
| S52 | Edit User | ✅ Have (dark, assumed shared) | `user_form_dark` | Verify |
| S53 | Reset User Password | ❌ Missing | — | Generate as modal inside S52 |
| S54 | Pending Supplier Approvals | 🟡 Light only | `pending_supplier_approvals_light` | Generate dark version |

**Totals:**
- Have dark: 12 folders
- Light-only (needs dark version): 4 folders → S32, S41, S50, S54
- Missing entirely: 7 screens → S02, S05 (×3), S12 / S13, S14, S22 (steps 2–4), S24, S53

---

## 3. Visual-Consistency Analysis

Each dark-mode folder declares a Tailwind colour palette in its `code.html`. I extracted the `background`, `surface`, `on-surface`, and `primary` token values from every dark folder. The dark mocks fall into **four buckets**:

### Bucket A — Token-broken (claims dark in folder name but defines LIGHT tokens)

These eight folders use DESIGN.md's *light* color tokens (`background: #f8f9ff`, `surface: #f8f9ff`, `on-surface: #0b1c30`, `primary: #00685f` deep teal) but the body element sets `bg-inverse-surface` (`#213145`) so the page renders dark by inversion rather than by an actual dark palette. The effect: muddy, the typography and accent colors don't fully invert, and the look differs visibly from any cohesive dark-mode language.

- `login_screen_dark_mode`
- `my_profile_dark_mode`
- `create_po_wizard_step_1_dark`
- `po_detail_view_dark`
- `po_detail_approver_view_dark_mode`
- `supplier_detail_dark_mode`
- `efficiency_analytics_dark`
- `user_form_dark`

### Bucket B — Material Design dark

One folder uses Google's Material dark recipe: `background: #121212`, `surface: #1e1e1e`, `primary: #ffffff` (white as primary), with `tertiary: #fbbc04` (Google amber).

- `dashboard_dark_mode`

This is the closest of the existing screens to the reference screenshot **in tone** (warm dark, amber tertiary), but the primary is white rather than amber. Charts use Material colors, not a coordinated amber palette.

### Bucket C — Slate-blue dark with neon teal

One folder uses a cool slate-blue dark with neon teal: `background: #09111a`, `surface: #121b26`, `primary: #2dd4bf` (neon teal). Cool palette, not warm.

- `approval_queue_dark_mode`

### Bucket D — Warm-dark with amber primary (matches the reference screenshot)

Two folders use the language we want: warm dark canvas with an amber primary.

| Folder | `background` | `surface` | `primary` |
|---|---|---|---|
| `purchase_orders_dark_mode` | `#1f1f1f` | `#222222` | `#f2c94c` (amber) |
| `suppliers_dark_mode` | `#121212` | `#1A1A1A` | `#FFB23D` (amber) |

These two are also slightly inconsistent **with each other** (different amber shades, different surface levels), but both are clearly on-brief vs. the reference screenshot.

### Summary visualisation

```
Bucket  Vibe                                  Count   Matches reference?
A       Light tokens inverted with dark bg     8      No
B       Material dark (white primary + amber)  1      Partial (warm tone, wrong primary)
C       Slate-blue + neon teal                 1      No
D       Warm dark + amber primary              2      Yes
```

**Out of 12 dark folders, only 2 (16 %) match the chosen reference style.**

---

## 4. Brand & Reference Style — Specifics Captured

From the user's reference screenshot (the dashboard PNG attached in chat):
- Canvas: very dark warm near-black, subtle gradient (≈ `#0F1115` → `#14171C`).
- Cards: `≈ #1A1D23` with a 1 px subtle border (`≈ #262A30`) and a soft top-edge highlight; modal/dropdown surfaces slightly lighter (`≈ #1F232A`).
- Primary accent: gold/amber `≈ #E8B14C`. Status pills use a soft amber wash `≈ rgba(232,177,76,0.18)`.
- Primary text: warm off-white `≈ #F4F0E8`. Muted text: `≈ #8E94A0`.
- Hero banner pattern: dark card with a gold-gradient panel on the left ("Connect your HR, finance, and operations teams") and abstract geometric art on the right.
- Metric tiles: very large display number (~32 px) + small amber status pill + supporting muted text below.
- Section cards: rounded 8 px, generous padding, lists with date column on the left, task title centre, action button right-aligned.
- Side rail: ~64 px collapsed icon-only nav with a brand mark at the top.
- Typography: clean sans (compatible with Roboto from DESIGN.md). Numbers are large and bold; secondary text is small and muted.

This style is **compatible** with DESIGN.md's typography/spacing/density rules — only the palette diverges.

---

## 5. Folder Disposition

### 5.1 Archive (light folders that have a dark twin) — 7 folders

These light-mode folders no longer add information; their dark counterparts exist. Move them to `gep-front-end/docs/archives/light-mode-duplicates/`.

- `approval_queue_light_mode`
- `create_po_wizard_step_1_light`
- `dashboard_light_mode`
- `po_detail_approver_view_light`
- `po_detail_view_light`
- `purchase_orders_light_mode`
- `suppliers_light_mode`

### 5.2 Keep in place (light-only — still serving as reference)

These light-mode folders are the only existing visual for their screen. Keep them until their dark version is generated; then they can also be archived.

- `pending_supplier_approvals_light` (S54)
- `reject_po_modal_light` (S32)
- `supplier_aggregations_light` (S41)
- `user_management_light` (S50)

### 5.3 Source material — never archive

- `order_oasis/DESIGN.md` (typography, spacing, layout reference)
- every `*_dark` / `*_dark_mode` folder (the existing dark mocks)

---

## 6. Decision Point Required From You

The plan we agreed says "follow the screenshot strictly." Combined with the audit findings, that has a real cost: **10 of the 12 existing dark-mode folders do not match the reference and would need to be regenerated** to be visually consistent. Three reasonable ways to resolve:

### Option A — Follow the screenshot strictly (full consistency, biggest rework)
- Keep only the two Bucket-D folders as-is (`purchase_orders_dark_mode`, `suppliers_dark_mode`).
- Regenerate the other 10 dark folders to use the warm-dark + amber language.
- Generate all 11 missing screens in the same language.
- **Result:** total visual coherence across the app.
- **Cost:** rework of 10 + new of 11 = 21 dark screens.

### Option B — Adopt the screenshot palette but only for *missing* screens (smallest rework)
- Leave the existing 12 dark folders untouched (accept the inconsistency).
- Generate only the 11 missing dark screens in the warm-dark + amber language.
- **Result:** the *new* screens are coherent with each other and with the reference; the existing screens remain a patchwork.
- **Cost:** lowest. But the product as a whole will still look inconsistent.

### Option C — Switch the reference (use Bucket D as the in-repo canon)
- Treat `purchase_orders_dark_mode` + `suppliers_dark_mode` as the canonical palette (warm dark `#1A1A1A` surface + amber `#FFB23D` primary — already in code).
- Regenerate the other 10 dark folders to match Bucket D.
- Generate the 11 missing screens in Bucket D.
- **Result:** total coherence; uses palette values that already shipped from the design team.
- **Cost:** same rework volume as Option A, but the reference is a real file the designer can sample directly instead of a screenshot from a different product.

> My recommendation is **Option C**: it's the same effort as A, anchored to actual in-repo source the design team already produced, and within a hair of the reference screenshot visually. A and C produce nearly identical results.
>
> Option B is the cheapest but leaves the product visually inconsistent — which is exactly what you flagged.

I'll proceed once you choose. The mock-generation deliverable (HTML/CSS) shape doesn't change between A and C — only the exact hex values in `tokens.css`.

---

## 7. What Happens Next (after your decision)

1. **You choose A, B, or C.**
2. **Archive operation** — move the 7 light-twin folders (§5.1).
3. **If A or C:** I produce regeneration prompts for the 10 inconsistent dark folders (for the design team to re-run in their tool), *and* I generate the 11 missing dark mocks as HTML/CSS in `gep-front-end/docs/mocks/`. If B: I only generate the 11 missing mocks.
4. Both paths end with `gep-front-end/docs/mocks/index.html` linking every mock for browser review.

---

## Appendix — Raw palette values per dark folder

| Folder | background | surface | on-surface | primary | Bucket |
|---|---|---|---|---|---|
| `login_screen_dark_mode` | `#f8f9ff` | `#f8f9ff` | `#0b1c30` | `#00685f` | A |
| `my_profile_dark_mode` | `#f8f9ff` | `#f8f9ff` | `#0b1c30` | `#00685f` | A |
| `create_po_wizard_step_1_dark` | `#f8f9ff` | `#f8f9ff` | `#0b1c30` | `#00685f` | A |
| `po_detail_view_dark` | `#f8f9ff` | `#f8f9ff` | `#0b1c30` | `#00685f` | A |
| `po_detail_approver_view_dark_mode` | `#f8f9ff` | `#f8f9ff` | `#0b1c30` | `#00685f` | A |
| `supplier_detail_dark_mode` | `#f8f9ff` | `#f8f9ff` | `#0b1c30` | `#00685f` | A |
| `efficiency_analytics_dark` | `#f8f9ff` | `#f8f9ff` | `#0b1c30` | `#00685f` | A |
| `user_form_dark` | `#f8f9ff` | `#f8f9ff` | `#0b1c30` | `#00685f` | A |
| `dashboard_dark_mode` | `#121212` | `#1e1e1e` | `#e3e3e3` | `#ffffff` (tertiary `#fbbc04`) | B |
| `approval_queue_dark_mode` | `#09111a` | `#121b26` | `#cbd5e1` | `#2dd4bf` | C |
| `purchase_orders_dark_mode` | `#1f1f1f` | `#222222` | `#e0e0e0` | `#f2c94c` | **D** |
| `suppliers_dark_mode` | `#121212` | `#1A1A1A` | `#E0E0E0` | `#FFB23D` | **D** |

End of audit.
