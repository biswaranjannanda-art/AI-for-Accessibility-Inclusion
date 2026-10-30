import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  BookOpen,
  Layers,
  Database,
  Quote,
  TrendingUp,
  BrainCircuit,
  Activity,
} from 'lucide-react';

interface AnalyticsWidgetProps {
  analytics: {
    totalWorkspaces: number;
    totalDocuments: number;
    totalChunks: number;
    totalExtractions: number;
    totalCitations: number;
    domainDistribution: Array<{ name: string; value: number }>;
    timeline: Array<{ month: string; papers: number; citations: number }>;
    topicClusters: Array<{ topic: string; papers: number; significance: number }>;
    engineStatus?: {
      vectorEngine: string;
      embeddingModel: string;
      synthesisModel: string;
    };
  };
}

const DOMAIN_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Indexed Literature</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{analytics.totalDocuments}</span>
            <span className="text-xs text-emerald-400 font-medium">+100% active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Full text parsed & embedded</p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-indigo-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Dense Vector Passages</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{analytics.totalChunks}</span>
            <span className="text-xs text-cyan-400 font-medium">768-dim</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gemini text-embedding-004</p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cyan-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Structured Extractions</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{analytics.totalExtractions}</span>
            <span className="text-xs text-emerald-400 font-medium">Zod validated</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Empirical methods & findings</p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/5 rounded-full pointer-events-none" />
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-medium">Citations Generated</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Quote className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{analytics.totalCitations}</span>
            <span className="text-xs text-amber-400 font-medium">Strict attribution</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across research synthesis sessions</p>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/5 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Distribution Pie Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Scientific Domain Distribution</h4>
              <p className="text-xs text-slate-400">Research papers partitioned across research domains</p>
            </div>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.domainDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {analytics.domainDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DOMAIN_COLORS[index % DOMAIN_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-2 justify-center">
            {analytics.domainDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: DOMAIN_COLORS[idx % DOMAIN_COLORS.length] }}
                />
                <span>{item.name}</span>
                <span className="font-mono text-slate-500">({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Clusters Bar Chart */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">Research Topic Clusters</h4>
              <p className="text-xs text-slate-400">Cross-document literature clusters by significance</p>
            </div>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.topicClusters}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 100]} />
                <YAxis
                  dataKey="topic"
                  type="category"
                  stroke="#94a3b8"
                  fontSize={10}
                  width={120}
                  tickFormatter={(val) => (val.length > 18 ? val.slice(0, 16) + '...' : val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="significance" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Cluster significance calculated via dense embeddings similarity centroid distance.
          </p>
        </div>
      </div>

      {/* Publication & Citation Timeline */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Publication & Synthesis Timeline</h4>
            <p className="text-xs text-slate-400">
              Cumulative research ingestion and multi-paper synthesis growth
            </p>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.timeline}>
              <defs>
                <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPapers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="citations"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorCitations)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="papers"
                stroke="#06b6d4"
                fillOpacity={1}
                fill="url(#colorPapers)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
