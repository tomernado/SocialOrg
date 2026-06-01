import { useState } from 'react';

const NAV_ITEMS = [
  {
    label: 'AI & Tech',
    accent: '#00d4ff',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    label: 'Sports',
    accent: '#ff6b35',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    label: 'Football',
    accent: '#4ade80',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8l3 3-1 4H10l-1-4 3-3z" />
        <path d="M9 4.5L12 8l3-3.5M4.5 9L7 12l-3 3M19.5 9L17 12l3 3M9 19.5L12 16l3 3.5" />
      </svg>
    ),
  },
  {
    label: 'Entertainment',
    accent: '#f59e0b',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    label: 'Global News',
    accent: '#a78bfa',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function Sidebar({ activeCategory, onSelect }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-[#222228]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-[#00d4ff] to-[#a78bfa] opacity-90" />
          <span className="font-display text-[17px] font-700 tracking-tight text-white">
            SocialOrg
          </span>
        </div>
        <p className="mt-1 text-[11px] text-[#888893] tracking-wider uppercase font-body font-500">
          AI News Feed
        </p>
      </div>

      {/* Section label */}
      <div className="px-6 pt-6 pb-2">
        <span className="text-[10px] font-600 tracking-[0.12em] uppercase text-[#444450] font-body">
          Categories
        </span>
      </div>

      {/* Nav items */}
      <ul className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = activeCategory === item.label;
          return (
            <li key={item.label}>
              <button
                onClick={() => {
                  onSelect(item.label);
                  setMobileOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                  transition-all duration-150 group
                  ${isActive
                    ? 'bg-[#1c1c20] text-white'
                    : 'text-[#888893] hover:text-[#c8c8d0] hover:bg-[#141416]'
                  }
                `}
              >
                {/* Accent dot */}
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? item.accent : 'transparent',
                    boxShadow: isActive ? `0 0 6px ${item.accent}` : 'none',
                  }}
                />
                {/* Icon */}
                <span
                  className="flex-shrink-0 transition-colors duration-150"
                  style={{ color: isActive ? item.accent : 'currentColor' }}
                >
                  {item.icon}
                </span>
                {/* Label */}
                <span className="font-body text-[13.5px] font-500 tracking-tight">
                  {item.label}
                </span>
                {/* Live badge placeholder */}
                {isActive && (
                  <span
                    className="ml-auto text-[9px] font-700 tracking-wider uppercase px-1.5 py-0.5 rounded font-body"
                    style={{
                      color: item.accent,
                      backgroundColor: `${item.accent}18`,
                    }}
                  >
                    Live
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-[#222228]">
        <p className="text-[11px] text-[#444450] font-body">
          Powered by Gemini · Free Tier
        </p>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#141416] border border-[#222228] text-[#888893] hover:text-white"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {mobileOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] z-40
          bg-[#0c0c0e] border-r border-[#222228]
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {navContent}
      </aside>
    </>
  );
}
