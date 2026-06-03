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
