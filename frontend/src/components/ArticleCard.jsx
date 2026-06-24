import { useState } from 'react';
import ArticleModal from './ArticleModal.jsx';

export const SUB_CATEGORY_LABELS = {
  // Football
  'BARCELONA':        'ברצלונה',
  'NATIONAL':         'נבחרות',
  'FOOTBALL':         'כדורגל כללי',
  // Football (legacy keys — kept so existing DB articles render correctly)
  'TRANSFERS':        'העברות',
  'NATIONAL-MONDIAL': 'נבחרות עולמיות',
  'PREMIER-LEAGUE':   'ליגת העל',
  // Sports
  'WORLD-SPORTS':    'ספורט עולמי',
  'ISRAELI-SPORTS':  'ספורט ישראלי',
  'BASKETBALL-NBA':  'כדורסל NBA',
  // AI & Tech
  'AI-NEWS':         'בינה מלאכותית',
  'GADGETS-LEAKS':   'גאדגטים ודליפות',
  'CYBER-TECH':      'סייבר וטכנולוגיה',
  // Entertainment
  'MUSIC':           'מוזיקה',
  'MOVIES-SERIES':   'סרטים וסדרות',
  'CELEBS-REALITY':  'סלבס ורייאליטי',
  'ISRAELI-ENTERTAINMENT': 'בידור ישראלי',
  // Global News
  'WORLD-NEWS':      'חדשות עולם',
  'ECONOMY':         'כלכלה',
  'ISRAEL-NEWS':     'חדשות ישראל',
};

// Accent palette keyed by Hebrew DB category values
const CATEGORY_ACCENT = {
  'עולם ה-AI והפיתוח':          { color: '#00d4ff', bg: '#00d4ff18' },
  'חדשות בעולם הספורט':         { color: '#ff6b35', bg: '#ff6b3518' },
  'חדשות בעולם הכדורגל':        { color: '#4ade80', bg: '#4ade8018' },
  'חדשות כלליות בעולם הבידור':  { color: '#f59e0b', bg: '#f59e0b18' },
  'חדשות כלליות בעולם':         { color: '#a78bfa', bg: '#a78bfa18' },
};

const DEFAULT_ACCENT = { color: '#888893', bg: '#88889318' };

// Rich fallback visuals per category — shown when no image_url is available
const CATEGORY_FALLBACK = {
  'עולם ה-AI והפיתוח': {
    gradient: 'linear-gradient(135deg, #020d1a 0%, #041830 60%, #060e20 100%)',
    glow: 'radial-gradient(ellipse at 25% 45%, #00d4ff28 0%, transparent 65%)',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1" opacity="0.4">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <circle cx="12" cy="12" r="3"/>
        <line x1="12" y1="4" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="20"/>
        <line x1="4" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="20" y2="12"/>
        <line x1="6.3" y1="6.3" x2="9.2" y2="9.2"/><line x1="14.8" y1="14.8" x2="17.7" y2="17.7"/>
        <line x1="17.7" y1="6.3" x2="14.8" y2="9.2"/><line x1="9.2" y1="14.8" x2="6.3" y2="17.7"/>
      </svg>
    ),
  },
  'חדשות בעולם הספורט': {
    gradient: 'linear-gradient(135deg, #120800 0%, #1f0e00 60%, #130900 100%)',
    glow: 'radial-gradient(ellipse at 70% 40%, #ff6b3525 0%, transparent 65%)',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="1" opacity="0.4">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3v18M3 12h18"/>
        <path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>
      </svg>
    ),
  },
  'חדשות בעולם הכדורגל': {
    gradient: 'linear-gradient(135deg, #010f04 0%, #021a07 60%, #010c03 100%)',
    glow: 'radial-gradient(ellipse at 30% 60%, #4ade8022 0%, transparent 65%)',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7l2.5 3.5L18 11l-2.5 3 .5 4L12 16.5 8 18l.5-4L6 11l3.5-.5z"/>
      </svg>
    ),
  },
  'חדשות כלליות בעולם הבידור': {
    gradient: 'linear-gradient(135deg, #120900 0%, #1f1100 60%, #120900 100%)',
    glow: 'radial-gradient(ellipse at 60% 35%, #f59e0b22 0%, transparent 65%)',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.4">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
  },
  'חדשות כלליות בעולם': {
    gradient: 'linear-gradient(135deg, #08030f 0%, #120620 60%, #080310 100%)',
    glow: 'radial-gradient(ellipse at 40% 50%, #a78bfa22 0%, transparent 65%)',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
      </svg>
    ),
  },
};

