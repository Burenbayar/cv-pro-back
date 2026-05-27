import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileText,
  Gauge,
  History,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
  UploadCloud,
  Zap,
} from 'lucide-react';
import {t} from '../i18n';
import type {Language} from '../i18n';

type Severity = 'low' | 'medium' | 'high';
type CvStatus = 'uploaded' | 'parsing' | 'analyzing' | 'completed' | 'failed';
type ActiveView =
  | 'overview' | 'upload' | 'analysis' | 'rewrite'
  | 'interview' | 'career' | 'export' | 'history';

type Metric = {key: string; label: string; value: number; explanation: string; confidence: number};
type Feedback = {id: string; type: string; severity: Severity; original: string; suggestion: string; explanation: string; status: string};
type CvRecord = {id: string; fileName: string; fileType: string; uploadedAt: string; status: CvStatus; overall: number};
type AnalysisResult = {
  candidateName: string; targetRole: string; scores: Metric[];
  summary: string; strengths: string[]; weaknesses: string[];
  keywords: {missing: string[]; recommended: string[]};
  feedback: Feedback[];
  career: {currentLevel: string; recommendedRoles: string[]; missingSkills: string[]};
};

type AuthUser = {id: string; fullName: string; email: string; preferredLanguage: string};

type Props = {
  lang: Language;
  records: CvRecord[];
  analysis: AnalysisResult;
  overall: number;
  user: AuthUser | null;
  setActiveView: (v: ActiveView) => void;
};

const TEAL  = '#009FB7';
const NAVY  = '#333E5B';
const MID   = '#495883';
const BG    = '#F1EDEE';
const WHITE = '#ffffff';

const SEVERITY_META: Record<Severity, {label: string; cls: string}> = {
  high:   {label: 'High',   cls: 'bg-rose-100 text-rose-700'},
  medium: {label: 'Medium', cls: 'bg-amber-100 text-amber-700'},
  low:    {label: 'Low',    cls: 'bg-emerald-100 text-emerald-700'},
};

function getStatusMeta(status: CvStatus) {
  if (status === 'completed') return {label: 'Completed', cls: 'bg-emerald-100 text-emerald-700'};
  if (status === 'analyzing' || status === 'parsing') return {label: 'Processing', cls: 'bg-blue-100 text-blue-700'};
  if (status === 'failed') return {label: 'Failed', cls: 'bg-rose-100 text-rose-700'};
  return {label: 'Uploaded', cls: 'bg-slate-100 text-slate-600'};
}

/* ── Radial ring for overall score ─────────────────────────────────── */
function ScoreRing({value, size = 120}: {value: number; size?: number}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const filled = (value / 100) * circ;
  const color = value >= 70 ? TEAL : value >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
      <circle
        cx="50" cy="50" r={r} fill="none"
        stroke={color} strokeWidth="9"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{transition: 'stroke-dasharray 1s ease'}}
      />
      <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="800" fill={NAVY}>{value}</text>
      <text x="50" y="60" textAnchor="middle" fontSize="9" fill={MID}>/ 100</text>
    </svg>
  );
}

/* ── Donut for skills split ─────────────────────────────────────────── */
const DONUT_COLORS = [TEAL, MID, NAVY, '#64748b', '#94a3b8'];

/* ── Stat card with dark bg (first 2) ─────────────────────────────── */
function DarkStatCard({label, value, sub, color, icon: Icon}: {label: string; value: string | number; sub: string; color: string; icon: React.ElementType}) {
  return (
    <article
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
      style={{backgroundColor: color}}
    >
      <div className="absolute -right-4 -top-4 size-20 rounded-full opacity-10" style={{backgroundColor: WHITE}} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{label}</p>
          <Icon size={18} className="text-white/60" />
        </div>
        <p className="mt-3 text-3xl font-black">{value}</p>
        <p className="mt-1 text-xs text-white/60">{sub}</p>
      </div>
    </article>
  );
}

