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
const CARD_SLOT_PX = 272;
const SCROLL_SPEED_PX_PER_SEC = 45;

/**
 * CSS-animation marquee strip. Duplicates articles for a seamless loop.
 * Pauses on hover/focus via the `.marquee-track` CSS rule in index.css.
 */
function MarqueeStrip({ articles }) {
  const canScroll = articles.length >= 3;
  const items = canScroll ? [...articles, ...articles] : articles;

  // Duration = how long to traverse one full copy of the content
  const duration = canScroll
    ? Math.round((articles.length * CARD_SLOT_PX) / SCROLL_SPEED_PX_PER_SEC)
    : 0;

  return (
    <div className="overflow-hidden -mx-6 lg:-mx-8">
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

export default function HomeDashboard({ onSelect }) {
  const [sectionData, setSectionData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      CATEGORIES.map((cat) =>
        fetch(`${API_BASE}/api/articles?category=${encodeURIComponent(cat.hebrewKey)}`)
          .then((r) => r.json())
          .then((json) => ({ label: cat.label, articles: (json.data ?? []).slice(0, 10) }))
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
      <div className="flex-1 px-6 lg:px-8 pt-12 pb-6">
        {/* Hero skeleton */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="h-10 w-48 bg-[#1c1c20] rounded animate-pulse mb-3" />
          <div className="h-4 w-56 bg-[#181818] rounded animate-pulse" />
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.label} className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-[3px] h-6 rounded-full bg-[#222228] animate-pulse" />
                <div className="h-5 w-24 bg-[#1c1c20] rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-[#1c1c20] rounded-full animate-pulse" />
            </div>
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[260px] h-[120px] bg-[#141416] rounded-xl animate-pulse border border-[#1c1c20] flex-shrink-0"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 pt-4 lg:pt-10 pb-6 overflow-y-auto">

      {/* ── Hero — centred ── */}
      <div className="flex flex-col items-center text-center mb-8 px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#444450] font-body">
            Live Feed
          </span>
        </div>
        <h1 className="font-display text-[28px] lg:text-[36px] font-bold text-white leading-tight tracking-tight">
          SocialOrg
        </h1>
        <p className="text-[14px] text-[#555560] font-body mt-2">
          Your personal AI news feed
        </p>
      </div>

      {/* ── Category sections ── */}
      {CATEGORIES.map((cat, idx) => {
        const articles = sectionData[cat.label] ?? [];
        const isLast = idx === CATEGORIES.length - 1;

        return (
          <div key={cat.label} className="mb-8">

            {/* Section header */}
            <div className="flex items-center justify-between mb-4 px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <div
                  className="w-[3px] h-6 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: cat.accent,
                    boxShadow: `0 0 10px ${cat.accent}80`,
                  }}
                />
                <h2 className="font-display text-[19px] font-bold text-white tracking-tight leading-none">
                  {cat.label}
                </h2>
              </div>

              <button
                onClick={() => onSelect(cat.label)}
                className="flex items-center gap-1.5 text-[11px] font-bold font-body
                           px-4 py-1.5 rounded-full transition-all duration-200
                           hover:scale-105 active:scale-95"
                style={{
                  color: '#0a0a0c',
                  backgroundColor: cat.accent,
                  boxShadow: `0 2px 14px ${cat.accent}50`,
                }}
              >
                SEE ALL
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Marquee strip */}
            {articles.length === 0 ? (
              <p className="text-[12px] text-[#444450] font-body py-3 px-6 lg:px-8">
                No articles yet.
              </p>
            ) : (
              <MarqueeStrip articles={articles} />
            )}

            {/* Gradient divider */}
            {!isLast && (
              <div
                className="mt-8 h-px mx-6 lg:mx-8"
                style={{
                  background: `linear-gradient(to right, ${cat.accent}25, ${cat.accent}08 60%, transparent)`,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