// Sub-category overrides — take priority over CATEGORY_FALLBACK when a more
// specific visual exists (e.g. Barcelona crest instead of the generic football icon).
const SUB_CATEGORY_FALLBACK = {
  'BARCELONA': {
    gradient: 'linear-gradient(135deg, #06001a 0%, #13003a 55%, #06001a 100%)',
    glow: 'radial-gradient(ellipse at 35% 55%, #a5004440 0%, transparent 55%), radial-gradient(ellipse at 65% 40%, #00458840 0%, transparent 55%)',
    icon: (
      <img
        src="https://crests.football-data.org/81.png"
        alt="FC Barcelona"
        style={{ width: '72px', height: '72px', objectFit: 'contain', opacity: 0.9 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    ),
  },
};

export default function ArticleCard({ article, index = 0 }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const {
    title = 'Untitled Article',
    ai_summary = '',
    sub_category = '',
    source_name = '',
    category = '',
    image_url = null,
    original_url = '#',
    relevance_score = null,
  } = article ?? {};

  const accent = CATEGORY_ACCENT[category] ?? DEFAULT_ACCENT;
  const fallback = SUB_CATEGORY_FALLBACK[sub_category] ?? CATEGORY_FALLBACK[category] ?? null;

  return (
    <article
      className="fade-up rounded-xl overflow-hidden transition-all duration-200 group"
      style={{
        animationDelay: `${index * 60}ms`,
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={e => { e.currentTarget.style.border = '1px solid var(--border-mid)'; e.currentTarget.style.background = 'var(--card-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.border = '1px solid var(--border)'; e.currentTarget.style.background = 'var(--card)'; }}
    >
      {/* ── Image / Fallback area ── */}
      <div className="relative w-full h-44 overflow-hidden">
        {image_url && !imgError ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
        /* Fallback — shown when no image_url or image fails to load */
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: fallback
              ? `${fallback.glow}, ${fallback.gradient}`
              : `radial-gradient(ellipse at 30% 50%, ${accent.color}18 0%, transparent 60%), #0c0c0e`,
          }}
        >
          {/* Subtle grid lines */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${accent.color}08 1px, transparent 1px),
                                linear-gradient(90deg, ${accent.color}08 1px, transparent 1px)`,
              backgroundSize: '28px 28px',
            }}
          />
          {/* Category icon */}
          <div className="relative z-10 opacity-80">
            {fallback?.icon ?? null}
          </div>
          {/* Bottom fade */}
          <div
            className="absolute bottom-0 left-0 right-0 h-12"
            style={{ background: 'linear-gradient(transparent, var(--card))' }}
          />
        </div>
        )}

        {/* Relevance score badge */}
        {relevance_score !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-bold text-white font-body">{relevance_score}/10</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col gap-2">
        {/* Source name badge */}
        {(source_name || sub_category) && (
          <span
            className="self-start text-[10px] font-bold tracking-wide px-2 py-0.5 rounded font-body"
            style={{ color: accent.color, backgroundColor: accent.bg }}
          >
            {source_name || sub_category}
          </span>
        )}

        {/* Title */}
        <h2
          className="font-display text-[14.5px] font-bold leading-snug transition-colors duration-150"
          style={{
            color: 'var(--text)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </h2>

        {/* AI summary — RTL, never clipped mid-sentence (Gemini returns 2 complete sentences) */}
        {ai_summary && (
          <p
            className="font-body text-[12.5px] leading-relaxed" style={{ color: 'var(--text-2)' }}
            dir="rtl"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {ai_summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-auto" style={{ borderTop: '1px solid var(--border)' }}>
          <span
            className="text-[11px] font-medium font-body"
            style={{ color: `${accent.color}bb` }}
          >
            {SUB_CATEGORY_LABELS[sub_category] ?? sub_category}
          </span>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1 text-[11.5px] font-medium font-body text-[#555560]
                       hover:text-white transition-colors duration-150 flex-shrink-0"
          >
            קרא עוד
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Modal — portaled to document.body, self-contained per card */}
      {modalOpen && (
        <ArticleModal
          article={article}
          onClose={() => setModalOpen(false)}
        />
      )}
    </article>
  );
}
