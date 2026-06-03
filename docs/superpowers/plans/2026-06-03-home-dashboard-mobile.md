# Home Dashboard & Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Home dashboard as the default landing page showing horizontal-scroll strips of compact article cards per category, and replace the broken mobile hamburger with a fixed bottom navigation bar.

**Architecture:** `App.jsx` owns `activeCategory` (defaults to `'Home'`); when `'Home'` it renders `<HomeDashboard>`; otherwise the existing category view. Three new focused components are created (`ArticleCardCompact`, `BottomNav`, `HomeDashboard`). `Sidebar` is made desktop-only; `BottomNav` handles all mobile navigation.

**Tech Stack:** React 18, Tailwind CSS, Vite, existing `ArticleModal` component.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `frontend/src/components/ArticleCardCompact.jsx` | Slim 80px-tall card for home strips |
| Create | `frontend/src/components/BottomNav.jsx` | Fixed mobile bottom navigation |
| Create | `frontend/src/components/HomeDashboard.jsx` | Home page with 5 category sections |
| Modify | `frontend/src/components/Sidebar.jsx` | Add Home item; hide on mobile |
| Modify | `frontend/src/App.jsx` | Default to Home; conditional render; wire BottomNav |

---

## Task 1: `ArticleCardCompact.jsx`

**Files:**
- Create: `frontend/src/components/ArticleCardCompact.jsx`

- [ ] **Create the file with this exact content:**

```jsx
import { useState } from 'react';
import ArticleModal from './ArticleModal.jsx';

const CATEGORY_ACCENT = {
  'עולם ה-AI והפיתוח':          { color: '#00d4ff', bg: '#00d4ff18' },
  'חדשות בעולם הספורט':         { color: '#ff6b35', bg: '#ff6b3518' },
  'חדשות בעולם הכדורגל':        { color: '#4ade80', bg: '#4ade8018' },
  'חדשות כלליות בעולם הבידור':  { color: '#f59e0b', bg: '#f59e0b18' },
  'חדשות כלליות בעולם':         { color: '#a78bfa', bg: '#a78bfa18' },
};
const DEFAULT_ACCENT = { color: '#888893', bg: '#88889318' };

export default function ArticleCardCompact({ article }) {
  const [imgError, setImgError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    title = 'Untitled',
    source_name = '',
    category = '',
    image_url = null,
    tag = '',
  } = article ?? {};

  const accent = CATEGORY_ACCENT[category] ?? DEFAULT_ACCENT;
  const showFallback = !image_url || imgError;

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-3 min-w-[280px] h-20 bg-[#141416] border border-[#222228]
                   rounded-xl overflow-hidden hover:border-[#333340] hover:bg-[#161618]
                   transition-all duration-200 text-left flex-shrink-0 px-3"
      >
        {/* Thumbnail */}
        <div
          className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: showFallback
            ? `radial-gradient(ellipse at center, ${accent.color}30 0%, ${accent.bg} 100%)`
            : undefined
          }}
        >
          {!showFallback && (
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span
            className="text-[10px] font-bold tracking-wide font-body"
            style={{ color: accent.color }}
          >
            {source_name}
          </span>
          <p
            className="text-[12.5px] font-bold text-white font-display leading-snug"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </p>
          {tag && (
            <span
              className="text-[10px] font-medium font-body"
              style={{ color: `${accent.color}99` }}
            >
              {tag}
            </span>
          )}
        </div>
      </button>

      {modalOpen && (
        <ArticleModal article={article} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
```

- [ ] **Verify:** File exists at `frontend/src/components/ArticleCardCompact.jsx` with no syntax errors.

- [ ] **Commit:**
```bash
git add frontend/src/components/ArticleCardCompact.jsx
git commit -m "feat: add ArticleCardCompact for home dashboard strips"
```

---

## Task 2: `BottomNav.jsx`

**Files:**
- Create: `frontend/src/components/BottomNav.jsx`

- [ ] **Create the file with this exact content:**

