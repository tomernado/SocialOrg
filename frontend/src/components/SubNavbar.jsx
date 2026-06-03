// Controlled sub-category constants — must match forceSubCategory values in rss.service.js
export const SPORTS_SUB_CATEGORIES         = ['WORLD-SPORTS', 'ISRAELI-SPORTS', 'BASKETBALL-NBA'];
export const AI_TECH_SUB_CATEGORIES        = ['AI-NEWS', 'GADGETS-LEAKS', 'CYBER-TECH'];
export const ENTERTAINMENT_SUB_CATEGORIES  = ['MUSIC', 'MOVIES-SERIES', 'CELEBS-REALITY', 'ISRAELI-ENTERTAINMENT'];
export const GLOBAL_NEWS_SUB_CATEGORIES    = ['WORLD-NEWS', 'ECONOMY', 'ISRAEL-NEWS'];

/**
 * SubNavbar — horizontal pill strip for sub-category filtering.
 * Receives a hardcoded `options` array; no DB fetch needed.
 * "הכל" (All) is always the first pill (value = null).
 */
export default function SubNavbar({ options, activeSubCategory, onSelect, accent }) {
  if (!options || options.length === 0) return null;

  const pills = [
    { label: 'הכל', value: null },
    ...options.map((v) => ({ label: v, value: v })),
  ];

  return (
    <div className="border-b border-[#222228] bg-[#0c0c0e]/95 backdrop-blur-md">
      <div className="px-6 lg:px-8 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {pills.map(({ label, value }) => {
          const isActive = activeSubCategory === value;
          return (
            <button
              key={label}
              onClick={() => onSelect(value)}
              className={`
                flex-shrink-0 px-3 py-1 rounded-full text-[11.5px] font-bold font-body
                tracking-wide transition-all duration-150 whitespace-nowrap border
                ${isActive
                  ? 'text-[#0c0c0e] border-transparent'
                  : 'text-[#666674] border-[#222228] hover:text-[#c0c0cc] hover:border-[#333340]'
                }
              `}
              style={isActive ? { backgroundColor: accent, borderColor: accent } : {}}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
