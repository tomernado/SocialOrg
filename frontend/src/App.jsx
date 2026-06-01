import { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ArticleCard from './components/ArticleCard.jsx';

// Placeholder articles for UI preview
const PLACEHOLDER_ARTICLES = [
  {
    title: 'Google DeepMind releases new multimodal reasoning model with chain-of-thought capabilities',
    ai_summary: 'The new model demonstrates significant improvements in complex reasoning tasks, outperforming previous benchmarks on math and coding challenges.',
    tag: 'AI Research',
    category: 'AI & Tech',
    image_url: null,
    original_url: '#',
    relevance_score: 94,
  },
  {
    title: 'Open-source LLM surpasses GPT-4 on HumanEval benchmark for the first time',
    ai_summary: 'A community-driven model trained on curated datasets achieves state-of-the-art code generation, challenging the dominance of closed-source providers.',
    tag: 'Open Source',
    category: 'AI & Tech',
    image_url: null,
    original_url: '#',
    relevance_score: 88,
  },
  {
    title: 'Champions League final: Real Madrid secures record 16th European title in dramatic penalty shootout',
    ai_summary: "Vinicius Jr. scored the decisive penalty as Madrid edged past PSG in a tense final at Wembley, marking Ancelotti's fourth Champions League trophy.",
    tag: 'Champions League',
    category: 'Football',
    image_url: null,
    original_url: '#',
    relevance_score: 97,
  },
  {
    title: 'Cannes 2026: Palme d\'Or awarded to debut director\'s intimate portrait of grief',
    ai_summary: "This year's festival surprised many by selecting a low-budget debut film over major studio entries, citing its raw emotional authenticity.",
    tag: 'Film',
    category: 'Entertainment',
    image_url: null,
    original_url: '#',
    relevance_score: 76,
  },
  {
    title: 'G7 summit reaches landmark agreement on AI governance and cross-border data regulation',
    ai_summary: 'Leaders from the seven nations signed a non-binding framework establishing shared principles for AI oversight, with binding treaties expected by 2027.',
    tag: 'Politics',
    category: 'Global News',
    image_url: null,
    original_url: '#',
    relevance_score: 91,
  },
  {
    title: 'NBA Finals: OKC Thunder defeats Boston Celtics in six games to claim first championship',
    ai_summary: 'Shai Gilgeous-Alexander wins Finals MVP after averaging 34 points per game, cementing his legacy as one of the premier players of his generation.',
    tag: 'Basketball',
    category: 'Sports',
    image_url: null,
    original_url: '#',
    relevance_score: 85,
  },
];

const CATEGORY_META = {
  'AI & Tech':     { accent: '#00d4ff', description: 'Artificial intelligence, machine learning & developer news' },
  Sports:          { accent: '#ff6b35', description: 'Latest scores, trades, and analysis across all sports' },
  Football:        { accent: '#4ade80', description: 'Matchday results, transfers, and tactical breakdowns' },
  Entertainment:   { accent: '#f59e0b', description: 'Films, music, streaming, and pop culture' },
  'Global News':   { accent: '#a78bfa', description: 'Politics, economics, and world affairs' },
};

export default function App() {
  const [activeCategory, setActiveCategory] = useState('AI & Tech');

  const filtered = PLACEHOLDER_ARTICLES.filter(
    (a) => a.category === activeCategory
  );

  const meta = CATEGORY_META[activeCategory];

  return (
    <div className="min-h-screen bg-[#0c0c0e] font-body">
      <Sidebar activeCategory={activeCategory} onSelect={setActiveCategory} />

      {/* Main content — offset by sidebar width on lg+ */}
      <main className="lg:pl-[260px] min-h-screen flex flex-col">

        {/* Top header bar */}
        <header className="sticky top-0 z-20 bg-[#0c0c0e]/90 backdrop-blur-md border-b border-[#222228]">
          <div className="px-6 lg:px-8 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-xl font-700 text-white truncate">
                  {activeCategory}
                </h1>
                {/* Live indicator */}
                <span className="flex items-center gap-1.5 text-[10px] font-600 font-body tracking-wider uppercase"
                  style={{ color: meta.accent }}>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: meta.accent }} />
                    <span className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: meta.accent }} />
                  </span>
                  Live
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-[#888893] font-body font-400">
                {meta.description}
              </p>
            </div>

            {/* Article count */}
            <div className="flex-shrink-0 text-right">
              <span className="text-[13px] font-600 text-white font-body">{filtered.length}</span>
              <span className="text-[12px] text-[#444450] font-body"> / 20 articles</span>
            </div>
          </div>
        </header>

        {/* Feed */}
        <section className="flex-1 px-6 lg:px-8 py-7">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((article, i) => (
                <ArticleCard key={article.title} article={article} index={i} />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div
                className="w-16 h-16 rounded-full mb-5 flex items-center justify-center opacity-30"
                style={{ backgroundColor: `${meta.accent}18` }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke={meta.accent} strokeWidth="1.5">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <p className="font-display text-lg font-700 text-[#333340] mb-1">No articles yet</p>
              <p className="text-[13px] text-[#444450] font-body">
                RSS fetching will populate this feed automatically.
              </p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="px-6 lg:px-8 py-4 border-t border-[#222228]">
          <p className="text-[11px] text-[#333340] font-body">
            SocialOrg — Personal AI News Aggregator &nbsp;·&nbsp; Free tier &nbsp;·&nbsp; Max 20 articles / sub-category
          </p>
        </footer>
      </main>
    </div>
  );
}
