import {useEffect, useMemo, useRef, useState} from 'react';
import type {MutableRefObject, ReactNode} from 'react';
import {t, tArr, langStorage} from './i18n';
import type {Language} from './i18n';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookmarkCheck,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  Gauge,
  GraduationCap,
  History,
  Languages,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  MessageSquareText,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  User,
  UserRound,
  X,
  ZoomIn,
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import {CvExportImprovements} from './components/CvExportImprovements';
import {CvPreviewModal} from './components/CvPreviewModal';
import {ExportPdfPreview} from './components/ExportPdfPreview';
import {resolveCandidateName} from '@shared/cvSections';

type CvStatus = 'uploaded' | 'parsing' | 'analyzing' | 'completed' | 'failed';
type Severity = 'low' | 'medium' | 'high';
type ActiveView = 'overview' | 'upload' | 'analysis' | 'rewrite' | 'interview' | 'career' | 'export' | 'history' | 'login' | 'register';

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  preferredLanguage: string;
};

type Metric = {
  key: string;
  label: string;
  value: number;
  explanation: string;
  confidence: number;
};

type Feedback = {
  id: string;
  type: string;
  severity: Severity;
  original: string;
  suggestion: string;
  explanation: string;
  status: 'pending' | 'accepted' | 'rejected';
};

type CvRecord = {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  status: CvStatus;
  overall: number;
};

type AnalysisResult = {
  candidateName: string;
  targetRole: string;
  rewrittenCv: string;
  sourceCvText: string;
  scores: Metric[];
  summary: string;
  strengths: string[];
  weaknesses: string[];
  keywords: {missing: string[]; recommended: string[]};
  feedback: Feedback[];
  interview: {
    technical: string[];
    hr: string[];
    behavioral: string[];
    suggestedAnswers: string[];
  };
  career: {
    currentLevel: string;
    recommendedRoles: string[];
    missingSkills: string[];
    roadmap: string[];
    estimatedDuration: string;
  };
};

type AppCopy = {
  appName: string; subtitle: string; welcome: string; welcomeDesc: string;
  uploadTitle: string; uploadDesc: string; analyze: string; jobDesc: string;
  rawText: string; export: string; login: string; register: string; logout: string;
  email: string; password: string; fullName: string; loginTitle: string;
  loginDesc: string; registerTitle: string; registerDesc: string;
  noAccount: string; hasAccount: string; authError: string;
  chooseFile: string; dropFile: string;
};

function getCopy(lang: Language): AppCopy {
  return {
    appName:       t('appName', lang),       subtitle:      t('subtitle', lang),
    welcome:       t('welcome', lang),        welcomeDesc:   t('welcomeDesc', lang),
    uploadTitle:   t('uploadTitle', lang),    uploadDesc:    t('uploadDesc', lang),
    analyze:       t('analyze', lang),        jobDesc:       t('jobDescLabel', lang),
    rawText:       t('rawTextLabel', lang),   export:        t('navExport', lang),
    login:         t('login', lang),          register:      t('register', lang),
    logout:        t('logout', lang),         email:         t('email', lang),
    password:      t('password', lang),       fullName:      t('fullName', lang),
    loginTitle:    t('loginTitle', lang),     loginDesc:     t('loginDesc', lang),
    registerTitle: t('registerTitle', lang),  registerDesc:  t('registerDesc', lang),
    noAccount:     t('noAccount', lang),      hasAccount:    t('hasAccount', lang),
    authError:     t('authError', lang),      chooseFile:    t('chooseFile', lang),
    dropFile:      t('dropFile', lang),
  };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const PROTECTED_VIEWS: ActiveView[] = ['overview', 'upload', 'analysis', 'rewrite', 'interview', 'career', 'export', 'history'];

const navigation: Array<{id: ActiveView; labelKey: Parameters<typeof t>[0]; icon: LucideIcon}> = [
  {id: 'overview',  labelKey: 'navOverview',  icon: LayoutDashboard},
  {id: 'upload',    labelKey: 'navUpload',    icon: UploadCloud},
  {id: 'analysis',  labelKey: 'navAnalysis',  icon: BarChart3},
  {id: 'rewrite',   labelKey: 'navRewrite',   icon: Sparkles},
  {id: 'interview', labelKey: 'navInterview', icon: MessageSquareText},
  {id: 'career',    labelKey: 'navCareer',    icon: Target},
  {id: 'export',    labelKey: 'navExport',    icon: Download},
  {id: 'history',   labelKey: 'navHistory',   icon: History},
];

const defaultAnalysis: AnalysisResult = {
  candidateName: '',
  targetRole: '',
  rewrittenCv: '',
  sourceCvText: '',
  scores: [
    {key: 'atsScore',    label: 'ATS Score',    value: 0, explanation: '', confidence: 0},
    {key: 'readability', label: 'Readability',   value: 0, explanation: '', confidence: 0},
    {key: 'skillsMatch', label: 'Skills Match',  value: 0, explanation: '', confidence: 0},
    {key: 'experience',  label: 'Experience',    value: 0, explanation: '', confidence: 0},
    {key: 'grammar',     label: 'Grammar',       value: 0, explanation: '', confidence: 0},
  ],
  summary: '',
  strengths: [],
  weaknesses: [],
  keywords: {missing: [], recommended: []},
  feedback: [],
  interview: {technical: [], hr: [], behavioral: [], suggestedAnswers: []},
  career: {currentLevel: '', recommendedRoles: [], missingSkills: [], roadmap: [], estimatedDuration: ''},
};

function calculateOverall(scores: Metric[]) {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((sum, m) => sum + m.value, 0) / scores.length);
}

function getStatusText(status: CvStatus, lang: Language) {
  const map: Record<CvStatus, Parameters<typeof t>[0]> = {
    uploaded: 'statusUploaded', parsing: 'statusParsing',
    analyzing: 'statusAnalyzing', completed: 'statusCompleted', failed: 'statusFailed',
  };
  return t(map[status], lang);
}

function severityClass(severity: Severity) {
  if (severity === 'high') return 'border-rose-300 bg-rose-50 text-rose-700';
  if (severity === 'medium') return 'border-amber-300 bg-amber-50 text-amber-700';
  return 'border-emerald-300 bg-emerald-50 text-emerald-700';
}

function feedbackTypeLabel(type: string, lang: Language) {
  if (type === 'cv_improvement') return t('cvImprovementType', lang);
  return type.replace(/_/g, ' ');
}

function isGenericFeedbackExplanation(text: string) {
  const t = text.trim().toLowerCase();
  return (
    t === 'improves ats alignment and recruiter readability.' ||
    t === 'ats болон recruiter уншигдах байдлыг сайжруулна.'
  );
}

function severityLabel(severity: Severity, lang: Language) {
  const labels: Record<Severity, {mn: string; en: string}> = {
    high: {mn: 'Өндөр', en: 'High'},
    medium: {mn: 'Дунд', en: 'Medium'},
    low: {mn: 'Бага', en: 'Low'},
  };
  return labels[severity][lang];
}

function buildFileType(file: File): 'pdf' | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  return null;
}