```jsx
const NAV_ITEMS = [
  {
    label: 'Home',
    accent: '#e8e8f0',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Football',
    accent: '#4ade80',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8l3 3-1 4H10l-1-4 3-3z" />
        <path d="M9 4.5L12 8l3-3.5M4.5 9L7 12l-3 3M19.5 9L17 12l3 3M9 19.5L12 16l3 3.5" />
      </svg>
    ),
  },
  {
    label: 'Sports',
    accent: '#ff6b35',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    label: 'AI & Tech',
    accent: '#00d4ff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    label: 'Entertainment',
    accent: '#f59e0b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    label: 'Global News',
    accent: '#a78bfa',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeCategory, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0c0c0e]/95 backdrop-blur-md border-t border-[#222228]">
      <div className="flex items-stretch justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeCategory === item.label;
          return (
            <button
              key={item.label}
              onClick={() => onSelect(item.label)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg
                         transition-all duration-150 relative"
            >
              {isActive && (
                <span
                  className="absolute top-1.5 w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: item.accent,
                    boxShadow: `0 0 6px ${item.accent}`,
                  }}
                />
              )}
              <span
                className="mt-3 transition-colors duration-150"
                style={{ color: isActive ? item.accent : '#555560' }}
              >
                {item.icon}
              </span>
              <span
                className="text-[9px] font-medium font-body truncate max-w-[52px] transition-colors duration-150"
                style={{ color: isActive ? item.accent : '#555560' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Commit:**
```bash
git add frontend/src/components/BottomNav.jsx
git commit -m "feat: add BottomNav mobile navigation component"
```

---

## Task 3: `HomeDashboard.jsx`

**Files:**
- Create: `frontend/src/components/HomeDashboard.jsx`

- [ ] **Create the file with this exact content:**

```jsx
import { useState, useEffect } from 'react';
import ArticleCardCompact from './ArticleCardCompact.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const CATEGORIES = [
  { label: 'Football',      hebrewKey: 'חדשות בעולם הכדורגל',      accent: '#4ade80' },
  { label: 'Sports',        hebrewKey: 'חדשות בעולם הספורט',        accent: '#ff6b35' },
  { label: 'AI & Tech',     hebrewKey: 'עולם ה-AI והפיתוח',         accent: '#00d4ff' },
  { label: 'Entertainment', hebrewKey: 'חדשות כלליות בעולם הבידור', accent: '#f59e0b' },
  { label: 'Global News',   hebrewKey: 'חדשות כלליות בעולם',        accent: '#a78bfa' },
];

