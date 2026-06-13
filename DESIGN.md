---
name: HMD Secure AI-Native CRM
description: A high-density operational workspace for shared customer, pipeline, case, and forecast decisions.
colors:
  field-black: "#0A0A0B"
  operational-anthracite: "#242426"
  raised-anthracite: "#303033"
  dirty-white: "#FAFAFA"
  secondary-text: "#B6B6B8"
  structural-rule: "#3A3A3D"
  signal-lime: "#E4FF00"
  warning-amber: "#FFC857"
  danger-red: "#FF5A5F"
  success-green: "#60D394"
typography:
  headline:
    fontFamily: "Archivo, Arial Nova, Helvetica, sans-serif"
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Archivo, Arial Nova, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, Arial Nova, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 450
    lineHeight: 1.5
  label:
    fontFamily: "Archivo, Arial Nova, Helvetica, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "0.01em"
rounded:
  control: "4px"
  surface: "8px"
  tag: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  compact: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.signal-lime}"
    textColor: "{colors.field-black}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.operational-anthracite}"
    textColor: "{colors.dirty-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "44px"
  input-default:
    backgroundColor: "{colors.field-black}"
    textColor: "{colors.dirty-white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  panel-default:
    backgroundColor: "{colors.operational-anthracite}"
    textColor: "{colors.dirty-white}"
    rounded: "{rounded.surface}"
    padding: "24px"
---

# Design System: HMD Secure AI-Native CRM

## Overview

**Creative North Star: "The Operational Fieldbook"**

This system translates HMD Secure's public industrial identity into a working
application: near-black fields, anthracite working surfaces, dirty-white type,
and acid lime used as a scarce operational signal. It should feel prepared and
dependable, like equipment designed for repeated use, while retaining direct,
human language.

The interface is high-density but deliberately structured. Dividers, alignment,
type weight, and spacing establish hierarchy before containers or decoration.
Its interaction model takes cues from Attio's records, lists, configurable
views, inline editing, and table/kanban fluidity, plus Clay's visible
input-to-output enrichment model, row-level execution states, and reviewable AI
results. These are behavioral references only; HMD Secure remains the visual
and verbal identity. The system rejects generic SaaS softness, theatrical AI
styling, tactical cosplay, consumer marketing layouts transplanted into a CRM,
and pixel-for-pixel imitation of either reference product.

**Key Characteristics:**

- Dark, restrained, and high contrast.
- Compact product typography with blunt hierarchy.
- Crisp structural rules and low-radius controls.
- Rare accent color tied to action, focus, or selection.
- Light document surfaces reserved for offers and forecast sheets.
- Spreadsheet-speed editing with record-level context always close at hand.
- AI output placed inside the data workflow with visible provenance and state.

## Colors

The palette is mostly monochrome; signal lime and semantic colors appear only
when they communicate action or state.

### Primary

- **Signal Lime** (`#E4FF00`): primary actions, current selection, focus
  emphasis, and small high-value indicators. Keep below roughly 10% of a screen.

### Neutral

- **Field Black** (`#0A0A0B`): application frame and deepest working field.
- **Operational Anthracite** (`#242426`): navigation, panels, and grouped
  working regions.
- **Raised Anthracite** (`#303033`): hover, selected-neutral, and nested
  working layers.
- **Dirty White** (`#FAFAFA`): primary text and paper-like document surfaces.
- **Secondary Text** (`#B6B6B8`): supporting text that still meets contrast
  requirements.
- **Structural Rule** (`#3A3A3D`): 1px dividers and control borders.

### Tertiary

- **Warning Amber** (`#FFC857`): approaching deadlines and at-risk records.
- **Danger Red** (`#FF5A5F`): overdue, blocked, failed, or destructive states.
- **Success Green** (`#60D394`): confirmed completion and approved states.

**The Signal Budget Rule.** Lime identifies action or active state, amber and
red identify genuine risk, and neutral records remain neutral.

## Typography

**Display Font:** Archivo (with Arial Nova and Helvetica fallbacks)

**Body Font:** Archivo (with Arial Nova and Helvetica fallbacks)

**Character:** A sturdy grotesk with enough width and weight range for dense
tables, direct headings, and operational labels. Product consistency is more
important than decorative font pairing.

### Hierarchy

- **Headline** (650, 2rem, 1.1): page and primary record headings.
- **Title** (650, 1.25rem, 1.2): panel and workflow section headings.
- **Body** (450, 1rem, 1.5): descriptions, timeline entries, and form content;
  prose is capped at 70ch.
- **Label** (650, 0.8125rem, 0.01em): controls, metadata, compact table headers,
  and status labels. Uppercase is reserved for short system labels.

**The Blunt Hierarchy Rule.** Use weight, spacing, and a small number of clearly
separated sizes; do not scatter tiny tracked eyebrows across every section.

## Elevation

