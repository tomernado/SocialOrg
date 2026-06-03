const NAV_ITEMS = [
  {
    label: 'Home',
    accent: '#e8e8f0',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: 'Football',
    accent: '#4ade80',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8l3 3-1 4H10l-1-4 3-3z" />
        <path d="M9 4.5L12 8l3-3.5M4.5 9L7 12l-3 3M19.5 9L17 12l3 3M9 19.5L12 16l3 3.5" />
      </svg>
    ),
  },
  {
    label: 'Sports',
    accent: '#ff6b35',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    label: 'AI & Tech',
    accent: '#00d4ff',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    label: 'Entertainment',
    accent: '#f59e0b',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    label: 'Global News',
    accent: '#a78bfa',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeCategory, onSelect }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0c0c0e]/95 backdrop-blur-md border-t border-[#222228]">
      <div className="flex items-stretch justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeCategory === item.label;
          return (
            <button
              key={item.label}
              onClick={() => onSelect(item.label)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg
                         transition-all duration-150 relative"
            >
              {isActive && (
                <span
                  className="absolute top-1.5 w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: item.accent,
                    boxShadow: `0 0 6px ${item.accent}`,
                  }}
                />
              )}
              <span
                className="mt-3 transition-colors duration-150"
                style={{ color: isActive ? item.accent : '#555560' }}
              >
                {item.icon}
              </span>
              <span
                className="text-[9px] font-medium font-body truncate max-w-[52px] transition-colors duration-150"
                style={{ color: isActive ? item.accent : '#555560' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
