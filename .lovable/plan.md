

## Problem

The Job Board application flow breaks when transitioning from the screening questions step to the resume upload step. Instead of showing the upload form, the page jumps to the Pricing section.

**Root cause:** Two compounding issues:
1. **Duplicate section IDs** — `JobBoard.tsx` renders its own `<section id="jobs">`, but `Index.tsx` also wraps it in `<section id="jobs">`. This confuses the `IntersectionObserver`.
2. **AnimatePresence content collapse** — When switching steps, `AnimatePresence mode="wait"` removes the old content before mounting the new content. During this brief gap, the JobBoard section height collapses to near-zero, causing the Pricing section to scroll into view and become the "active" section.

## Plan

### Step 1: Remove duplicate section wrapper
In `JobBoard.tsx`, change the root `<section id="jobs">` to a plain `<div>` (since `Index.tsx` already provides the `<section id="jobs">` wrapper).

### Step 2: Add minimum height to prevent layout collapse
Add a `min-h-[400px]` class to the JobBoard container so that during `AnimatePresence` transitions, the section maintains enough height to prevent the pricing section from scrolling into the viewport.

### Step 3: Scroll to top of section on step change
When transitioning between steps (list → questions → upload → done), scroll the jobs section into view so the user always sees the current step content, not the pricing section below.

---

**Technical detail:** The fix is entirely in `src/components/JobBoard.tsx` — changing the outer element from `<section id="jobs">` to `<div className="min-h-[400px]">` and adding a `scrollIntoView` call when steps change.

