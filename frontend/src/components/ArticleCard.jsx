const CATEGORY_ACCENT = {
  'AI & Tech': { color: '#00d4ff', bg: '#00d4ff18' },
  Sports: { color: '#ff6b35', bg: '#ff6b3518' },
  Football: { color: '#4ade80', bg: '#4ade8018' },
  Entertainment: { color: '#f59e0b', bg: '#f59e0b18' },
  'Global News': { color: '#a78bfa', bg: '#a78bfa18' },
};

const DEFAULT_ACCENT = { color: '#888893', bg: '#88889318' };

export default function ArticleCard({ article, index = 0 }) {
  const {
    title = 'Untitled Article',
    ai_summary = 'No summary available.',
    tag = 'General',
    category = 'Global News',
    image_url = null,
    original_url = '#',
    relevance_score = null,
  } = article ?? {};

  const accent = CATEGORY_ACCENT[category] ?? DEFAULT_ACCENT;

  return (
    <article
      className="fade-up bg-[#141416] border border-[#222228] rounded-xl overflow-hidden
                 hover:border-[#333340] hover:bg-[#161618] transition-all duration-200 group"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image area */}
      <div className="relative w-full h-44 overflow-hidden bg-[#1c1c20]">
        {image_url ? (
          <img
            src={image_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          /* Placeholder */
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full opacity-20"
              style={{
                background: `radial-gradient(circle, ${accent.color}, transparent)`,
                boxShadow: `0 0 30px ${accent.color}`,
              }}
            />
            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `linear-gradient(${accent.color}33 1px, transparent 1px),
                                  linear-gradient(90deg, ${accent.color}33 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />
          </div>
        )}

        {/* Relevance score badge */}
        {relevance_score !== null && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-700 text-white font-body">{relevance_score}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Tag badge */}
        <span
          className="inline-block text-[10px] font-700 tracking-wider uppercase px-2 py-0.5 rounded font-body mb-3"
          style={{ color: accent.color, backgroundColor: accent.bg }}
        >
          {tag}
        </span>

        {/* Title */}
        <h2 className="font-display text-[15px] font-700 leading-snug text-white mb-2 line-clamp-2
                       group-hover:text-[#e8e8f0] transition-colors duration-150">
          {title}
        </h2>

        {/* Summary */}
        <p className="font-body text-[12.5px] text-[#888893] leading-relaxed line-clamp-2 mb-4">
          {ai_summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#222228]">
          <span
            className="text-[11px] font-500 font-body"
            style={{ color: accent.color }}
          >
            {category}
          </span>
          <a
            href={original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11.5px] font-500 font-body text-[#555560]
                       hover:text-white transition-colors duration-150"
          >
            Read more
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
