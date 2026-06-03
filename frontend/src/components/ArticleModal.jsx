import { useEffect } from 'react';
import { createPortal } from 'react-dom';

// ---------------------------------------------------------------------------
// Domains that send X-Frame-Options: DENY or equivalent.
// Articles from these sources will show the Preview View instead of an iframe.
// Add new entries here whenever a source is confirmed to block framing.
// ---------------------------------------------------------------------------
const RESTRICTED_DOMAINS = [
  't.me',
  'telegram.me',
  'bbc.co.uk',
  'bbci.co.uk',
  'bbc.com',
  'skysports.com',
  'fifa.com',
  'onefootball.com',
  'theathletic.com',
  'goal.com',
];

function isDomainRestricted(url) {
  try {
    const { hostname } = new URL(url);
    return RESTRICTED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith('.' + d)
    );
  } catch {
    return true; // invalid URL → treat as restricted (safe default)
  }
}

// Accent colours matching ArticleCard's palette
const CATEGORY_ACCENT = {
  'עולם ה-AI והפיתוח':          '#00d4ff',
  'חדשות בעולם הספורט':         '#ff6b35',
  'חדשות בעולם הכדורגל':        '#4ade80',
  'חדשות כלליות בעולם הבידור':  '#f59e0b',
  'חדשות כלליות בעולם':         '#a78bfa',
};

const CATEGORY_FALLBACK_GRADIENT = {
  'עולם ה-AI והפיתוח':          'linear-gradient(135deg, #020d1a, #041830)',
  'חדשות בעולם הספורט':         'linear-gradient(135deg, #120800, #1f0e00)',
  'חדשות בעולם הכדורגל':        'linear-gradient(135deg, #010f04, #021a07)',
  'חדשות כלליות בעולם הבידור':  'linear-gradient(135deg, #120900, #1f1100)',
  'חדשות כלליות בעולם':         'linear-gradient(135deg, #08030f, #120620)',
};

// ---------------------------------------------------------------------------
// Shared header bar — title + open-externally link + close button
// ---------------------------------------------------------------------------
function ModalHeader({ article, accent, onClose }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3
                    bg-[#141416] border-b border-[#222228]">
      <p
        className="flex-1 min-w-0 text-[13px] font-600 text-white font-body truncate"
        dir="rtl"
      >
        {article.title}
      </p>

      <a
        href={article.original_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   text-[11.5px] font-700 font-body text-[#0c0c0e]
                   transition-opacity duration-150 hover:opacity-80"
        style={{ backgroundColor: accent }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        פתח בחלון חדש
      </a>

      <button
        onClick={onClose}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
                   text-[#888893] hover:text-white hover:bg-[#222228]
                   transition-colors duration-150"
        aria-label="סגור"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview View — shown for restricted domains (no iframe)
// ---------------------------------------------------------------------------
function PreviewView({ article, accent }) {
  const fallback = CATEGORY_FALLBACK_GRADIENT[article.category] ?? 'linear-gradient(135deg, #0c0c0e, #141416)';

  return (
    <div className="flex-1 overflow-y-auto bg-[#0c0c0e]">
      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Article image */}
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{ aspectRatio: '16/9' }}
        >
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: fallback }}
            >
              <div
                className="w-16 h-16 rounded-full opacity-30"
                style={{
                  background: `radial-gradient(circle, ${accent}, transparent)`,
                  boxShadow: `0 0 40px ${accent}`,
                }}
              />
            </div>
          )}
        </div>

        {/* Source name badge */}
        {article.source_name && (
          <span
            className="self-start text-[11px] font-700 tracking-wide px-3 py-1 rounded-full font-body"
            style={{ color: accent, backgroundColor: `${accent}20`, border: `1px solid ${accent}40` }}
          >
            {article.source_name}
          </span>
        )}

        {/* Title */}
        <h2
          className="font-display text-[22px] font-800 text-white leading-snug"
          dir="rtl"
        >
          {article.title}
        </h2>

        {/* AI summary */}
        {article.ai_summary && (
          <p
            className="font-body text-[15px] text-[#9898b0] leading-relaxed"
            dir="rtl"
          >
            {article.ai_summary}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-[#222228]" />

        {/* CTA button */}
        <a
          href={article.original_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { e.preventDefault(); window.open(article.original_url, '_blank'); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl
                     text-[15px] font-700 font-body text-[#0c0c0e]
                     transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: accent }}
          dir="rtl"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          קרא את הכתבה המלאה באתר המקורי
        </a>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Iframe View — shown for non-restricted domains
// ---------------------------------------------------------------------------
function IframeView({ article, accent }) {
  return (
    <div className="flex-1 relative bg-[#0c0c0e]">
      {/* Behind-iframe fallback — visible only if iframe is blank/blocked */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
        <p className="text-[#444450] text-[13px] font-body" dir="rtl">
          האתר חסם הצגה בתוך האפליקציה.
        </p>
        <a
          href={article.original_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg text-[12px] font-700 font-body text-[#0c0c0e]
                     transition-opacity hover:opacity-80"
          style={{ backgroundColor: accent }}
        >
          פתח בחלון חדש
        </a>
      </div>

      <iframe
        src={article.original_url}
        title={article.title}
        className="absolute inset-0 w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Smart Modal — entry point
// ---------------------------------------------------------------------------
export default function ArticleModal({ article, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!article) return null;

  const accent = CATEGORY_ACCENT[article.category] ?? '#00d4ff';
  const restricted = isDomainRestricted(article.original_url);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(6,6,8,0.96)' }}
    >
      <ModalHeader article={article} accent={accent} onClose={onClose} />

      {restricted
        ? <PreviewView article={article} accent={accent} />
        : <IframeView  article={article} accent={accent} />
      }
    </div>,
    document.body
  );
}
