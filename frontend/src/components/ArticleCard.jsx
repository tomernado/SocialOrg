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
    glow: 'radial-gradient(ellipse at 25% 45%, #00d4ff30 0%, transparent 60%)',
    icon: (
      <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="1.4" opacity="0.65">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="#00d4ff08"/>
        <circle cx="12" cy="12" r="3" fill="#00d4ff18"/>
        <line x1="12" y1="4" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="20"/>
        <line x1="4" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="20" y2="12"/>
        <line x1="6.3" y1="6.3" x2="9.2" y2="9.2"/><line x1="14.8" y1="14.8" x2="17.7" y2="17.7"/>
        <line x1="17.7" y1="6.3" x2="14.8" y2="9.2"/><line x1="9.2" y1="14.8" x2="6.3" y2="17.7"/>
      </svg>
    ),
  },
  'חדשות בעולם הספורט': {
    gradient: 'linear-gradient(135deg, #120800 0%, #1f0e00 60%, #130900 100%)',
    glow: 'radial-gradient(ellipse at 70% 40%, #ff6b3530 0%, transparent 60%)',
    icon: (
      <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="1.4" opacity="0.65">
        <circle cx="12" cy="12" r="9" fill="#ff6b3508"/>
        <path d="M12 3v18M3 12h18"/>
        <path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>
      </svg>
    ),
  },
  'חדשות בעולם הכדורגל': {
    gradient: 'linear-gradient(135deg, #010f04 0%, #021a07 60%, #010c03 100%)',
    glow: 'radial-gradient(ellipse at 30% 60%, #4ade8028 0%, transparent 60%)',
    icon: (
      <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.4" opacity="0.65">
        <circle cx="12" cy="12" r="9" fill="#4ade8008"/>
        <path d="M12 7l2.5 3.5L18 11l-2.5 3 .5 4L12 16.5 8 18l.5-4L6 11l3.5-.5z" fill="#4ade8018"/>
      </svg>
    ),
  },
  'חדשות כלליות בעולם הבידור': {
    gradient: 'linear-gradient(135deg, #120900 0%, #1f1100 60%, #120900 100%)',
    glow: 'radial-gradient(ellipse at 60% 35%, #f59e0b28 0%, transparent 60%)',
    icon: (
      <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.4" opacity="0.65">
        <polygon points="23 7 16 12 23 17 23 7" fill="#f59e0b18"/>
        <rect x="1" y="5" width="15" height="14" rx="2" fill="#f59e0b08"/>
      </svg>
    ),
  },
  'חדשות כלליות בעולם': {
    gradient: 'linear-gradient(135deg, #08030f 0%, #120620 60%, #080310 100%)',
    glow: 'radial-gradient(ellipse at 40% 50%, #a78bfa28 0%, transparent 60%)',
    icon: (
      <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.4" opacity="0.65">
        <circle cx="12" cy="12" r="9" fill="#a78bfa08"/>
        <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z" fill="#a78bfa10"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
      </svg>
    ),
  },
};

