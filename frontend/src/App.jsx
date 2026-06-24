import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import SubNavbar from './components/SubNavbar.jsx';
import ArticleCard from './components/ArticleCard.jsx';
import HomeDashboard from './components/HomeDashboard.jsx';
import BottomNav from './components/BottomNav.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Maps the English sidebar label → Hebrew category key stored in the DB
const CATEGORY_MAP = {
  'AI & Tech':     'עולם ה-AI והפיתוח',
  'Football':      'חדשות בעולם הכדורגל',
  'Sports':        'חדשות בעולם הספורט',
  'Entertainment': 'חדשות כלליות בעולם הבידור',
  'Global News':   'חדשות כלליות בעולם',
};

const CATEGORY_META = {
  'AI & Tech':     { accent: '#00d4ff', description: 'Artificial intelligence, machine learning & developer news' },
  'Football':      { accent: '#4ade80', description: 'Matchday results, transfers, and tactical breakdowns' },
  'Sports':        { accent: '#ff6b35', description: 'Latest scores, trades, and analysis across all sports' },
  'Entertainment': { accent: '#f59e0b', description: 'Films, music, streaming, and pop culture' },
  'Global News':   { accent: '#a78bfa', description: 'Politics, economics, and world affairs' },
};

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="w-full h-44" style={{ background: 'var(--border)' }} />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-4 w-full rounded" style={{ background: 'var(--border)' }} />
        <div className="h-4 w-4/5 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-3 w-full rounded mt-2" style={{ background: 'var(--border-subtle)' }} />
        <div className="h-3 w-3/4 rounded" style={{ background: 'var(--border-subtle)' }} />
      </div>
    </div>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory]       = useState('Home');
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [articles, setArticles]                   = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') ?? 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Hardcoded sub-category options — must match forceSubCategory values in rss.service.js
  const CATEGORY_SUB_OPTIONS = {
    'Football':      ['BARCELONA', 'NATIONAL', 'FOOTBALL'],
    'Sports':        ['WORLD-SPORTS', 'ISRAELI-SPORTS', 'BASKETBALL-NBA'],
    'AI & Tech':     ['AI-NEWS', 'GADGETS-LEAKS', 'CYBER-TECH'],
    'Entertainment': ['MUSIC', 'MOVIES-SERIES', 'CELEBS-REALITY', 'ISRAELI-ENTERTAINMENT'],
    'Global News':   ['WORLD-NEWS', 'ECONOMY', 'ISRAEL-NEWS'],
  };

  // Reset sub-category whenever main category switches
  useEffect(() => {
    setActiveSubCategory(null);
  }, [activeCategory]);

  // Derive pill options from the hardcoded map — no fetch needed
  const subCategoryOptions = CATEGORY_SUB_OPTIONS[activeCategory] ?? [];

  // ── Fetch articles when category OR sub-category changes ─────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);

    const hebrewCategory = CATEGORY_MAP[activeCategory];
    if (!hebrewCategory) { setLoading(false); return; }

    let url = `${API_BASE}/api/articles?category=${encodeURIComponent(hebrewCategory)}`;
    if (activeSubCategory) {
      url += `&sub_category=${encodeURIComponent(activeSubCategory)}`;
    }

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setArticles(json.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [activeCategory, activeSubCategory]);

  const meta = CATEGORY_META[activeCategory] ?? { accent: '#888893', description: '' };

  const handleCategorySelect = (category) => {
    setActiveCategory(category);
    // activeSubCategory is reset inside Effect 1
  };

  return (
    <div className="min-h-screen font-body" style={{ background: 'var(--bg)' }}>
      <Sidebar activeCategory={activeCategory} onSelect={setActiveCategory} />
      <BottomNav activeCategory={activeCategory} onSelect={setActiveCategory} />

      <main className="lg:pl-[260px] min-h-screen flex flex-col pb-16 lg:pb-0">

        {activeCategory === 'Home' ? (
          <HomeDashboard onSelect={setActiveCategory} theme={theme} onToggleTheme={toggleTheme} />
        ) : (
          <>
            {/* ── Sticky top: main header + sub-navbar ── */}
            <div className="sticky top-0 z-20">
              <header className="backdrop-blur-md border-b" style={{ background: 'color-mix(in srgb, var(--bg) 90%, transparent)', borderColor: 'var(--border)' }}>
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
}