/* ── Stat card with light bg (last 2) ──────────────────────────────── */
function LightStatCard({label, value, sub, trend, icon: Icon}: {label: string; value: string | number; sub: string; trend?: string; icon: React.ElementType}) {
  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
        <div className="flex size-9 items-center justify-center rounded-xl" style={{backgroundColor: BG}}>
          <Icon size={16} style={{color: NAVY}} />
        </div>
      </div>
      <p className="mt-3 text-3xl font-black" style={{color: NAVY}}>{value}</p>
      <div className="mt-1 flex items-center gap-1.5">
        {trend && (
          <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
            <TrendingUp size={10} /> {trend}
          </span>
        )}
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </article>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export function DashboardView({lang, records, analysis, overall, user, setActiveView}: Props) {
  const atsScore     = analysis.scores[0]?.value ?? 0;
  const skillMatch   = analysis.scores[2]?.value ?? 0;
  const readability  = analysis.scores[1]?.value ?? 0;
  const experience   = analysis.scores[3]?.value ?? 0;
  const grammar      = analysis.scores[4]?.value ?? 0;

  const accepted   = analysis.feedback.filter((f) => f.status === 'accepted').length;
  const totalFb    = analysis.feedback.length;
  const completion = totalFb > 0 ? Math.round((accepted / totalFb) * 100) : 0;

  const barData = [
    {name: 'ATS',          value: atsScore,   fill: TEAL},
    {name: t('navAnalysis', lang), value: readability, fill: MID},
    {name: 'Skills',       value: skillMatch, fill: NAVY},
    {name: 'Exp.',         value: experience, fill: '#64748b'},
    {name: 'Grammar',      value: grammar,    fill: '#94a3b8'},
  ];

  const hasKeywords   = analysis.keywords.recommended.length > 0;
  const skillsDonut   = hasKeywords
    ? analysis.keywords.recommended.slice(0, 5).map((k, i) => ({name: k, value: 20 - i * 2}))
    : [{name: 'No data', value: 1}];

  const pendingFeedback = analysis.feedback.filter((f) => f.status === 'pending').slice(0, 5);

  const hasData = overall > 0;

  return (
    <div className="space-y-6">
      {/* ── Page header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-black" style={{color: NAVY}}>Dashboard</h1>
        <p className="mt-0.5 text-sm" style={{color: MID}}>
          {user ? `${t('welcome', lang)}, ${user.fullName.split(' ')[0]}` : t('welcome', lang)}
        </p>
      </div>

      {/* ── 4 Stat cards ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DarkStatCard
          label="ATS Score"
          value={hasData ? atsScore : '--'}
          sub={t('atsHelper', lang)}
          color={TEAL}
          icon={Gauge}
        />
        <DarkStatCard
          label={t('skillsMatchLabel', lang)}
          value={hasData ? `${skillMatch}%` : '--'}
          sub={t('skillsMatchHelper', lang)}
          color={NAVY}
          icon={BriefcaseBusiness}
        />
        <LightStatCard
          label={lang === 'mn' ? 'CV файл' : 'My CVs'}
          value={records.length || 0}
          sub={lang === 'mn' ? 'нийт оруулсан' : 'total uploaded'}
          icon={FileText}
        />
        <LightStatCard
          label={lang === 'mn' ? 'Сайжруулалт' : 'Improvements'}
          value={hasData ? `${completion}%` : '--'}
          sub={lang === 'mn' ? 'зөвлөмж хэрэглэсэн' : 'suggestions applied'}
          trend={completion > 0 ? `+${completion}%` : undefined}
          icon={ClipboardCheck}
        />
      </div>

      {/* ── Charts row ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">

        {/* Bar chart: 5 score metrics */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black" style={{color: NAVY}}>{lang === 'mn' ? 'Оноонуудын харьцуулалт' : 'Score Breakdown'}</p>
              <p className="text-xs" style={{color: MID}}>{lang === 'mn' ? '5 метрик' : '5 metrics'}</p>
            </div>
            <BarChart3 size={18} style={{color: MID}} />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={28} margin={{top: 4, right: 0, left: -28, bottom: 0}}>
              <XAxis dataKey="name" tick={{fontSize: 10, fill: MID}} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{fill: BG}}
                contentStyle={{fontSize: 12, border: 'none', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,.1)'}}
                formatter={(v) => [`${v}/100`, '']}
              />
              {barData.map((entry) => (
                <Bar key={entry.name} dataKey="value" radius={[6, 6, 0, 0]} fill={entry.fill} isAnimationActive />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Overall score ring */}
        <div className="flex min-w-45 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <p className="text-sm font-black" style={{color: NAVY}}>{t('overallScoreLabel', lang)}</p>
          <ScoreRing value={overall} size={130} />
          <div className="flex gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase text-slate-400">{lang === 'mn' ? 'Авсан' : 'Score'}</p>
              <p className="text-lg font-black" style={{color: TEAL}}>{overall}</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div>
              <p className="text-[10px] uppercase text-slate-400">{lang === 'mn' ? 'CVs' : 'CVs'}</p>
              <p className="text-lg font-black" style={{color: NAVY}}>{records.length}</p>
            </div>
          </div>
        </div>

        {/* AI Feedback / recent suggestions */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black" style={{color: NAVY}}>{lang === 'mn' ? 'AI Санал' : 'AI Feedback'}</p>
              <p className="text-xs" style={{color: MID}}>{lang === 'mn' ? 'Хамгийн сүүлийн' : 'Latest suggestions'}</p>
            </div>
            <Sparkles size={16} style={{color: TEAL}} />
          </div>

          {pendingFeedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl" style={{backgroundColor: BG}}>
                <Sparkles size={20} style={{color: MID}} />
              </div>
              <p className="text-xs" style={{color: MID}}>{t('aiFeedbackEmpty', lang)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingFeedback.map((fb) => {
                const meta = SEVERITY_META[fb.severity];
                return (
                  <div key={fb.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:border-slate-200">
                    <span className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <p className="line-clamp-2 text-xs leading-5 text-slate-600">{fb.suggestion || fb.original}</p>
                  </div>
                );
              })}
              <button
                onClick={() => setActiveView('rewrite')}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-bold hover:bg-brand-bg"
                style={{color: TEAL}}
                type="button"
              >
                {lang === 'mn' ? 'Бүгдийг харах' : 'View all'} <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ─────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">

        {/* Recent CVs table */}
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black" style={{color: NAVY}}>{t('recentCvs', lang)}</p>
              <p className="text-xs" style={{color: MID}}>{lang === 'mn' ? `${records.length} файл` : `${records.length} files`}</p>
            </div>
            <button
              onClick={() => setActiveView('history')}
              className="flex items-center gap-1 text-xs font-bold"
              style={{color: TEAL}}
              type="button"
            >
              {lang === 'mn' ? 'Бүгд' : 'View all'} <ChevronRight size={13} />
            </button>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl" style={{backgroundColor: BG}}>
                <FileText size={24} style={{color: MID}} />
              </div>
              <p className="text-sm font-semibold" style={{color: MID}}>{t('noCvs', lang)}</p>
              <button
                onClick={() => setActiveView('upload')}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white shadow-md"
                style={{backgroundColor: TEAL}}
                type="button"
              >
                <UploadCloud size={16} /> {t('uploadNewCv', lang)}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 grid grid-cols-[1fr_auto_auto] gap-3 border-b border-slate-100 pb-2">
                <p className="text-[10px] font-black uppercase text-slate-400">{lang === 'mn' ? 'Файл' : 'File'}</p>
                <p className="text-[10px] font-black uppercase text-slate-400">{lang === 'mn' ? 'Төлөв' : 'Status'}</p>
                <p className="text-[10px] font-black uppercase text-slate-400">{lang === 'mn' ? 'Оноо' : 'Score'}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {records.slice(0, 5).map((rec) => {
                  const s = getStatusMeta(rec.status);
                  return (
                    <div key={rec.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{backgroundColor: BG}}>
                          <FileText size={14} style={{color: NAVY}} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold" style={{color: NAVY}}>{rec.fileName}</p>
                          <p className="text-[10px] text-slate-400">{rec.uploadedAt}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black ${s.cls}`}>{s.label}</span>
                      <span
                        className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black text-white"
                        style={{backgroundColor: rec.overall >= 70 ? TEAL : rec.overall >= 45 ? '#f59e0b' : rec.overall > 0 ? '#ef4444' : NAVY}}
                      >
                        {rec.overall > 0 ? rec.overall : '--'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right panel: skills donut + career actions */}
        <div className="space-y-4">

          {/* Skills chart */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black" style={{color: NAVY}}>{lang === 'mn' ? 'Ур чадварын хуваарилалт' : 'Skill Distribution'}</p>
              <Target size={16} style={{color: MID}} />
            </div>
            {hasKeywords ? (
              <div className="flex items-center gap-4">
                <PieChart width={90} height={90}>
                  <Pie data={skillsDonut} cx={40} cy={40} innerRadius={26} outerRadius={40} dataKey="value" paddingAngle={3}>
                    {skillsDonut.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex-1 space-y-1.5">
                  {skillsDonut.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="size-2 shrink-0 rounded-full" style={{backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length]}} />
                      <p className="truncate text-[11px] text-slate-600">{item.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">{t('aiFeedbackEmpty', lang)}</p>
            )}
          </div>

          {/* Career & Quick Actions */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-black" style={{color: NAVY}}>{lang === 'mn' ? 'Хурдан үйлдлүүд' : 'Quick Actions'}</p>
            <div className="space-y-2">
              {[
                {label: t('uploadNewCv', lang),    view: 'upload'    as ActiveView, icon: UploadCloud},
                {label: t('reviewRewrites', lang),  view: 'rewrite'   as ActiveView, icon: Sparkles},
                {label: t('prepareInterview', lang),view: 'interview' as ActiveView, icon: MessageSquareText},
                {label: lang === 'mn' ? 'Карьер зөвлөмж' : 'Career Path', view: 'career' as ActiveView, icon: Target},
                {label: t('navExport', lang),       view: 'export'    as ActiveView, icon: Download},
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => setActiveView(action.view)}
                  className="group flex w-full items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 text-left hover:border-slate-200 hover:shadow-sm"
                  style={{backgroundColor: 'white'}}
                  type="button"
                >
                  <span className="flex items-center gap-2.5 text-xs font-bold" style={{color: NAVY}}>
                    <span className="flex size-7 items-center justify-center rounded-lg" style={{backgroundColor: BG}}>
                      <action.icon size={14} style={{color: TEAL}} />
                    </span>
                    {action.label}
                  </span>
                  <ArrowUpRight size={13} style={{color: MID}} className="opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Strengths / Weaknesses ──────────────────────────────────── */}
      {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <p className="text-sm font-black" style={{color: NAVY}}>{t('strengthsLabel', lang)}</p>
            </div>
            <div className="space-y-2">
              {analysis.strengths.slice(0, 4).map((s) => (
                <div key={s} className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  <p className="text-xs leading-5 text-slate-700">{s}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <p className="text-sm font-black" style={{color: NAVY}}>{t('areasLabel', lang)}</p>
            </div>
            <div className="space-y-2">
              {analysis.weaknesses.slice(0, 4).map((w) => (
                <div key={w} className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2.5">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                  <p className="text-xs leading-5 text-slate-700">{w}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Missing keywords / career path ──────────────────────────── */}
      {(analysis.keywords.missing.length > 0 || analysis.career.recommendedRoles.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {analysis.keywords.missing.length > 0 && (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Zap size={16} style={{color: TEAL}} />
                <p className="text-sm font-black" style={{color: NAVY}}>{lang === 'mn' ? 'Дутуу түлхүүр үгс' : 'Missing Keywords'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.missing.slice(0, 12).map((kw) => (
                  <span
                    key={kw}
                    className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
          {analysis.career.recommendedRoles.length > 0 && (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={16} style={{color: MID}} />
                <p className="text-sm font-black" style={{color: NAVY}}>{lang === 'mn' ? 'Карьерын зөвлөмж' : 'Career Recommendations'}</p>
              </div>
              <div className="space-y-2">
                {analysis.career.recommendedRoles.slice(0, 4).map((role, i) => (
                  <div key={role} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                      style={{backgroundColor: i === 0 ? TEAL : MID}}
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs font-semibold text-slate-700">{role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