// Sub-category overrides — take priority over CATEGORY_FALLBACK when a more
// specific visual exists for a sub-category.
const SUB_CATEGORY_FALLBACK = {
  // ── Football ────────────────────────────────────────────────────────────────
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

  // ── AI & Tech ───────────────────────────────────────────────────────────────
  'AI-NEWS': {
    gradient: 'linear-gradient(135deg, #020c18 0%, #031520 60%, #020d1c 100%)',
    glow: 'radial-gradient(ellipse at 50% 48%, #00d4ff22 0%, transparent 65%)',
    scene: (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 48%, #00d4ff22 0%, transparent 65%)' }}/>
        <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%" viewBox="0 0 400 176" preserveAspectRatio="xMidYMid slice" fill="none">
          <circle cx="65" cy="35" r="11" fill="#00d4ff08" stroke="#00d4ff" strokeOpacity="0.45" strokeWidth="1.3"/>
          <circle cx="335" cy="35" r="11" fill="#00d4ff08" stroke="#00d4ff" strokeOpacity="0.45" strokeWidth="1.3"/>
          <circle cx="65" cy="141" r="11" fill="#00d4ff08" stroke="#00d4ff" strokeOpacity="0.45" strokeWidth="1.3"/>
          <circle cx="335" cy="141" r="11" fill="#00d4ff08" stroke="#00d4ff" strokeOpacity="0.45" strokeWidth="1.3"/>
          <circle cx="200" cy="12" r="8" fill="#00d4ff07" stroke="#00d4ff" strokeOpacity="0.35" strokeWidth="1"/>
          <circle cx="200" cy="164" r="8" fill="#00d4ff07" stroke="#00d4ff" strokeOpacity="0.35" strokeWidth="1"/>
          <circle cx="130" cy="55" r="7" fill="#00d4ff10" stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1"/>
          <circle cx="270" cy="55" r="7" fill="#00d4ff10" stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1"/>
          <circle cx="130" cy="121" r="7" fill="#00d4ff10" stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1"/>
          <circle cx="270" cy="121" r="7" fill="#00d4ff10" stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1"/>
          <line x1="74" y1="41" x2="125" y2="53" stroke="#00d4ff" strokeOpacity="0.22" strokeWidth="1"/>
          <line x1="326" y1="41" x2="275" y2="53" stroke="#00d4ff" strokeOpacity="0.22" strokeWidth="1"/>
          <line x1="74" y1="135" x2="125" y2="123" stroke="#00d4ff" strokeOpacity="0.22" strokeWidth="1"/>
          <line x1="326" y1="135" x2="275" y2="123" stroke="#00d4ff" strokeOpacity="0.22" strokeWidth="1"/>
          <line x1="200" y1="20" x2="200" y2="76" stroke="#00d4ff" strokeOpacity="0.22" strokeWidth="1"/>
          <line x1="200" y1="156" x2="200" y2="100" stroke="#00d4ff" strokeOpacity="0.22" strokeWidth="1"/>
          <line x1="135" y1="60" x2="182" y2="82" stroke="#00d4ff" strokeOpacity="0.3" strokeWidth="1.1"/>
          <line x1="265" y1="60" x2="218" y2="82" stroke="#00d4ff" strokeOpacity="0.3" strokeWidth="1.1"/>
          <line x1="135" y1="116" x2="182" y2="94" stroke="#00d4ff" strokeOpacity="0.3" strokeWidth="1.1"/>
          <line x1="265" y1="116" x2="218" y2="94" stroke="#00d4ff" strokeOpacity="0.3" strokeWidth="1.1"/>
          <circle cx="200" cy="88" r="24" fill="#00d4ff07" stroke="#00d4ff" strokeOpacity="0.55" strokeWidth="1.8"/>
          <circle cx="200" cy="88" r="14" fill="#00d4ff12" stroke="#00d4ff" strokeOpacity="0.7" strokeWidth="1.2"/>
          <circle cx="200" cy="88" r="5.5" fill="#00d4ff" fillOpacity="0.45"/>
        </svg>
      </div>
    ),
  },
  'GADGETS-LEAKS': {
    gradient: 'linear-gradient(135deg, #020c18 0%, #031a28 60%, #020d1c 100%)',
    glow: 'radial-gradient(ellipse at 72% 15%, #00d4ff18 0%, transparent 45%)',
    scene: (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 72% 15%, #00d4ff1a 0%, transparent 45%), radial-gradient(ellipse at 30% 85%, #00d4ff0e 0%, transparent 40%)' }}/>
        <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%" viewBox="0 0 400 176" preserveAspectRatio="xMidYMid slice" fill="none">
          <rect x="148" y="6" width="104" height="166" rx="16" fill="#00d4ff06" stroke="#00d4ff" strokeOpacity="0.4" strokeWidth="1.5"/>
          <rect x="158" y="20" width="84" height="138" rx="8" fill="#00d4ff10" stroke="#00d4ff" strokeOpacity="0.18" strokeWidth="0.8"/>
          <rect x="183" y="25" width="34" height="8" rx="4" fill="#00d4ff" fillOpacity="0.25"/>
          <rect x="183" y="150" width="34" height="4" rx="2" fill="#00d4ff" fillOpacity="0.28"/>
          <rect x="162" y="42" width="76" height="46" rx="5" fill="#00d4ff" fillOpacity="0.1"/>
          <rect x="162" y="96" width="76" height="6" rx="3" fill="#00d4ff" fillOpacity="0.14"/>
          <rect x="162" y="108" width="54" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.09"/>
          <rect x="162" y="119" width="68" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.08"/>
          <rect x="162" y="130" width="44" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.07"/>
          <rect x="146" y="50" width="3" height="24" rx="1.5" fill="#00d4ff" fillOpacity="0.28"/>
          <rect x="146" y="82" width="3" height="18" rx="1.5" fill="#00d4ff" fillOpacity="0.28"/>
          <rect x="251" y="64" width="3" height="30" rx="1.5" fill="#00d4ff" fillOpacity="0.28"/>
          <rect x="20" y="38" width="90" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.1"/>
          <rect x="20" y="50" width="65" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.07"/>
          <rect x="20" y="62" width="80" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.08"/>
          <rect x="20" y="80" width="50" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.07"/>
          <rect x="20" y="92" width="75" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.06"/>
          <ellipse cx="355" cy="0" rx="110" ry="75" fill="#00d4ff" fillOpacity="0.05"/>
        </svg>
      </div>
    ),
  },
  'CYBER-TECH': {
    gradient: 'linear-gradient(135deg, #020c18 0%, #041e32 60%, #020c18 100%)',
    glow: 'radial-gradient(ellipse at 20% 78%, #00d4ff1c 0%, transparent 44%)',
    scene: (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 18% 78%, #00d4ff1c 0%, transparent 44%), radial-gradient(ellipse at 82% 22%, #00d4ff14 0%, transparent 42%)' }}/>
        <svg style={{ position: 'absolute', inset: 0 }} width="100%" height="100%" viewBox="0 0 400 176" preserveAspectRatio="xMidYMid slice" fill="none">
          <line x1="0" y1="44" x2="400" y2="44" stroke="#00d4ff" strokeWidth="0.6" strokeOpacity="0.12"/>
          <line x1="0" y1="88" x2="400" y2="88" stroke="#00d4ff" strokeWidth="0.6" strokeOpacity="0.08"/>
          <line x1="0" y1="132" x2="400" y2="132" stroke="#00d4ff" strokeWidth="0.6" strokeOpacity="0.12"/>
          <line x1="80" y1="0" x2="80" y2="176" stroke="#00d4ff" strokeWidth="0.6" strokeOpacity="0.09"/>
          <line x1="160" y1="0" x2="160" y2="176" stroke="#00d4ff" strokeWidth="0.6" strokeOpacity="0.09"/>
          <line x1="240" y1="0" x2="240" y2="176" stroke="#00d4ff" strokeWidth="0.6" strokeOpacity="0.09"/>
          <line x1="320" y1="0" x2="320" y2="176" stroke="#00d4ff" strokeWidth="0.6" strokeOpacity="0.09"/>
          <circle cx="80" cy="44" r="4.5" fill="#00d4ff" fillOpacity="0.55"/>
          <circle cx="80" cy="44" r="10" fill="#00d4ff" fillOpacity="0.12"/>
          <circle cx="320" cy="132" r="3.5" fill="#00d4ff" fillOpacity="0.45"/>
          <circle cx="320" cy="132" r="8" fill="#00d4ff" fillOpacity="0.1"/>
          <circle cx="160" cy="88" r="2.5" fill="#00d4ff" fillOpacity="0.35"/>
          <circle cx="240" cy="44" r="2" fill="#00d4ff" fillOpacity="0.28"/>
          <circle cx="80" cy="132" r="2" fill="#00d4ff" fillOpacity="0.22"/>
          <path d="M168 14L122 38v42c0 30 24 58 46 68 22-10 46-38 46-68V38L168 14z" fill="#00d4ff" fillOpacity="0.05" stroke="#00d4ff" strokeOpacity="0.32" strokeWidth="1.3"/>
          <rect x="154" y="66" width="28" height="22" rx="3" fill="#00d4ff" fillOpacity="0.1" stroke="#00d4ff" strokeOpacity="0.45" strokeWidth="1.1"/>
          <path d="M168 51a9 9 0 0 1 9 9v7h-18v-7a9 9 0 0 1 9-9z" fill="#00d4ff" fillOpacity="0.08" stroke="#00d4ff" strokeOpacity="0.45" strokeWidth="1.1"/>
          <rect x="268" y="18" width="112" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.1"/>
          <rect x="268" y="30" width="78" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.07"/>
          <rect x="268" y="42" width="98" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.08"/>
          <rect x="268" y="60" width="112" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.1"/>
          <rect x="268" y="72" width="58" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.06"/>
          <rect x="268" y="84" width="82" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.07"/>
          <rect x="20" y="148" width="102" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.08"/>
          <rect x="20" y="160" width="72" height="5" rx="2.5" fill="#00d4ff" fillOpacity="0.06"/>
        </svg>
      </div>
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
      <div className="relative w-full h-48 overflow-hidden">
        {image_url && !imgError ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            style={{ objectPosition: 'center top' }}
            onError={() => setImgError(true)}
          />
        ) : (
        /* Fallback — shown when no image_url or image fails to load */
        <div
          className="w-full h-full relative overflow-hidden"
          style={{
            background: fallback
              ? `${fallback.glow}, ${fallback.gradient}`
              : `radial-gradient(ellipse at 30% 50%, ${accent.color}18 0%, transparent 60%), #0c0c0e`,
          }}
        >
          {fallback?.scene ? (
            /* Full-bleed scene — fills the entire image area, no centered icon */
            <div className="absolute inset-0">{fallback.scene}</div>
          ) : (
            <>
              {/* Subtle grid lines (legacy icon fallbacks) */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(${accent.color}08 1px, transparent 1px),
                                    linear-gradient(90deg, ${accent.color}08 1px, transparent 1px)`,
                  backgroundSize: '28px 28px',
                }}
              />
              {/* Centered icon */}
              <div className="absolute inset-0 flex items-center justify-center opacity-80">
                {fallback?.icon ?? null}
              </div>
            </>
          )}
          {/* Bottom fade into card background */}
          <div
            className="absolute bottom-0 left-0 right-0 h-14 z-10"
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
