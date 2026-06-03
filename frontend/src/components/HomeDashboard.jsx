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