export default function HomeDashboard({ onSelect }) {
  const [sectionData, setSectionData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      CATEGORIES.map((cat) =>
        fetch(`${API_BASE}/api/articles?category=${encodeURIComponent(cat.hebrewKey)}`)
          .then((r) => r.json())
          .then((json) => ({ label: cat.label, articles: (json.data ?? []).slice(0, 6) }))
          .catch(() => ({ label: cat.label, articles: [] }))
      )
    ).then((results) => {
      const data = {};
      results.forEach(({ label, articles }) => { data[label] = articles; });
      setSectionData(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 px-6 lg:px-8 py-8 space-y-10">
        {CATEGORIES.map((cat) => (
          <div key={cat.label} className="space-y-3">
            <div className="h-5 w-32 bg-[#1c1c20] rounded animate-pulse" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-w-[280px] h-20 bg-[#141416] rounded-xl animate-pulse border border-[#222228] flex-shrink-0"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 lg:px-8 py-8 space-y-10 overflow-y-auto">
      {/* Hero */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">SocialOrg</h1>
        <p className="text-[13px] text-[#888893] font-body mt-0.5">
          Your personal AI news feed
        </p>
      </div>

      {CATEGORIES.map((cat) => {
        const articles = sectionData[cat.label] ?? [];
        return (
          <section key={cat.label}>
            {/* Section header */}
            <div className="flex items-center justify-between mb-3">
              <h2
                className="font-display text-[15px] font-bold"
                style={{ color: cat.accent }}
              >
                {cat.label}
              </h2>
              <button
                onClick={() => onSelect(cat.label)}
                className="flex items-center gap-1 text-[11.5px] font-medium font-body
                           text-[#555560] hover:text-white transition-colors duration-150"
              >
                ראה הכל
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Scroll strip */}
            {articles.length === 0 ? (
              <p className="text-[12px] text-[#444450] font-body">No articles yet.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-6 lg:-mx-8 px-6 lg:px-8">
                {articles.map((article) => (
                  <ArticleCardCompact key={article.id} article={article} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Commit:**
```bash
git add frontend/src/components/HomeDashboard.jsx
git commit -m "feat: add HomeDashboard with category preview strips"
```

---

## Task 4: Update `Sidebar.jsx`

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

- [ ] **Add `Home` as the first entry in `NAV_ITEMS`** (insert before the `'AI & Tech'` entry):

```jsx
  {
    label: 'Home',
    accent: '#e8e8f0',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
```

- [ ] **Make sidebar desktop-only.** Find the `return (` of the `Sidebar` component. Replace the entire return block with:

```jsx
  return (
    <aside
      className="hidden lg:flex flex-col fixed top-0 left-0 h-full w-[260px] z-40
                 bg-[#0c0c0e] border-r border-[#222228]"
    >
      <nav className="flex flex-col h-full">
        {/* Logo */}
        <div className="px-6 py-7 border-b border-[#222228]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#00d4ff] to-[#a78bfa] opacity-90" />
            <span className="font-display text-[17px] font-bold tracking-tight text-white">
              SocialOrg
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#888893] tracking-wider uppercase font-body font-medium">
            AI News Feed
          </p>
        </div>

        {/* Section label */}
        <div className="px-6 pt-6 pb-2">
          <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#444450] font-body">
            Categories
          </span>
        </div>

        {/* Nav items */}
        <ul className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeCategory === item.label;
            return (
              <li key={item.label}>
                <button
                  onClick={() => onSelect(item.label)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                    transition-all duration-150 group
                    ${isActive
                      ? 'bg-[#1c1c20] text-white'
                      : 'text-[#888893] hover:text-[#c8c8d0] hover:bg-[#141416]'
                    }
                  `}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-150"
                    style={{
                      backgroundColor: isActive ? item.accent : 'transparent',
                      boxShadow: isActive ? `0 0 6px ${item.accent}` : 'none',
                    }}
                  />
                  <span
                    className="flex-shrink-0 transition-colors duration-150"
                    style={{ color: isActive ? item.accent : 'currentColor' }}
                  >
                    {item.icon}
                  </span>
                  <span className="font-body text-[13.5px] font-medium tracking-tight">
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      className="ml-auto text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded font-body"
                      style={{
                        color: item.accent,
                        backgroundColor: `${item.accent}18`,
                      }}
                    >
                      Live
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[#222228]">
          <p className="text-[11px] text-[#444450] font-body">
            Powered by Gemini · Free Tier
          </p>
        </div>
      </nav>
    </aside>
  );
```

- [ ] **Remove the old `useState` for `mobileOpen`** — the entire mobile hamburger/overlay system is now gone. The `Sidebar` component no longer needs any state. Remove:
  - `const [mobileOpen, setMobileOpen] = useState(false);`
  - The `import { useState } from 'react';` line (no longer needed)

- [ ] **Commit:**
```bash
git add frontend/src/components/Sidebar.jsx
git commit -m "feat: sidebar desktop-only, add Home item, remove hamburger"
```

---

## Task 5: Update `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Update imports** — add `HomeDashboard` and `BottomNav`:

```jsx
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import SubNavbar from './components/SubNavbar.jsx';
import ArticleCard from './components/ArticleCard.jsx';
import HomeDashboard from './components/HomeDashboard.jsx';
import BottomNav from './components/BottomNav.jsx';
```

- [ ] **Change the default state** from `'Football'` to `'Home'`:

```jsx
const [activeCategory, setActiveCategory] = useState('Home');
```

- [ ] **Guard the `meta` lookup** — `'Home'` has no entry in `CATEGORY_META`, so add a fallback. Replace:

```jsx
const meta = CATEGORY_META[activeCategory];
```
with:
```jsx
const meta = CATEGORY_META[activeCategory] ?? { accent: '#888893', description: '' };
```

- [ ] **Replace the entire `return` block** with this:

```jsx
  return (
    <div className="min-h-screen bg-[#0c0c0e] font-body">
      <Sidebar activeCategory={activeCategory} onSelect={setActiveCategory} />
      <BottomNav activeCategory={activeCategory} onSelect={setActiveCategory} />

      <main className="lg:pl-[260px] min-h-screen flex flex-col pb-16 lg:pb-0">

        {activeCategory === 'Home' ? (
          <HomeDashboard onSelect={setActiveCategory} />
        ) : (
          <>
            {/* ── Sticky top: main header + sub-navbar ── */}
            <div className="sticky top-0 z-20">
              <header className="bg-[#0c0c0e]/90 backdrop-blur-md border-b border-[#222228]">
                <div className="px-6 lg:px-8 py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h1 className="font-display text-xl font-bold text-white truncate">
                        {activeSubCategory ?? activeCategory}
                      </h1>
                      <span
                        className="flex items-center gap-1.5 text-[10px] font-bold font-body tracking-wider uppercase"
                        style={{ color: meta.accent }}
                      >
                        <span className="relative flex h-2 w-2">
                          <span
                            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: meta.accent }}
                          />
                          <span
                            className="relative inline-flex rounded-full h-2 w-2"
                            style={{ backgroundColor: meta.accent }}
                          />
                        </span>
                        Live
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-[#888893] font-body font-medium">
                      {meta.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {loading ? (
                      <span className="text-[12px] text-[#444450] font-body">Loading…</span>
                    ) : (
                      <>
                        <span className="text-[13px] font-bold text-white font-body">{articles.length}</span>
                        <span className="text-[12px] text-[#444450] font-body"> articles</span>
                      </>
                    )}
                  </div>
                </div>
              </header>

              <SubNavbar
                options={subCategoryOptions}
                activeSubCategory={activeSubCategory}
                onSelect={setActiveSubCategory}
                accent={meta.accent}
              />
            </div>

            {/* ── Feed ── */}
            <section className="flex-1 px-6 lg:px-8 py-7">
              {error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <p className="font-display text-lg font-bold text-red-400 mb-1">Connection error</p>
                  <p className="text-[13px] text-[#444450] font-body">{error}</p>
                  <p className="text-[12px] text-[#333340] font-body mt-2">
                    Make sure the backend is running on port 3001.
                  </p>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : articles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {articles.map((article, i) => (
                    <ArticleCard key={article.id} article={article} index={i} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div
                    className="w-16 h-16 rounded-full mb-5 flex items-center justify-center opacity-30"
                    style={{ backgroundColor: `${meta.accent}18` }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke={meta.accent} strokeWidth="1.5">
                      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <p className="font-display text-lg font-bold text-[#333340] mb-1">No articles yet</p>
                  <p className="text-[13px] text-[#444450] font-body">
                    Hit <code className="text-[#555560]">POST /api/trigger-fetch</code> to ingest the latest feeds.
                  </p>
                </div>
              )}
            </section>

            <footer className="px-6 lg:px-8 py-4 border-t border-[#222228]">
              <p className="text-[11px] text-[#333340] font-body">
                SocialOrg — Personal AI News Aggregator &nbsp;·&nbsp; Free tier &nbsp;·&nbsp; Max 20 articles / sub-category
              </p>
            </footer>
          </>
        )}
      </main>
    </div>
  );
```

- [ ] **Commit:**
```bash
git add frontend/src/App.jsx
git commit -m "feat: wire HomeDashboard, BottomNav, default to Home view"
```

---

## Self-Review Checklist

- [x] `HomeDashboard` fires 5 parallel fetches on mount ✓
- [x] Compact cards have `min-w-[280px]` + horizontal scroll strip ✓
- [x] `BottomNav` is `lg:hidden`, sidebar is `hidden lg:flex` ✓
- [x] `main` has `pb-16 lg:pb-0` to clear bottom nav on mobile ✓
- [x] `meta` guarded with fallback for `'Home'` state ✓
- [x] `Home` item added to both `Sidebar` NAV_ITEMS and `BottomNav` NAV_ITEMS ✓
- [x] `ArticleCardCompact` uses `imgError` state pattern (no nextSibling) ✓
- [x] `useState` import removed from `Sidebar` after removing mobile state ✓
