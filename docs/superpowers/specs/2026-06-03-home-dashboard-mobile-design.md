# Home Dashboard & Mobile Responsiveness — Design Spec
**Date:** 2026-06-03  
**Status:** Approved

---

## Goal
Add a Home dashboard as the default landing page and make the entire app fully mobile-responsive.

---

## New Files

### `frontend/src/components/HomeDashboard.jsx`
- Receives `onSelect(category)` prop from App.jsx
- On mount: fires 5 parallel fetches via `Promise.all`, one per category
  - `GET /api/articles?category=<hebrewCategory>` — takes first 4 results (backend returns newest-first)
- State: one object holding arrays per category + a single `loading` boolean
- Layout: vertical stack of 5 category sections
  - Section header: category label in accent color + "ראה הכל ←" button → calls `onSelect(category)`
  - Horizontal scroll strip: `flex gap-3 overflow-x-auto pb-2 scrollbar-none`
  - Each strip contains `<ArticleCardCompact>` items

### `frontend/src/components/ArticleCardCompact.jsx`
- Fixed height `h-20`, flex row layout
- Left: 80×80 thumbnail (or category-colored fallback square using existing `CATEGORY_FALLBACK` palette)
- Right: source badge, title (2-line clamp), tag
- `min-w-[280px]` to prevent squishing in scroll strip
- No summary text, no "קרא עוד" — entire card is clickable, opens `<ArticleModal>`
- Uses `imgError` state pattern (same as ArticleCard)

### `frontend/src/components/BottomNav.jsx`
- `fixed bottom-0 left-0 right-0 z-50 lg:hidden`
- Height `h-16`, background `#0c0c0e`, top border `border-[#222228]`
- 6 buttons: Home + 5 categories (AI & Tech, Football, Sports, Entertainment, Global News)
- Active: accent color + small glow dot above icon. Inactive: `#555560`
- iOS-safe: `pb-safe` padding for home indicator

---

## Modified Files

### `App.jsx`
- Default state: `useState('Home')` instead of `'Football'`
- `CATEGORY_MAP` and `CATEGORY_META` unchanged (no 'Home' entry needed there)
- Conditional render:
  ```
  activeCategory === 'Home'
    ? <HomeDashboard onSelect={setActiveCategory} />
    : <existing category view>
  ```
- Header/SubNavbar only render when `activeCategory !== 'Home'`
- Main content: add `pb-16 lg:pb-0` to prevent bottom nav overlap on mobile

### `Sidebar.jsx`
- Add `Home` as first NAV_ITEM (house icon, accent `#ffffff` or neutral)
- Wrap entire sidebar `<aside>` in `hidden lg:block` — desktop only, BottomNav handles mobile
- Remove mobile hamburger button and overlay (replaced by BottomNav)

---

## Layout Breakpoints

| Breakpoint | Sidebar | Bottom Nav | Content padding |
|---|---|---|---|
| `< lg` (mobile) | hidden | visible (`fixed bottom-0`) | `pb-16` |
| `lg+` (desktop) | visible (`fixed left-0`) | hidden | `pl-[260px]` |

---

## Data Flow

```
App.jsx
  activeCategory (state) ──► Sidebar (desktop)
                         ──► BottomNav (mobile)
                         ──► HomeDashboard (when 'Home') → fires 5 fetches
                         ──► Category view (when not 'Home') → fires 1 fetch
```

---

## Out of Scope
- No backend changes
- No changes to ArticleCard, SubNavbar, ArticleModal
- No pagination or infinite scroll on HomeDashboard strips
