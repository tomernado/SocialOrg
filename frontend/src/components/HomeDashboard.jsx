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

// Card width (260) + gap (12) = 272px per slot — used to compute marquee duration.
const CARD_SLOT_PX = 314;
const SCROLL_SPEED_PX_PER_SEC = 45;

/**
 * CSS-animation marquee strip. Duplicates articles for a seamless loop.
 * Pauses on hover/focus via the `.marquee-track` CSS rule in index.css.
 */
function MarqueeStrip({ articles }) {
  const canScroll = articles.length >= 3;
  const items = canScroll ? [...articles, ...articles] : articles;

  const duration = canScroll
    ? Math.round((articles.length * CARD_SLOT_PX) / SCROLL_SPEED_PX_PER_SEC)
    : 0;

  return (
    <div className="overflow-hidden">
      <div
        className={canScroll ? 'marquee-track' : 'flex gap-3 px-6 lg:px-8'}
        style={canScroll ? {
          display: 'flex',
          gap: '12px',
          width: 'max-content',
          paddingLeft: '24px',
          paddingRight: '24px',
          '--marquee-duration': `${duration}s`,
        } : undefined}
      >
        {items.map((article, i) => (
          <ArticleCardCompact key={`${article.id}-${i}`} article={article} />
        ))}
      </div>
    </div>
  );
}

export default function HomeDashboard({ onSelect, theme, onToggleTheme }) {
  const [sectionData, setSectionData] = useState({});
  const [loading, setLoading] = useState(true);
  // 'splash' → 'settle' → 'done'
  const [introPhase, setIntroPhase] = useState('splash');

  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase('settle'), 600);
    const t2 = setTimeout(() => setIntroPhase('done'),  1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    Promise.all(
      CATEGORIES.map((cat) =>
        fetch(`${API_BASE}/api/articles?category=${encodeURIComponent(cat.hebrewKey)}`)
          .then((r) => r.json())
          .then((json) => {
            const all = json.data ?? [];
            // Surface articles with images before no-image articles so every
            // marquee strip always shows real thumbnails when they exist.
            const withImg    = all.filter(a => a.image_url && a.image_url.trim() !== '');
            const withoutImg = all.filter(a => !a.image_url || a.image_url.trim() === '');
            return { label: cat.label, articles: [...withImg, ...withoutImg].slice(0, 10) };
          })
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
      <div className="flex-1 px-6 lg:px-8 pt-10 pb-6">
        {/* Hero skeleton */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="h-10 w-48 bg-[#1c1c20] rounded animate-pulse mb-3" />
          <div className="h-4 w-56 bg-[#181818] rounded animate-pulse" />
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.label} className="mb-4">
            <div className="overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div className="h-7 w-32 rounded animate-pulse" style={{ background: 'var(--border)' }} />
                <div className="h-4 w-14 rounded animate-pulse" style={{ background: 'var(--border)' }} />
              </div>
              <div className="flex gap-3 overflow-hidden pb-4 pl-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-[240px] sm:w-[290px] h-[125px] rounded-xl animate-pulse flex-shrink-0"
                    style={{ background: 'var(--card)', border: `1px solid ${cat.accent}20` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 pt-4 lg:pt-10 pb-6 overflow-y-auto relative">

      {/* ── Backdrop blur during splash ── */}
      {introPhase !== 'done' && (
        <div
          className="fixed inset-0 z-40 pointer-events-none backdrop-blur-[3px]"
          style={{
            background: 'color-mix(in srgb, var(--bg) 78%, transparent)',
            opacity:    introPhase === 'splash' ? 1 : 0,
            transition: 'opacity 0.5s ease 0.25s',
          }}
        />
      )}

      {/* ── Flying title — animates from center to hero position ── */}
      {introPhase !== 'done' && (
        <h1
          className="font-display font-bold pointer-events-none"
          style={{
            position:     'fixed',
            left:         '50%',
            top:          '50%',
            zIndex:       51,
            letterSpacing: '-0.03em',
            color:        'var(--text)',
            fontSize:     'clamp(60px, 10vw, 96px)',
            whiteSpace:   'nowrap',
            /* splash: centered; settle: moves up + shrinks to hero size */
            transform: introPhase === 'splash'
              ? 'translate(-50%, -50%) scale(1)'
              : 'translate(-50%, -50%) translateY(-40vh) scale(0.52)',
            opacity:    introPhase === 'splash' ? 1 : 0,
            transition: introPhase === 'settle'
              ? 'transform 0.6s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease 0.3s'
              : 'none',
          }}
        >
          SocialOrg
        </h1>
      )}

      {/* ── Hero — centred ── */}
      <div
        className="relative flex flex-col items-center text-center mb-6 px-6 lg:px-8"
        style={{
          opacity:   introPhase === 'splash' ? 0.15 : 1,
          transform: introPhase === 'splash' ? 'translateY(10px)' : 'translateY(0)',
          transition: 'opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s',
        }}
      >

        {/* Theme toggle — top-right of hero */}
        <button
          onClick={onToggleTheme}
          className="absolute right-6 lg:right-8 top-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-[11px] font-bold tracking-wide transition-all duration-200 hover:opacity-80"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              Light
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
              Dark
            </>
          )}
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase font-body" style={{ color: 'var(--text-4)' }}>
            Live Feed
          </span>
        </div>
        <h1
          className="font-display text-[42px] lg:text-[58px] font-bold leading-tight tracking-tight"
          style={{
            color: 'var(--text)',
            letterSpacing: '-0.03em',
            visibility: introPhase !== 'done' ? 'hidden' : 'visible',
          }}
        >
          SocialOrg
        </h1>
        <p className="text-[14px] font-body mt-2" style={{ color: 'var(--text-3)' }}>
          Your personal AI news feed
        </p>
      </div>

      {/* ── Category sections ── */}
      {CATEGORIES.map((cat, idx) => {
        const articles = sectionData[cat.label] ?? [];
        const delay = 0.2 + idx * 0.12;

        return (
          <div
            key={cat.label}
            className="mb-2 px-6 lg:px-8"
            style={{
              opacity:   introPhase === 'splash' ? 0.18 : 1,
              transform: introPhase === 'splash' ? 'translateY(12px)' : 'translateY(0)',
              transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
            }}
          >
            <div className="overflow-hidden">
              {/* Section header */}
              <div className="relative flex items-center px-5 pt-4 pb-4">
                {/* Title centered on the full row */}
                <h2
                  className="absolute left-1/2 -translate-x-1/2 font-display text-[26px] lg:text-[34px] font-bold tracking-tight leading-none whitespace-nowrap"
                  style={{ color: cat.accent }}
                >
                  {cat.label}
                </h2>
                {/* SEE ALL pushed to right */}
                <div className="flex-1" />
                <button
                  onClick={() => onSelect(cat.label)}
                  className="flex items-center gap-1 font-body text-[11px] font-bold tracking-[0.12em] uppercase
                             flex-shrink-0 transition-opacity duration-150 hover:opacity-70 z-10"
                  style={{ color: cat.accent }}
                >
                  See All
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Marquee strip */}
              <div className="pb-4">
                {articles.length === 0 ? (
                  <p className="text-[12px] font-body py-2 px-5" style={{ color: 'var(--text-4)' }}>
                    No articles yet.
                  </p>
                ) : (
                  <MarqueeStrip articles={articles} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