The system is flat by default. Depth comes from tonal layering, 1px rules, and
overlap. Shadows are reserved for temporary floating UI such as menus,
tooltips, and drawers; content panels do not receive generic ambient shadows.

### Shadow Vocabulary

- **Floating UI** (`0 8px 24px rgba(0, 0, 0, 0.32)`): menus and tooltips only.
- **Drawer Edge** (`0 0 24px rgba(0, 0, 0, 0.24)`): separates an open drawer
  from the workspace.

**The Flat-By-Default Rule.** A resting surface uses tone and borders, not a
rounded rectangle with a soft drop shadow.

## Components

Components feel precise, compact, and predictable. Every interactive component
has default, hover, focus, active, disabled, loading, and error behavior where
applicable.

### Buttons

- **Shape:** low-radius rectangle (`4px`), minimum `44px` height.
- **Primary:** signal-lime fill, field-black text, `12px 16px` padding.
- **Hover / Focus:** darken the lime slightly on hover; use a visible 2px focus
  outline with offset. Motion stays within 150-200ms.
- **Secondary:** anthracite fill or a structural-rule border.
- **Ghost:** text and icon only, used for low-priority local actions.

### Chips

- **Style:** compact pill only when containment clarifies a filter or status.
- **State:** active filters may use signal lime; semantic statuses use text,
  icon, and color together.

### Cards / Containers

- **Corner Style:** `8px` maximum for working panels.
- **Background:** anthracite layers over field black.
- **Shadow Strategy:** none at rest.
- **Border:** optional 1px structural rule.
- **Internal Padding:** `16px` compact, `24px` standard, `32px` spacious.

### Inputs / Fields

- **Style:** field-black or anthracite fill, 1px rule, `4px` radius, and a
  persistent programmatic label.
- **Focus:** signal-lime border or outline without changing layout.
- **Error / Disabled:** text and icon accompany color; disabled values remain
  readable.

### Navigation

Navigation uses the same dark field as the application frame. Active items are
identified by weight, contrast, and a compact lime indicator or fill, never a
decorative side stripe. Narrow layouts collapse navigation structurally while
preserving every critical destination.

### Record Views

- **Table:** the default for dense comparison, bulk updates, forecasting, and
  Finance work. Cells support direct editing without turning every value into a
  visible input at rest.
- **Kanban:** a view over the same records for pipeline and case stages, not a
  separate data structure.
- **Saved Views:** persist columns, filters, sorting, grouping, and layout per
  role or workflow. Switching views must not duplicate records.
- **Record Detail:** open in a context-preserving split view or drawer when
  practical, keeping the originating list visible.

### Evidence-Grounded AI Suggestion

AI suggestions use a normal working surface, a concise proposed action, and
visible source records or timeline signals. Generated, inferred, confirmed, and
locked states are labelled explicitly.

### AI-Enriched Field

Inspired by Clay's structured execution model and Attio's AI attributes:

- Show the input fields or timeline events used to produce a result.
- Expose queued, running, complete, needs-review, failed, and stale states.
- Keep generated values visually distinct from confirmed CRM values.
- Support per-row and selected-row execution, retry, cancel, and accept.
- Put confidence and source links near the output when available.
- Never apply stage, forecast, approval, or customer-facing changes silently.

## Do's and Don'ts

### Do:

- **Do** use `#E4FF00` sparingly for primary action, focus, and active state.
- **Do** keep account, deal, case, offer, and timeline context visibly
  connected.
- **Do** use compact tables and split views when they improve scanning.
- **Do** separate device revenue from service revenue and expose time phasing.
- **Do** show the evidence behind AI recommendations and keep drafts editable.
- **Do** meet WCAG 2.2 AA and honor reduced-motion preferences.
- **Do** borrow Attio's object/list/view clarity, inline editing, and
  context-preserving record navigation.
- **Do** borrow Clay's visible enrichment pipeline, row-level status, batch
  controls, source provenance, and explicit review.

### Don't:

- **Don't** build a generic SaaS dashboard composed entirely of soft cards.
- **Don't** use cyan-on-navy or purple-blue AI gradients, glow,
  glassmorphism, or decorative neural imagery.
- **Don't** transplant consumer-phone marketing layouts into product UI.
- **Don't** recreate dense legacy CRM tables without prioritization or
  next-action guidance.
- **Don't** use camouflage, faux terminal styling, excessive warning colors,
  or military iconography.
- **Don't** present AI as magical, autonomous, or more certain than the data.
- **Don't** imply this hackathon prototype is an official HMD production
  service.
- **Don't** use colored side-stripe borders, gradient text, nested cards, or
  decorative analytics.
- **Don't** copy Attio's or Clay's exact branding, layouts, assets, icons, copy,
  or ornamental details.
- **Don't** make a chatbot the primary interface when the action belongs in a
  record, field, table, timeline, or workflow.
