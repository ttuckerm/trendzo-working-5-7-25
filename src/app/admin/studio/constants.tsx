export const TOP_20_NICHES = [
  'Personal Finance/Investing','Fitness/Weight Loss','Business/Entrepreneurship','Food/Nutrition Comparisons','Beauty/Skincare','Real Estate/Property','Self-Improvement/Productivity','Dating/Relationships','Education/Study Tips','Career/Job Advice','Parenting/Family','Tech Reviews/Tutorials','Fashion/Style','Health/Medical Education','Cooking/Recipes','Psychology/Mental Health','Travel/Lifestyle','DIY/Home Improvement','Language Learning','Side Hustles/Making Money Online'
];

export interface SystemOverview {
  totalProcessed: number;
  healthy: number;
  warning: number;
  critical: number;
  accuracy: number;
}

export interface ModuleHealth {
  name: string;
  status: string;
  processed: number;
  uptime: string;
  health: 'healthy' | 'warning' | 'critical';
}

export interface DashboardData {
  systemOverview: SystemOverview;
  moduleHealth: ModuleHealth[];
  trendingTemplates: any[];
  lastUpdated: string;
}

export function NicheFilters({ selected, onSelect }: { selected: string; onSelect: (n: string) => void }) {
  return (
    <div className="filter-bar flex gap-2 flex-wrap items-center mb-6">
      <button
        onClick={() => onSelect("")}
        className={`px-3 py-1 rounded-full text-sm border ${!selected ? 'bg-[rgba(229,9,20,0.2)] border-[#e50914] text-white' : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]'}`}
      >
        All Niches
      </button>
      {TOP_20_NICHES.map((niche) => (
        <button
          key={niche}
          onClick={() => onSelect(niche)}
          className={`px-3 py-1 rounded-full text-sm border ${selected === niche ? 'bg-[rgba(229,9,20,0.2)] border-[#e50914] text-white' : 'bg-white/[0.05] border-white/10 hover:bg-white/[0.08]'} `}
          title={niche}
        >
          {niche}
        </button>
      ))}
    </div>
  );
}