function normalizeApiAnalysis(payload: any, lang: Language): AnalysisResult | null {
  if (!payload) return null;
  const data = payload.data || payload;

  const scores: Metric[] = Array.isArray(data.scores) ? data.scores : [];
  const feedback: Feedback[] = [];

  if (Array.isArray(data.suggestions) && data.suggestions.length) {
    data.suggestions.forEach((s: any) => {
      feedback.push({
        id: s.id,
        type: s.type || 'cv_improvement',
        severity: s.severity || 'medium',
        original: s.original || '',
        suggestion: s.suggestion || '',
        explanation: s.explanation || '',
        status: s.status || 'pending',
      });
    });
  } else if (Array.isArray(data.feedback)) {
    data.feedback.forEach((s: any, i: number) => {
      feedback.push({
        id: s.id || `fb_${i}`,
        type: s.type || 'cv_improvement',
        severity: s.severity || 'medium',
        original: s.original || '',
        suggestion: s.suggestion || '',
        explanation: s.explanation || '',
        status: s.status || 'pending',
      });
    });
  } else {
    const suggestions = data.cvImprovementSuggestions || [];
    const weakPoints = data.weakPoints || [];
    const severities: Severity[] = ['high', 'medium', 'low', 'low'];
    suggestions.slice(0, 4).forEach((sug: string, i: number) => {
      feedback.push({
        id: `fb_${i}`,
        type: 'cv_improvement',
        severity: severities[i] || 'low',
        original: weakPoints[i] || (lang === 'mn' ? 'CV хэсэг сайжруулах шаардлагатай' : 'CV section needs improvement'),
        suggestion: sug,
        explanation: lang === 'mn' ? 'ATS болон recruiter уншигдах байдлыг сайжруулна.' : 'Improves ATS alignment and recruiter readability.',
        status: 'pending',
      });
    });
  }

  const career = data.career || {
    currentLevel: data.experienceLevel || '',
    recommendedRoles: data.careerRecommendations || [],
    missingSkills: data.missingSkills || [],
    roadmap: (data.careerRecommendations || []).map((r: string, i: number) => `${i + 1}. ${r}`),
    estimatedDuration: lang === 'mn' ? '3-6 сар' : '3-6 months',
  };

  const interview = data.interview || {
    technical: [],
    hr: [],
    behavioral: [],
    suggestedAnswers: [],
  };

  const cvTextForName = String(data.sourceCvText || payload.sourceCvText || data.rewrittenCv || '');
  return {
    candidateName: resolveCandidateName({
      candidateName: data.candidateName || data.fullName || '',
      cvText: cvTextForName,
      fullName: data.fullName || '',
    }),
    targetRole: data.targetRole || data.jobTitle || '',
    rewrittenCv: data.rewrittenCv || data.improvedCv || data.improved_cv || '',
    sourceCvText: String(data.sourceCvText || payload.sourceCvText || ''),
    scores: scores.length ? scores : defaultAnalysis.scores,
    summary: data.summary || '',
    strengths: Array.isArray(data.strengths) ? data.strengths : (data.skills || []).slice(0, 5),
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : (data.weakPoints || []),
    keywords: {
      missing: data.keywords?.missing || data.missingSkills || [],
      recommended: data.keywords?.recommended || data.skills || [],
    },
    feedback,
    interview,
    career,
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileName(value: string, fallback = 'improved-cv') {
  return (value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || fallback;
}

function getStoredAuth(): {token: string; user: AuthUser} | null {
  try {
    const raw = localStorage.getItem('cv_auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeAuth(token: string, user: AuthUser) {
  localStorage.setItem('cv_auth', JSON.stringify({token, user}));
}

function clearAuth() {
  localStorage.removeItem('cv_auth');
}

function createEmptyAnalysis(): AnalysisResult {
  return {
    ...defaultAnalysis,
    scores: defaultAnalysis.scores.map((s) => ({...s})),
    feedback: [],
    keywords: {missing: [], recommended: []},
    interview: {technical: [], hr: [], behavioral: [], suggestedAnswers: []},
    career: {currentLevel: '', recommendedRoles: [], missingSkills: [], roadmap: [], estimatedDuration: ''},
  };
}

type SessionCvResetters = {
  setAnalysis: (a: AnalysisResult) => void;
  setRecords: (r: CvRecord[]) => void;
  setCurrentCvId: (id: string) => void;
  setRawText: (t: string) => void;
  setSelectedFile: (f: File | null) => void;
  setJobDescription: (j: string) => void;
  setUploadError: (e: string) => void;
  setProfileImage: (url: string) => void;
};

function resetSessionCvState(resetters: SessionCvResetters) {
  resetters.setAnalysis(createEmptyAnalysis());
  resetters.setRecords([]);
  resetters.setCurrentCvId('');
  resetters.setRawText('');
  resetters.setSelectedFile(null);
  resetters.setJobDescription('');
  resetters.setUploadError('');
  resetters.setProfileImage('');
}

function normalizeDbAnalysis(
  record: any,
  accountFullName?: string,
): {analysis: AnalysisResult; cvId: string} | null {
  if (!record?.analysis) return null;
  const a = record.analysis;
  const cvText = String(a.sourceCvText || record.sourceCvText || a.rewrittenCv || record.rewrittenCv || '').trim();
  const suggestions: Feedback[] = Array.isArray(a.suggestions)
    ? a.suggestions.map((s: any) => ({
        id: s.id,
        type: s.type || 'cv_improvement',
        severity: (s.severity as Severity) || 'medium',
        original: s.original || '',
        suggestion: s.suggestion || '',
        explanation: s.explanation || '',
        status: s.status || 'pending',
      }))
    : [];
  const resolvedName = resolveCandidateName({
    candidateName: a.candidateName || record.candidateName || '',
    cvText,
    fullName: record.request?.fullName || accountFullName || '',
  });

  return {
    cvId: record.id,
    analysis: {
      candidateName: resolvedName,
      targetRole: a.targetRole || record.jobDescription || '',
      rewrittenCv: a.rewrittenCv || record.rewrittenCv || '',
      sourceCvText: a.sourceCvText || record.sourceCvText || '',
      scores: Array.isArray(a.scores) && a.scores.length ? a.scores : defaultAnalysis.scores,
      summary: a.summary || '',
      strengths: Array.isArray(a.strengths) ? a.strengths : [],
      weaknesses: Array.isArray(a.weaknesses) ? a.weaknesses : [],
      keywords: {
        missing: Array.isArray(a.keywordsMissing) ? a.keywordsMissing : [],
        recommended: Array.isArray(a.keywordsRecommended) ? a.keywordsRecommended : [],
      },
      feedback: suggestions,
      interview: a.interview || {technical: [], hr: [], behavioral: [], suggestedAnswers: []},
      career: a.career || {currentLevel: '', recommendedRoles: [], missingSkills: [], roadmap: [], estimatedDuration: ''},
    },
  };
}

async function fetchAndApplyHistory(
  authToken: string,
  resetters: SessionCvResetters,
  accountFullName?: string,
) {
  try {
    const histRes = await fetch('/api/career/history', {
      headers: {Authorization: `Bearer ${authToken}`},
    });
    if (!histRes.ok) {
      resetSessionCvState(resetters);
      return;
    }
    const {history} = await histRes.json();
    if (!Array.isArray(history) || history.length === 0) {
      resetSessionCvState(resetters);
      return;
    }

    resetters.setRecords(
      history.map((h: any) => ({
        id: h.id,
        fileName: h.fileName,
        fileType: h.fileType,
        uploadedAt: (h.uploadedAt || '').slice(0, 10),
        status: h.status as CvStatus,
        overall: h.overall || 0,
      })),
    );

    const latest = history[0];
    const detailRes = await fetch(`/api/career/analysis/${latest.id}`, {
      headers: {Authorization: `Bearer ${authToken}`},
    });
    if (!detailRes.ok) {
      resetSessionCvState(resetters);
      return;
    }
    const {record} = await detailRes.json();
    const normalized = normalizeDbAnalysis(record, accountFullName);
    if (normalized) {
      resetters.setAnalysis(normalized.analysis);
      resetters.setCurrentCvId(normalized.cvId);
    } else {
      resetSessionCvState(resetters);
    }
  } catch {
    resetSessionCvState(resetters);
  }
}

function buildCvPreviewData(analysis: AnalysisResult, accountFullName?: string) {
  const cvText = (analysis.sourceCvText || analysis.rewrittenCv).trim();
  return {
    candidateName:
      resolveCandidateName({
        candidateName: analysis.candidateName,
        cvText,
        fullName: accountFullName || '',
      }) || analysis.candidateName,
    targetRole: analysis.targetRole,
    rewrittenCv: analysis.rewrittenCv,
    sourceCvText: analysis.sourceCvText,
    skills: analysis.keywords.recommended,
    accountFullName,
  };
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => langStorage.get());
  const [activeView, setActiveView] = useState<ActiveView>('login');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  const [records, setRecords] = useState<CvRecord[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult>(defaultAnalysis);
  const [currentCvId, setCurrentCvId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [processingStatus, setProcessingStatus] = useState<CvStatus>('completed');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState('');
  const [profileImage, setProfileImage] = useState<string>('');
  const [historyLoading, setHistoryLoading] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const profileImageRef = useRef<HTMLInputElement | null>(null);

  const sessionResetters: SessionCvResetters = {
    setAnalysis,
    setRecords,
    setCurrentCvId,
    setRawText,
    setSelectedFile,
    setJobDescription,
    setUploadError,
    setProfileImage,
  };

  const cvSessionKey = `${user?.id || 'guest'}-${currentCvId || 'none'}`;

  const copy = getCopy(lang);
  const overall = useMemo(() => calculateOverall(analysis.scores), [analysis]);
  const acceptedCount = analysis.feedback.filter((f) => f.status === 'accepted').length;

  // Persist language choice to localStorage whenever it changes
  useEffect(() => { langStorage.set(lang); }, [lang]);

  // On mount: restore session
  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      setAuthLoading(false);
      setSessionReady(true);
      setActiveView('login');
      return;
    }
    fetch('/api/auth/me', {headers: {Authorization: `Bearer ${stored.token}`}})
      .then((r) => r.json())
      .then(async (data) => {
        if (data.user) {
          setUser(data.user);
          setToken(stored.token);
          setActiveView('overview');
          resetSessionCvState(sessionResetters);
          setSessionReady(false);
          await fetchAndApplyHistory(stored.token, sessionResetters, data.user.fullName);
        } else {
          clearAuth();
          setActiveView('login');
        }
      })
      .catch(() => {
        clearAuth();
        setActiveView('login');
      })
      .finally(() => {
        setAuthLoading(false);
        setSessionReady(true);
      });
  }, []);

  const setTemporaryToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const handleLogin = async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password}),
      });
      const data = await res.json();
      if (!res.ok || !data.token) return data?.error?.message || copy.authError;
      storeAuth(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      resetSessionCvState(sessionResetters);
      setActiveView('overview');
      setSessionReady(false);
      await fetchAndApplyHistory(data.token, sessionResetters, data.user.fullName);
      setSessionReady(true);
      return null;
    } catch {
      return copy.authError;
    }
  };

  const handleRegister = async (fullName: string, email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({fullName, email, password, language: lang}),
      });
      const data = await res.json();
      if (!res.ok || !data.token) return data?.error?.message || copy.authError;
      storeAuth(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      resetSessionCvState(sessionResetters);
      setSessionReady(true);
      setActiveView('overview');
      return null;
    } catch {
      return copy.authError;
    }
  };

  const handleLogout = async () => {
    if (token) {
      fetch('/api/auth/logout', {method: 'POST', headers: {Authorization: `Bearer ${token}`}}).catch(() => {});
    }
    clearAuth();
    setUser(null);
    setToken('');
    resetSessionCvState(sessionResetters);
    setSessionReady(true);
    setActiveView('login');
  };

  const loadHistoryItem = async (cvId: string) => {
    setHistoryLoading(cvId);
    try {
      const res = await fetch(`/api/career/analysis/${cvId}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error('fetch failed');
      const {record} = await res.json();
      const normalized = normalizeDbAnalysis(record, user?.fullName);
      if (normalized) {
        setAnalysis(normalized.analysis);
        setCurrentCvId(normalized.cvId);
        setActiveView('analysis');
        setTemporaryToast(t('analysisLoaded', lang));
      }
    } catch {
      setTemporaryToast(t('loadFailed', lang));
    } finally {
      setHistoryLoading('');
    }
  };

  const handleProfileImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setProfileImage((e.target?.result as string) || '');
    reader.readAsDataURL(file);
  };

  const navigateTo = (view: ActiveView) => {
    if (PROTECTED_VIEWS.includes(view) && !user) {
      setActiveView('login');
      return;
    }
    setActiveView(view);
  };

  const handleFile = async (file: File) => {
    setUploadError('');
    const fileType = buildFileType(file);
    if (!fileType) {
      setUploadError(t('onlyPdf', lang));
      setSelectedFile(null);
      return;
    }
    if (file.size <= 0) {
      setUploadError(t('emptyFile', lang));
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(t('fileTooLarge', lang));
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);

    if (fileType === 'pdf') {
      try {
        const {extractTextFromPdfFile} = await import('./lib/extractCvText');
        const text = await extractTextFromPdfFile(file);
        if (text.length > 40) {
          setRawText(text);
          setTemporaryToast(lang === 'mn' ? `CV текст уншлаа (${text.length} тэмдэгт).` : `CV text loaded (${text.length} chars).`);
        }
      } catch {
        /* server-side parse will try */
      }
    }
  };

  const runAnalysis = async () => {
    if (!token || !user) {
      setUploadError(t('loginRequired', lang));
      setActiveView('login');
      return;
    }
    if (!selectedFile && !rawText.trim()) {
      setUploadError(t('cvRequired', lang));
      return;
    }
    setIsProcessing(true);
    setUploadError('');
    setProcessingStatus('parsing');
    let nextView: ActiveView = 'analysis';

    await new Promise((r) => window.setTimeout(r, 400));
    setProcessingStatus('analyzing');
    await new Promise((r) => window.setTimeout(r, 600));

    try {
      const formData = new FormData();
      if (selectedFile) formData.append('cvFile', selectedFile);
      formData.append('cvText', rawText);
      formData.append('targetRole', jobDescription || 'Software Engineer');
      formData.append('language', lang);
      if (user?.fullName) formData.append('fullName', user.fullName);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/career/analyze', {method: 'POST', headers, body: formData});
      const payload = await res.json();

      if (res.status === 401) {
        clearAuth();
        setUser(null);
        setToken('');
        resetSessionCvState(sessionResetters);
        setSessionReady(true);
        setActiveView('login');
        setUploadError(t('sessionExpired', lang));
        return;
      }
      if (!res.ok || payload.success === false) throw new Error(payload?.error?.message || 'Analysis failed');

      const normalized = normalizeApiAnalysis(payload, lang);
      if (normalized) {
        const uploadedText = String(payload.sourceCvText || rawText || '').trim();
        normalized.sourceCvText = uploadedText;
        normalized.candidateName =
          resolveCandidateName({
            candidateName: normalized.candidateName,
            cvText: uploadedText || normalized.rewrittenCv,
            fullName: user?.fullName || '',
          }) || normalized.candidateName;
        setAnalysis(normalized);
        nextView = 'rewrite';
        if (payload.cvId) setCurrentCvId(payload.cvId);
        const newOverall = calculateOverall(normalized.scores);
        const newRecord: CvRecord = {
          id: payload.cvId || `cv_${Date.now()}`,
          fileName: selectedFile ? selectedFile.name : 'cv-text.txt',
          fileType: selectedFile ? (buildFileType(selectedFile) || 'txt') : 'txt',
          uploadedAt: new Date().toISOString().slice(0, 10),
          status: 'completed',
          overall: newOverall,
        };
        await fetchAndApplyHistory(token, sessionResetters, user?.fullName);
        const chars = Number(payload.cvTextLength || 0);
        const hasNewCv = Boolean(normalized.rewrittenCv.trim());
        setTemporaryToast(
          hasNewCv
            ? lang === 'mn'
              ? `Таны CV (${chars || '—'} тэмдэгт) шинжлэгдэж, шинэ CV бэлэн боллоо.`
              : `Your CV was analyzed (${chars || '—'} chars). New CV is ready.`
            : lang === 'mn'
              ? 'Шинэ CV үүсээгүй. PDF-ийн текстийг paste хийж дахин оролдоно уу.'
              : 'No new CV generated. Paste CV text and try again.',
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setTemporaryToast(msg || t('serverError', lang));
      setProcessingStatus('completed');
      setIsProcessing(false);
      return;
    }

    setProcessingStatus('completed');
    setIsProcessing(false);
    setActiveView(nextView);
  };

  const acceptFeedback = async (id: string) => {
    if (token && currentCvId) {
      await fetch(`/api/career/suggestions/${id}/approve`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`},
      }).catch(() => {});
    }
    let allAccepted = false;
    setAnalysis((cur) => {
      const feedback = cur.feedback.map((f) => (f.id === id ? {...f, status: 'accepted' as const} : f));
      allAccepted = feedback.length > 0 && feedback.every((f) => f.status === 'accepted');
      return {...cur, feedback};
    });
    if (allAccepted) {
      setTemporaryToast(t('allAcceptedToast', lang));
      window.setTimeout(() => navigateTo('export'), 400);
      return;
    }
    setTemporaryToast(t('suggestionAccepted', lang));
  };

  const rejectFeedback = async (id: string) => {
    if (token && currentCvId) {
      await fetch(`/api/career/suggestions/${id}/reject`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`},
      }).catch(() => {});
    }
    setAnalysis((cur) => ({
      ...cur,
      feedback: cur.feedback.map((f) => (f.id === id ? {...f, status: 'rejected' as const} : f)),
    }));
    setTemporaryToast(t('suggestionRejected', lang));
  };

  const regenerateFeedback = async (id: string) => {
    if (token && currentCvId) {
      try {
        const res = await fetch(`/api/career/suggestions/${id}/regenerate`, {
          method: 'POST',
          headers: {Authorization: `Bearer ${token}`},
        });
        const data = await res.json();
        if (data.suggestion) {
          setAnalysis((cur) => ({
            ...cur,
            feedback: cur.feedback.map((f) => (f.id === id ? {...f, suggestion: data.suggestion.suggestion, status: 'pending' as const} : f)),
          }));
          setTemporaryToast(t('suggestionRegenned', lang));
          return;
        }
      } catch {}
    }
    setAnalysis((cur) => ({
      ...cur,
      feedback: cur.feedback.map((f) =>
        f.id === id
          ? {
              ...f,
              suggestion: f.suggestion + (lang === 'mn' ? ' Мөн үр дүнг тоон үзүүлэлтээр тодруулж, target role-ийн keyword-үүдтэй уялдуулах боломжтой.' : ' Also quantify results and align with target role keywords.'),
              status: 'pending' as const,
            }
          : f,
      ),
    }));
    setTemporaryToast(lang === 'mn' ? 'AI suggestion дахин үүсгэлээ.' : 'Suggestion regenerated.');
  };



  const exportImprovedCv = async () => {
    const content = analysis.rewrittenCv.trim();
    const baseFileName = safeFileName(analysis.candidateName || analysis.targetRole || 'improved-cv');

    if (!content) {
      setTemporaryToast(t('noImprovedCv', lang));
      return;
    }

    try {
      const headers: Record<string, string> = {'Content-Type': 'application/json'};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch('/api/career/export-pdf', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          result: {...analysis, rewrittenCv: content},
          language: lang,
          profileImage: profileImage || undefined,
        }),
      });
      if (!res.ok) throw new Error('PDF export failed');
      downloadBlob(await res.blob(), `${baseFileName}-improved-cv.pdf`);
      return;
    } catch {
      const {jsPDF} = await import('jspdf');
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(content, 180);
      doc.setFontSize(12);
      doc.text(lines, 15, 20);
      doc.save(`${baseFileName}-improved-cv.pdf`);
    }
  };

  if (authLoading || (user && !sessionReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-slate-400" size={36} />
      </div>
    );
  }

  // Auth views (login / register) — no sidebar
  if (activeView === 'login' || activeView === 'register') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white">
            <BrainCircuit size={24} />
          </div>
          <div>
            <p className="text-xl font-black">{copy.appName}</p>
            <p className="text-xs font-semibold text-slate-500">{copy.subtitle}</p>
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {activeView === 'login' ? (
            <LoginForm
              copy={copy}
              onLogin={handleLogin}
              onGoRegister={() => setActiveView('register')}
            />
          ) : (
            <RegisterForm
              copy={copy}
              onRegister={handleRegister}
              onGoLogin={() => setActiveView('login')}
            />
          )}
        </div>

        <button
          className="mt-6 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
          onClick={() => setLang((v) => (v === 'mn' ? 'en' : 'mn'))}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <Languages size={13} /> {lang === 'mn' ? 'English' : 'Монгол'}
          </span>
        </button>
      </div>
    );
  }

  // Main app (authenticated)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5 lg:py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                <BrainCircuit size={22} />
              </div>
              <div>
                <p className="text-lg font-black">{copy.appName}</p>
                <p className="text-xs font-semibold text-slate-500">{copy.subtitle}</p>
              </div>
            </div>

            {/* Language toggle */}
            <div className="flex items-center gap-2 lg:mt-4 lg:flex-col lg:items-stretch lg:gap-2">
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 lg:w-full"
                onClick={() => setLang((v) => (v === 'mn' ? 'en' : 'mn'))}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <Languages size={14} /> {lang === 'mn' ? 'English' : 'Монгол'}
                </span>
              </button>
              {/* Mobile logout – visible only on small screens */}
              <button
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-700 lg:hidden"
                onClick={handleLogout}
                type="button"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut size={14} /> {copy.logout}
                </span>
              </button>
            </div>
          </div>

          {user && (
            <div className="hidden px-5 pb-2 lg:block">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="size-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{user.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:px-5 lg:py-3">
            {navigation.map((item) => (
              <button
                key={item.id}
                className={`nav-button flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold lg:min-w-0 ${
                  activeView === item.id
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/10'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}
                onClick={() => navigateTo(item.id)}
                type="button"
              >
                <item.icon size={18} />
                {t(item.labelKey, lang)}
              </button>
            ))}
          </nav>

          <div className="hidden px-5 py-4 lg:block">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck size={18} />
                <p className="text-sm font-black">{t('privacyTitle', lang)}</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-900">
                {t('privacyDesc', lang)}
              </p>
            </div>
          </div>

          {/* Desktop logout – pinned to bottom of sidebar */}
          <div className="mt-auto hidden border-t border-slate-200 px-5 py-4 lg:block">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={18} />
              {copy.logout}
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-5">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">{copy.welcome}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{copy.welcomeDesc}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[340px]">
                  <MiniStat label={t('statOverall', lang)} value={overall ? `${overall}/100` : '--'} />
                  <MiniStat label={t('statRewrite', lang)} value={`${acceptedCount}/${analysis.feedback.length}`} />
                  <MiniStat label={t('statStatus', lang)} value={getStatusText(processingStatus, lang)} compact />
                </div>
                {user && (
                  <ProfileDropdown
                    user={user}
                    lang={lang}
                    profileImage={profileImage}
                    onLogout={handleLogout}
                    onNavigate={navigateTo}
                  />
                )}
              </div>
            </header>

            {toast && (
              <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl">
                {toast}
              </div>
            )}

            <div key={activeView} className="slow-view-enter">
              {activeView === 'overview' && (
                <OverviewView lang={lang} records={records} analysis={analysis} overall={overall} setActiveView={navigateTo} />
              )}
              {activeView === 'upload' && (
                <UploadView
                  lang={lang}
                  copy={copy}
                  selectedFile={selectedFile}
                  uploadError={uploadError}
                  rawText={rawText}
                  jobDescription={jobDescription}
                  isProcessing={isProcessing}
                  processingStatus={processingStatus}
                  fileInputRef={fileInputRef}
                  profileImageRef={profileImageRef}
                  profileImage={profileImage}
                  setRawText={setRawText}
                  setJobDescription={setJobDescription}
                  handleFile={handleFile}
                  handleProfileImage={handleProfileImage}
                  clearProfileImage={() => setProfileImage('')}
                  runAnalysis={runAnalysis}
                />
              )}
              {activeView === 'analysis' && <AnalysisView analysis={analysis} overall={overall} lang={lang} onReanalyze={() => navigateTo('upload')} onExport={() => navigateTo('rewrite')} />}
              {activeView === 'rewrite' && (
                <RewriteView
                  analysis={analysis}
                  lang={lang}
                  acceptFeedback={acceptFeedback}
                  rejectFeedback={rejectFeedback}
                  regenerateFeedback={regenerateFeedback}
                  onContinue={() => navigateTo('export')}
                />
              )}
              {activeView === 'interview' && <InterviewView analysis={analysis} lang={lang} />}
              {activeView === 'career' && <CareerView analysis={analysis} lang={lang} />}
              {activeView === 'export' && (
                <ExportView
                  analysis={analysis}
                  lang={lang}
                  profileImage={profileImage}
                  accountFullName={user?.fullName}
                  cvSessionKey={cvSessionKey}
                  exportOptimizedCv={() => exportImprovedCv()}
                />
              )}
              {activeView === 'history' && (
                <HistoryView
                  lang={lang}
                  records={records}
                  historyLoading={historyLoading}
                  onLoad={loadHistoryItem}
                  onUpload={() => navigateTo('upload')}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Auth Forms ───────────────────────────────────────────────────────────────

function LoginForm({copy, onLogin, onGoRegister}: {copy: AppCopy; onLogin: (e: string, p: string) => Promise<string | null>; onGoRegister: () => void}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await onLogin(email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-950">{copy.loginTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{copy.loginDesc}</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-slate-500">{copy.email}</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-slate-500">{copy.password}</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="password"
            required
            autoComplete="current-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>
      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
        type="submit"
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
        {copy.login}
      </button>
      <p className="text-center text-sm text-slate-500">
        {copy.noAccount}{' '}
        <button type="button" onClick={onGoRegister} className="font-black text-slate-950 hover:underline">
          {copy.register}
        </button>
      </p>
    </form>
  );
}

function RegisterForm({copy, onRegister, onGoLogin}: {copy: AppCopy; onRegister: (fn: string, e: string, p: string) => Promise<string | null>; onGoLogin: () => void}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const err = await onRegister(fullName, email, password);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-slate-950">{copy.registerTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">{copy.registerDesc}</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-slate-500">{copy.fullName}</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="text"
            required
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-slate-500">{copy.email}</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-black uppercase text-slate-500">{copy.password}</span>
          <input
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
      </div>
      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-50"
        type="submit"
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
        {copy.register}
      </button>
      <p className="text-center text-sm text-slate-500">
        {copy.hasAccount}{' '}
        <button type="button" onClick={onGoLogin} className="font-black text-slate-950 hover:underline">
          {copy.login}
        </button>
      </p>
    </form>
  );
}

// ─── Main Views ───────────────────────────────────────────────────────────────

function MiniStat({label, value, compact}: {label: string; value: string; compact?: boolean}) {
  return (
    <div className="hover-lift rounded-lg border border-slate-200 bg-white px-3 py-3">
      <p className="text-[10px] font-black uppercase text-slate-500">{label}</p>
      <p className={`${compact ? 'text-xs leading-5' : 'text-xl'} mt-1 font-black text-slate-950`}>{value}</p>
    </div>
  );
}

function OverviewView({lang, records, analysis, overall, setActiveView}: {lang: Language; records: CvRecord[]; analysis: AnalysisResult; overall: number; setActiveView: (v: ActiveView) => void}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ScoreCard icon={Gauge} label={t('overallScoreLabel', lang)} value={overall} helper={t('overallHelper', lang)} />
          <ScoreCard icon={FileCheck2} label="ATS Score" value={analysis.scores[0]?.value || 0} helper={t('atsHelper', lang)} />
          <ScoreCard icon={ClipboardCheck} label={t('grammarLabel', lang)} value={analysis.scores[4]?.value || 0} helper={t('grammarHelper', lang)} />
          <ScoreCard icon={BriefcaseBusiness} label={t('skillsMatchLabel', lang)} value={analysis.scores[2]?.value || 0} helper={t('skillsMatchHelper', lang)} />
        </div>

        <Panel title={t('recentCvs', lang)} icon={History}>
          {records.length === 0 ? (
            <p className="text-sm text-slate-500">{t('noCvs', lang)}</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {records.map((record) => (
                <div key={record.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">{record.fileName}</p>
                      <p className="text-xs font-medium text-slate-500">{record.fileType.toUpperCase()} / {record.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={record.status} lang={lang} />
                    <span className="rounded-md bg-slate-950 px-3 py-1 text-xs font-black text-white">{record.overall ? `${record.overall}/100` : '--'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={t('aiFeedbackTitle', lang)} icon={Sparkles}>
          <p className="text-sm leading-7 text-slate-700">{analysis.summary || t('aiFeedbackEmpty', lang)}</p>
          {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Checklist title={t('strengthsLabel', lang)} items={analysis.strengths} positive />
              <Checklist title={t('areasLabel', lang)} items={analysis.weaknesses} />
            </div>
          )}
        </Panel>
      </section>

      <aside className="space-y-5">
        <Panel title={t('quickActions', lang)} icon={ArrowRight}>
          <div className="space-y-2">
            {[
              {label: t('uploadNewCv', lang), view: 'upload' as ActiveView, icon: UploadCloud},
              {label: t('reviewRewrites', lang), view: 'rewrite' as ActiveView, icon: Sparkles},
              {label: t('prepareInterview', lang), view: 'interview' as ActiveView, icon: MessageSquareText},
              {label: t('downloadExport', lang), view: 'export' as ActiveView, icon: Download},
            ].map((action) => (
              <button
                key={action.label}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3 text-left text-sm font-black text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                onClick={() => setActiveView(action.view)}
                type="button"
              >
                <span className="inline-flex items-center gap-3"><action.icon size={18} /> {action.label}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={t('securityTitle', lang)} icon={LockKeyhole}>
          <div className="space-y-3 text-sm text-slate-700">
            {tArr('securityItems', lang).map((item) => (
              <div key={item} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={17} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function UploadView({lang, copy, selectedFile, uploadError, rawText, jobDescription, isProcessing, processingStatus, fileInputRef, profileImageRef, profileImage, setRawText, setJobDescription, handleFile, handleProfileImage, clearProfileImage, runAnalysis}: {
  lang: Language; copy: AppCopy; selectedFile: File | null; uploadError: string; rawText: string; jobDescription: string; isProcessing: boolean; processingStatus: CvStatus;
  fileInputRef: MutableRefObject<HTMLInputElement | null>; profileImageRef: MutableRefObject<HTMLInputElement | null>; profileImage: string;
  setRawText: (v: string) => void; setJobDescription: (v: string) => void; handleFile: (f: File) => void; handleProfileImage: (f: File) => void; clearProfileImage: () => void; runAnalysis: () => Promise<void>;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel title={copy.uploadTitle} icon={UploadCloud} subtitle={copy.uploadDesc}>
        <div
          className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-400 hover:bg-blue-50/40"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          <input ref={fileInputRef} className="hidden" type="file" accept=".pdf,application/pdf"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-slate-950 text-white">
            <UploadCloud size={28} />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-950">
            {selectedFile ? selectedFile.name : copy.dropFile}
          </h2>
          <p className="mt-2 text-sm text-slate-500">PDF / Max 10MB</p>
          <button className="mt-5 rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800"
            onClick={() => fileInputRef.current?.click()} type="button">{copy.chooseFile}</button>
          {uploadError && (
            <div className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              <AlertTriangle size={18} /> {uploadError}
            </div>
          )}
        </div>

        {/* Profile image upload */}
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-black uppercase text-slate-500">
            {t('profilePhotoLabel', lang)}
          </p>
          <div className="flex items-center gap-4">
            {profileImage ? (
              <img src={profileImage} alt="Profile preview" className="size-16 shrink-0 rounded-full border-2 border-slate-200 object-cover shadow-sm" />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400">
                <Camera size={24} />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={profileImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleProfileImage(f); }}
              />
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
                onClick={() => profileImageRef.current?.click()}
                type="button"
              >
                {t('choosePhoto', lang)}
              </button>
              {profileImage && (
                <button
                  className="text-sm font-bold text-rose-600 hover:underline"
                  onClick={clearProfileImage}
                  type="button"
                >
                  {t('removePhoto', lang)}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-500">{copy.rawText}</span>
            <textarea className="min-h-56 w-full rounded-lg border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={rawText} onChange={(e) => setRawText(e.target.value)}
              placeholder={t('pasteCvPlaceholder', lang)} />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-500">{copy.jobDesc}</span>
            <textarea className="min-h-56 w-full rounded-lg border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              placeholder={t('pasteJobPlaceholder', lang)} />
          </label>
        </div>

        <button
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg bg-blue-700 px-6 py-4 text-sm font-black text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isProcessing} onClick={runAnalysis} type="button">
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
          {isProcessing ? getStatusText(processingStatus, lang) : copy.analyze}
        </button>
      </Panel>

      <Panel title={t('processingStatus', lang)} icon={Gauge}>
        <div className="space-y-4">
          {(['uploaded', 'parsing', 'analyzing', 'completed'] as CvStatus[]).map((status) => (
            <div key={status} className="flex gap-3 rounded-lg p-2">
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-500 ${
                status === processingStatus || processingStatus === 'completed'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-400'}`}>
                {status === processingStatus && isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">{getStatusText(status, lang)}</p>
                <p className="text-xs leading-5 text-slate-500">
                  {status === 'uploaded' && t('stepUploadedDesc', lang)}
                  {status === 'parsing' && t('stepParsingDesc', lang)}
                  {status === 'analyzing' && t('stepAnalyzingDesc', lang)}
                  {status === 'completed' && t('stepCompletedDesc', lang)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ScoreGauge({value}: {value: number}) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(value / 100, 1) * circ;
  const color = value >= 75 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="136" height="136" viewBox="0 0 136 136">
      <circle cx="68" cy="68" r={r} fill="none" stroke="#e5e7eb" strokeWidth="13" />
      <circle cx="68" cy="68" r={r} fill="none" stroke={color} strokeWidth="13"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 68 68)" />
      <text x="68" y="63" textAnchor="middle" fontSize="30" fontWeight="900" fill="#0f172a">{value}</text>
      <text x="68" y="83" textAnchor="middle" fontSize="12" fill="#94a3b8">/ 100</text>
    </svg>
  );
}

function buildSectionScores(analysis: AnalysisResult, lang: Language) {
  const find = (key: string) => analysis.scores.find(s => s.key === key)?.value ?? 0;
  const hasContactIssue = analysis.weaknesses.some(w => /холбоо|contact|email|утас|phone/i.test(w));
  const hasEduIssue = analysis.weaknesses.some(w => /боловсрол|education|сургууль|degree/i.test(w));
  const sections = [
    {label: t('secContact', lang),    score: hasContactIssue ? 0 : 8},
    {label: t('secSummary', lang),    score: Math.round(find('readability') / 10)},
    {label: t('secExperience', lang), score: Math.round(find('experience') / 10)},
    {label: t('secEducation', lang),  score: hasEduIssue ? 3 : Math.round(find('readability') / 14)},
    {label: t('secSkills', lang),     score: Math.round(find('skillsMatch') / 10)},
  ];
  return sections.map(s => ({...s, max: 10, bad: s.score < 3}));
}

function AnalysisView({analysis, overall, lang, onReanalyze, onExport}: {
  analysis: AnalysisResult; overall: number; lang: Language;
  onReanalyze: () => void; onExport: () => void;
}) {
  const levelLabel = overall >= 75
    ? (lang === 'mn' ? 'Өндөр' : 'High')
    : overall >= 50
      ? (lang === 'mn' ? 'Дунд' : 'Medium')
      : (lang === 'mn' ? 'Бага' : 'Low');
  const levelColor = overall >= 75 ? 'bg-emerald-100 text-emerald-700' : overall >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
  const sections = buildSectionScores(analysis, lang);
  const standardMatch = sections.length > 0
    ? Math.round(sections.reduce((sum, s) => sum + s.score, 0) / (sections.length * 10) * 100)
    : 0;
  const missingItems = analysis.weaknesses.length ? analysis.weaknesses : analysis.keywords.missing;
  const recommendations = analysis.feedback.map(f => f.suggestion).filter(Boolean);

  return (
    <div className="w-full space-y-5">
      {/* Header label */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-indigo-600">{lang === 'mn' ? 'AI ШИНЖИЛГЭЭ' : 'AI ANALYSIS'}</p>
        <h2 className="mt-1 text-3xl font-black text-slate-950">{lang === 'mn' ? 'CV Анализ' : 'CV Analysis'}</h2>
        <p className="text-sm text-slate-500">{lang === 'mn' ? 'AI тусламжтайгаар CV загварыг сайжруул' : 'Improve your CV with AI assistance'}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <section className="space-y-5">
          {/* Score card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-5 md:flex-row md:items-start">
              <div className="shrink-0">
                <ScoreGauge value={overall} />
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-block rounded-full px-4 py-1 text-sm font-black ${levelColor}`}>{levelLabel}</span>
                  {standardMatch > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-black text-blue-700">
                      <FileCheck2 size={14} />
                      {lang === 'mn' ? `Стандарт CV тохирол: ${standardMatch}%` : `Standard CV match: ${standardMatch}%`}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-7 text-slate-700">{analysis.summary || (lang === 'mn' ? 'CV шинжилгээ хийгдлээ.' : 'CV analysis complete.')}</p>
              </div>
            </div>
          </div>

          {/* Strengths / Weaknesses */}
          {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="mb-3 flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 size={18} />
                  <p className="text-sm font-black">{lang === 'mn' ? 'Давуу талууд' : 'Strengths'}</p>
                </div>
                <ul className="space-y-2">
                  {analysis.strengths.slice(0, 5).map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="mb-3 flex items-center gap-2 text-amber-700">
                  <AlertTriangle size={18} />
                  <p className="text-sm font-black">{lang === 'mn' ? 'Сул талууд' : 'Weaknesses'}</p>
                </div>
                <ul className="space-y-2">
                  {analysis.weaknesses.slice(0, 5).map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-indigo-700">
                <Sparkles size={18} />
                <p className="text-sm font-black">{lang === 'mn' ? 'Зөвлөмжүүд' : 'Recommendations'}</p>
              </div>
              <ol className="grid gap-3 lg:grid-cols-2">
                {recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-indigo-900">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">{i + 1}</span>
                    {rec}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          {/* Missing sections */}
          {missingItems.length > 0 && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-rose-700">
                <AlertTriangle size={18} />
                <p className="text-sm font-black">{lang === 'mn' ? 'Дутуу хэсгүүд' : 'Missing sections'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {missingItems.slice(0, 8).map((item) => (
                  <span key={item} className="rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-bold text-rose-700">{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* Section scores */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-4 text-sm font-black text-slate-950">{lang === 'mn' ? 'Хэсэг бүрийн үнэлгээ' : 'Section scores'}</p>
            <div className="space-y-4">
              {sections.map(sec => (
                <div key={sec.label}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{sec.label}</span>
                    <div className="flex items-center gap-2">
                      {sec.bad && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-600">
                          {lang === 'mn' ? 'Дутуу' : 'Missing'}
                        </span>
                      )}
                      <span className="text-sm font-black text-slate-950">{sec.score}/{sec.max}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${sec.bad ? 'bg-rose-400' : sec.score < 6 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                      style={{width: `${(sec.score / sec.max) * 100}%`}}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{analysis.scores.find(s => {
                    if (sec.label.includes('Товч') || sec.label.includes('Summary')) return s.key === 'readability';
                    if (sec.label.includes('Ур') || sec.label.includes('Skill')) return s.key === 'skillsMatch';
                    if (sec.label.includes('Ажлын') || sec.label.includes('Work')) return s.key === 'experience';
                    return false;
                  })?.explanation ?? ''}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onReanalyze}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              type="button"
            >
              {lang === 'mn' ? 'Дахин анализ хийх' : 'Re-analyze'}
            </button>
            <button
              onClick={onExport}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white hover:bg-indigo-500"
              type="button"
            >
              {lang === 'mn' ? 'CV үүсгэх' : 'Build CV'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RewriteView({analysis, lang, acceptFeedback, rejectFeedback, regenerateFeedback, onContinue}: {
  analysis: AnalysisResult; lang: Language;
  acceptFeedback: (id: string) => void; rejectFeedback: (id: string) => void; regenerateFeedback: (id: string) => void;
  onContinue?: () => void;
}) {
  const allAccepted =
    analysis.feedback.length > 0 && analysis.feedback.every((f) => f.status === 'accepted');

  return (
    <div className="space-y-5">
      <Panel title={lang === 'mn' ? 'AI rewrite саналууд' : 'AI rewrite suggestions'} icon={Sparkles}>
        {analysis.feedback.length === 0 ? (
          <p className="text-sm text-slate-500">{lang === 'mn' ? 'Эхлээд CV upload хийж шинжилгээ хийлгэнэ үү.' : 'Upload and analyze a CV first.'}</p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {analysis.feedback.map((item) => (
              <FeedbackCard key={item.id} item={item} lang={lang}
                actions={
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-xs font-black uppercase text-white hover:bg-emerald-600 disabled:opacity-50"
                      disabled={item.status === 'accepted'} onClick={() => acceptFeedback(item.id)} type="button">
                      <Check size={15} /> {item.status === 'accepted' ? (lang === 'mn' ? 'Батлагдсан' : 'Accepted') : (lang === 'mn' ? 'Батлах' : 'Accept')}
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-xs font-black uppercase text-slate-700 hover:bg-slate-50"
                      onClick={() => regenerateFeedback(item.id)} type="button">
                      <RefreshCw size={15} /> {lang === 'mn' ? 'Дахин' : 'Regen'}
                    </button>
                    <button
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-3 text-xs font-black uppercase text-rose-700 hover:bg-rose-50"
                      onClick={() => rejectFeedback(item.id)} type="button">
                      <X size={15} /> {lang === 'mn' ? 'Татгалзах' : 'Reject'}
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </Panel>

      {onContinue && (
        <div className="flex justify-end">
          <button
            onClick={onContinue}
            className="flex items-center gap-3 rounded-xl bg-indigo-600 px-8 py-4 text-sm font-black text-white hover:bg-indigo-500 active:scale-[.98] transition-transform"
            type="button"
          >
            <Download size={18} />
            {lang === 'mn' ? 'CV татаж авах' : 'Download CV'}
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function InterviewView({analysis, lang}: {analysis: AnalysisResult; lang: Language}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <QuestionPanel title={lang === 'mn' ? 'Техникийн асуулт' : 'Technical'} icon={BrainCircuit} items={analysis.interview.technical} lang={lang} />
      <QuestionPanel title="HR" icon={UserRound} items={analysis.interview.hr} lang={lang} />
      <QuestionPanel title={lang === 'mn' ? 'Зан чанарын асуулт' : 'Behavioral'} icon={MessageSquareText} items={analysis.interview.behavioral} lang={lang} />
      <Panel title={lang === 'mn' ? 'Хариултын стратеги' : 'Answer strategy'} icon={BookOpenCheck}>
        <Checklist items={analysis.interview.suggestedAnswers} title="STAR" positive />
      </Panel>
    </div>
  );
}

function CareerView({analysis, lang}: {analysis: AnalysisResult; lang: Language}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Panel title={lang === 'mn' ? 'Карьерын зөвлөмж' : 'Career recommendation'} icon={GraduationCap}>
        <p className="text-xs font-black uppercase text-slate-500">{lang === 'mn' ? 'Одоогийн түвшин' : 'Current level'}</p>
        <p className="mt-2 text-2xl font-black text-slate-950">{analysis.career.currentLevel || '--'}</p>
        <p className="mt-5 text-xs font-black uppercase text-slate-500">{lang === 'mn' ? 'Тооцоолсон хугацаа' : 'Estimated duration'}</p>
        <p className="mt-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-black text-blue-800">{analysis.career.estimatedDuration || '--'}</p>
        <div className="mt-5">
          <Checklist title={lang === 'mn' ? 'Санал болгох ажлын байр' : 'Recommended roles'} items={analysis.career.recommendedRoles} positive />
        </div>
      </Panel>
      <div className="space-y-5">
        <Panel title={lang === 'mn' ? 'Дутуу skill' : 'Missing skills'} icon={Target}>
          <KeywordCloud items={analysis.career.missingSkills} tone="missing" />
        </Panel>
        <Panel title={lang === 'mn' ? '3-6 сарын roadmap' : '3-6 month roadmap'} icon={GraduationCap}>
          <div className="grid gap-3 md:grid-cols-2">
            {analysis.career.roadmap.map((step, i) => (
              <div key={step} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">{i + 1}</div>
                <p className="text-sm leading-6 text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ExportView({
  analysis,
  lang,
  profileImage,
  accountFullName,
  cvSessionKey,
  exportOptimizedCv,
}: {
  analysis: AnalysisResult;
  lang: Language;
  profileImage: string;
  accountFullName?: string;
  cvSessionKey: string;
  exportOptimizedCv: () => Promise<void>;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* CV Preview — shown ABOVE the download button */}
      <Panel title={lang === 'mn' ? 'Урьдчилан харах (Preview)' : 'Preview'} icon={FileCheck2}>
        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          {/* Navy sidebar + content layout mimicking the exported PDF */}
          <div className="flex min-h-[420px]">
            {/* Sidebar */}
            <div className="w-44 shrink-0 bg-slate-900 p-5 text-white">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-white/10 text-2xl font-black text-white">
                {(analysis.candidateName || 'C').charAt(0).toUpperCase()}
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{lang === 'mn' ? 'Мэргэжил' : 'Role'}</p>
              <p className="mt-1 text-sm font-bold text-slate-100 leading-5">{analysis.targetRole || '—'}</p>

              {analysis.keywords.recommended.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">{lang === 'mn' ? 'Ур чадвар' : 'Skills'}</p>
                  <div className="mt-2 space-y-1">
                    {analysis.keywords.recommended.slice(0, 6).map((kw) => (
                      <p key={kw} className="text-xs font-medium text-slate-300">{kw}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Main content */}
            <div className="flex-1 p-6">
              <p className="text-xl font-black text-slate-950">{analysis.candidateName || (lang === 'mn' ? 'Нэр' : 'Name')}</p>

              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600">{lang === 'mn' ? 'Мэргэжлийн хураангуй' : 'Professional Summary'}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{analysis.summary || (lang === 'mn' ? 'CV шинжилгээний дараа гарна.' : 'Run analysis to see preview.')}</p>

              {analysis.rewrittenCv.trim() && (
                <>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-blue-600">{lang === 'mn' ? 'Сайжруулсан CV' : 'Rewritten CV'}</p>
                  <pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-700 line-clamp-6">{analysis.rewrittenCv.slice(0, 400)}{analysis.rewrittenCv.length > 400 ? '…' : ''}</pre>
                </>
              )}

              {analysis.strengths.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{lang === 'mn' ? 'Давуу тал' : 'Strengths'}</p>
                  <div className="mt-1 space-y-0.5">
                    {analysis.strengths.slice(0, 3).map((s) => (
                      <p key={s} className="text-xs text-slate-600">• {s}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400 text-center">{lang === 'mn' ? 'Энэ бол PDF-ийн хялбаршуулсан урьдчилан харалт юм.' : 'This is a simplified preview of the exported PDF.'}</p>
      </Panel>

      {/* Download button — BELOW the preview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <button
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 px-6 py-4 text-base font-black text-white hover:bg-indigo-500 active:scale-[.98] transition-transform"
          onClick={() => exportOptimizedCv()}
          type="button"
        >
          <Download size={20} /> {lang === 'mn' ? 'PDF татаж авах' : 'Download PDF'}
        </button>
        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
          {lang === 'mn'
            ? 'PDF нь professional хоёр баганат загвараар үүснэ. Профайл зураг оруулсан бол PDF-д харагдана.'
            : 'PDF is generated as a professional two-column layout. Your profile photo will appear if uploaded.'}
        </p>
      </div>
    </div>
  );
}

function HistoryView({lang, records, historyLoading, onLoad, onUpload}: {
  lang: Language;
  records: CvRecord[];
  historyLoading: string;
  onLoad: (cvId: string) => void;
  onUpload: () => void;
}) {
  return (
    <Panel title={lang === 'mn' ? 'CV шинжилгээний түүх' : 'CV Analysis History'} icon={History}>
      {records.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <History size={32} />
          </div>
          <p className="text-sm font-bold text-slate-500">
            {lang === 'mn' ? 'Одоохондоо CV шинжилгээний түүх байхгүй байна.' : 'No CV analysis history yet.'}
          </p>
          <button
            onClick={onUpload}
            className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800"
            type="button"
          >
            {lang === 'mn' ? 'CV upload хийх' : 'Upload a CV'}
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {records.map((record) => (
            <div key={record.id} className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <FileText size={22} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{record.fileName}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {record.fileType.toUpperCase()} &nbsp;·&nbsp; {record.uploadedAt}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all"
                      style={{width: `${record.overall}%`}}
                    />
                  </div>
                  <span className="min-w-[3rem] rounded-md bg-slate-950 px-2.5 py-1 text-center text-xs font-black text-white">
                    {record.overall}/100
                  </span>
                </div>
                <StatusPill status={record.status} lang={lang} />
                <button
                  onClick={() => onLoad(record.id)}
                  disabled={historyLoading === record.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  type="button"
                >
                  {historyLoading === record.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <BarChart3 size={14} />}
                  {lang === 'mn' ? 'Харах' : 'View'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function Panel({title, subtitle, icon: Icon, children}: {title: string; subtitle?: string; icon: LucideIcon; children: ReactNode}) {
  return (
    <section className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
          <Icon size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function ScoreCard({icon: Icon, label, value, helper}: {icon: LucideIcon; label: string; value: number; helper: string}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <Icon size={22} />
        </div>
      </div>
      <div className="mt-4 h-2 rounded bg-slate-100">
        <div className="h-2 rounded bg-blue-700 transition-all duration-700" style={{width: `${value}%`}} />
      </div>
      <p className="mt-3 text-xs font-semibold text-slate-500">{helper}</p>
    </article>
  );
}


function Checklist({title, items, positive}: {title?: string; items: string[]; positive?: boolean}) {
  return (
    <div>
      {title && <p className="mb-3 text-xs font-black uppercase text-slate-500">{title}</p>}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            {positive ? <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} /> : <AlertTriangle className="mt-0.5 shrink-0 text-amber-600" size={18} />}
            <p className="text-sm leading-6 text-slate-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({status, lang}: {status: CvStatus; lang: Language}) {
  const isDone = status === 'completed';
  const isWorking = status === 'parsing' || status === 'analyzing';
  return (
    <span className={`rounded-md px-3 py-1 text-xs font-black ${isDone ? 'bg-emerald-50 text-emerald-700' : isWorking ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
      {getStatusText(status, lang)}
    </span>
  );
}

function FeedbackCard({
  item,
  lang,
  actions,
  compact,
  showExplanation = true,
}: {
  item: Feedback;
  lang: Language;
  actions?: ReactNode;
  compact?: boolean;
  showExplanation?: boolean;
}) {
  const showNote =
    showExplanation && !compact && item.explanation.trim() && !isGenericFeedbackExplanation(item.explanation);

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase text-slate-600">
          {feedbackTypeLabel(item.type, lang)}
        </span>
        <span className={`rounded-md border px-3 py-1 text-xs font-black uppercase ${severityClass(item.severity)}`}>{severityLabel(item.severity, lang)}</span>
      </div>
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-500">{lang === 'mn' ? 'Өмнөх' : 'Before'}</p>
          <p className="mt-2 rounded-lg bg-rose-50 p-4 text-sm leading-6 text-rose-800">{item.original}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-slate-500">{lang === 'mn' ? 'Сайжруулсан' : 'After'}</p>
          <p className="mt-2 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{item.suggestion}</p>
        </div>
        {showNote ? <p className="text-xs leading-5 text-slate-500">{item.explanation}</p> : null}
      </div>
      {actions}
    </article>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────

function ProfileDropdown({user, lang, profileImage, onLogout, onNavigate}: {
  user: AuthUser;
  lang: Language;
  profileImage: string;
  onLogout: () => void;
  onNavigate: (view: ActiveView) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const menuItems: Array<{label: string; labelMn: string; icon: typeof User; view?: ActiveView}> = [
    {label: 'Profile', labelMn: 'Профайл', icon: User, view: 'overview'},
    {label: 'Settings', labelMn: 'Тохиргоо', icon: Settings},
    {label: 'My CVs', labelMn: 'Миний CV-үүд', icon: FileText, view: 'history' as ActiveView},
    {label: 'Saved Jobs', labelMn: 'Хадгалсан ажлууд', icon: BookmarkCheck},
  ];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none"
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {profileImage ? (
          <img src={profileImage} alt="Avatar" className="size-8 rounded-full object-cover" />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-sm font-black text-white">
            {user.fullName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="hidden max-w-30 truncate text-sm font-bold text-slate-700 sm:block">
          {user.fullName}
        </span>
        <ChevronDown
          size={14}
          className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* User info header */}
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-black text-slate-950">{user.fullName}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map(({label, labelMn, icon: Icon, view}) => (
              <button
                key={label}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                onClick={() => { setOpen(false); if (view) onNavigate(view); }}
                type="button"
              >
                <Icon size={16} className="shrink-0 text-slate-400" />
                {lang === 'mn' ? labelMn : label}
              </button>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-slate-100 py-1">
            <button
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50"
              onClick={() => { setOpen(false); onLogout(); }}
              type="button"
            >
              <LogOut size={16} className="shrink-0" />
              {lang === 'mn' ? 'Гарах' : 'Log out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KeywordCloud({items, tone}: {items: string[]; tone: 'missing' | 'recommended'}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`rounded-md border px-3 py-2 text-sm font-bold ${tone === 'missing' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function QuestionPanel({title, icon, items, lang}: {title: string; icon: LucideIcon; items: string[]; lang: Language}) {
  return (
    <Panel title={title} icon={icon}>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{lang === 'mn' ? 'CV шинжилгээний дараа асуултууд гарна.' : 'Questions will appear after CV analysis.'}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item} className="flex gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">{i + 1}</div>
              <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
