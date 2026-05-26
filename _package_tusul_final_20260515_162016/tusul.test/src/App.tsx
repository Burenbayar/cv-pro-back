import {useEffect, useMemo, useRef, useState} from 'react';
import type {MutableRefObject, ReactNode} from 'react';
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
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';

type Language = 'mn' | 'en';
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
  appName: string;
  subtitle: string;
  welcome: string;
  welcomeDesc: string;
  uploadTitle: string;
  uploadDesc: string;
  analyze: string;
  jobDesc: string;
  rawText: string;
  export: string;
  login: string;
  register: string;
  logout: string;
  email: string;
  password: string;
  fullName: string;
  loginTitle: string;
  loginDesc: string;
  registerTitle: string;
  registerDesc: string;
  noAccount: string;
  hasAccount: string;
  authError: string;
  chooseFile: string;
  dropFile: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const PROTECTED_VIEWS: ActiveView[] = ['overview', 'upload', 'analysis', 'rewrite', 'interview', 'career', 'export', 'history'];

const navigation: Array<{id: ActiveView; labelMn: string; labelEn: string; icon: LucideIcon}> = [
  {id: 'overview', labelMn: 'Нүүр', labelEn: 'Overview', icon: LayoutDashboard},
  {id: 'upload', labelMn: 'CV Upload', labelEn: 'CV Upload', icon: UploadCloud},
  {id: 'analysis', labelMn: 'Шинжилгээ', labelEn: 'Analysis', icon: BarChart3},
  {id: 'rewrite', labelMn: 'Rewrite', labelEn: 'Rewrite', icon: Sparkles},
  {id: 'interview', labelMn: 'Interview', labelEn: 'Interview', icon: MessageSquareText},
  {id: 'career', labelMn: 'Карьер', labelEn: 'Career', icon: Target},
  {id: 'export', labelMn: 'Export', labelEn: 'Export', icon: Download},
  {id: 'history', labelMn: 'Түүх', labelEn: 'History', icon: History},
];

const defaultAnalysis: AnalysisResult = {
  candidateName: '',
  targetRole: '',
  rewrittenCv: '',
  scores: [
    {key: 'atsScore', label: 'ATS оноо', value: 0, explanation: '', confidence: 0},
    {key: 'readability', label: 'Уншигдах байдал', value: 0, explanation: '', confidence: 0},
    {key: 'skillsMatch', label: 'Skill match', value: 0, explanation: '', confidence: 0},
    {key: 'experience', label: 'Туршлага', value: 0, explanation: '', confidence: 0},
    {key: 'grammar', label: 'Grammar', value: 0, explanation: '', confidence: 0},
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

function getCopy(lang: Language): AppCopy {
  if (lang === 'en') {
    return {
      appName: 'CV AI Pro',
      subtitle: 'AI-powered CV improvement platform',
      welcome: 'CV performance dashboard',
      welcomeDesc: 'Upload a CV, check ATS fit, review rewrite suggestions, prepare for interviews, plan a career path and export an optimized draft.',
      uploadTitle: 'CV upload and analysis',
      uploadDesc: 'PDF/DOCX up to 10MB. CV text is treated only as untrusted analysis input.',
      analyze: 'Start analysis',
      jobDesc: 'Target job description',
      rawText: 'Extracted or pasted CV text',
      export: 'Export',
      login: 'Log in',
      register: 'Create account',
      logout: 'Log out',
      email: 'Email address',
      password: 'Password',
      fullName: 'Full name',
      loginTitle: 'Welcome back',
      loginDesc: 'Sign in to access your CV analysis dashboard.',
      registerTitle: 'Create your account',
      registerDesc: 'Start improving your CV with AI-powered analysis.',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      authError: 'Incorrect email or password.',
      chooseFile: 'Choose file',
      dropFile: 'Drop or choose your file',
    };
  }
  return {
    appName: 'CV AI Pro',
    subtitle: 'AI-д суурилсан CV сайжруулах систем',
    welcome: 'CV performance dashboard',
    welcomeDesc: 'CV upload, ATS оноо, rewrite suggestion, interview бэлтгэл, career roadmap, export flow бүгд нэг дор.',
    uploadTitle: 'CV upload болон шинжилгээ',
    uploadDesc: 'PDF/DOCX файл 10MB хүртэл. CV текстийг зөвхөн шинжилгээний input гэж үзнэ.',
    analyze: 'Шинжилгээ эхлүүлэх',
    jobDesc: 'Зорилтот ажлын байрны тайлбар',
    rawText: 'CV-ийн текст',
    export: 'Export хийх',
    login: 'Нэвтрэх',
    register: 'Бүртгүүлэх',
    logout: 'Гарах',
    email: 'И-мэйл хаяг',
    password: 'Нууц үг',
    fullName: 'Овог нэр',
    loginTitle: 'Тавтай морил',
    loginDesc: 'CV шинжилгээний dashboard руу нэвтрэнэ үү.',
    registerTitle: 'Бүртгэл үүсгэх',
    registerDesc: 'AI-д суурилсан CV шинжилгээгээр карьераа хөгжүүл.',
    noAccount: 'Бүртгэл байхгүй юу?',
    hasAccount: 'Бүртгэлтэй юу?',
    authError: 'И-мэйл эсвэл нууц үг буруу байна.',
    chooseFile: 'Файл сонгох',
    dropFile: 'Файлаа энд чирж оруулах эсвэл сонгох',
  };
}

function getStatusText(status: CvStatus, lang: Language) {
  const values: Record<CvStatus, {mn: string; en: string}> = {
    uploaded: {mn: 'Upload хийгдсэн', en: 'Uploaded'},
    parsing: {mn: 'CV уншиж байна', en: 'Parsing CV'},
    analyzing: {mn: 'AI шинжилгээ хийж байна', en: 'Analyzing'},
    completed: {mn: 'Дууссан', en: 'Completed'},
    failed: {mn: 'Алдаа гарсан', en: 'Failed'},
  };
  return values[status][lang];
}

function severityClass(severity: Severity) {
  if (severity === 'high') return 'border-rose-300 bg-rose-50 text-rose-700';
  if (severity === 'medium') return 'border-amber-300 bg-amber-50 text-amber-700';
  return 'border-emerald-300 bg-emerald-50 text-emerald-700';
}

function severityLabel(severity: Severity, lang: Language) {
  const labels: Record<Severity, {mn: string; en: string}> = {
    high: {mn: 'Өндөр', en: 'High'},
    medium: {mn: 'Дунд', en: 'Medium'},
    low: {mn: 'Бага', en: 'Low'},
  };
  return labels[severity][lang];
}

function buildFileType(file: File): 'pdf' | 'docx' | null {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) return 'docx';
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

  return {
    candidateName: data.candidateName || data.fullName || '',
    targetRole: data.targetRole || data.jobTitle || '',
    rewrittenCv: data.rewrittenCv || data.improvedCv || data.improved_cv || '',
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

function normalizeDbAnalysis(record: any): {analysis: AnalysisResult; cvId: string} | null {
  if (!record?.analysis) return null;
  const a = record.analysis;
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
  return {
    cvId: record.id,
    analysis: {
      candidateName: '',
      targetRole: record.jobDescription || '',
      rewrittenCv: '',
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
  setRecords: (r: CvRecord[]) => void,
  setAnalysis: (a: AnalysisResult) => void,
  setCurrentCvId: (id: string) => void,
) {
  try {
    const histRes = await fetch('/api/career/history', {
      headers: {Authorization: `Bearer ${authToken}`},
    });
    if (!histRes.ok) return;
    const {history} = await histRes.json();
    if (!Array.isArray(history) || history.length === 0) return;

    setRecords(
      history.map((h: any) => ({
        id: h.id,
        fileName: h.fileName,
        fileType: h.fileType,
        uploadedAt: (h.uploadedAt || '').slice(0, 10),
        status: h.status as CvStatus,
        overall: h.overall || 0,
      })),
    );

    // Load the most recent analysis
    const latest = history[0];
    const detailRes = await fetch(`/api/career/analysis/${latest.id}`, {
      headers: {Authorization: `Bearer ${authToken}`},
    });
    if (!detailRes.ok) return;
    const {record} = await detailRes.json();
    const normalized = normalizeDbAnalysis(record);
    if (normalized) {
      setAnalysis(normalized.analysis);
      setCurrentCvId(normalized.cvId);
    }
  } catch {
    // network errors ignored — state stays at defaults
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>('mn');
  const [activeView, setActiveView] = useState<ActiveView>('login');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);

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

  const copy = getCopy(lang);
  const overall = useMemo(() => calculateOverall(analysis.scores), [analysis]);
  const acceptedCount = analysis.feedback.filter((f) => f.status === 'accepted').length;

  // On mount: restore session
  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      setAuthLoading(false);
      setActiveView('login');
      return;
    }
    fetch('/api/auth/me', {headers: {Authorization: `Bearer ${stored.token}`}})
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setToken(stored.token);
          setLang((data.user.preferredLanguage as Language) || 'mn');
          setActiveView('overview');
          fetchAndApplyHistory(stored.token, setRecords, setAnalysis, setCurrentCvId);
        } else {
          clearAuth();
          setActiveView('login');
        }
      })
      .catch(() => {
        clearAuth();
        setActiveView('login');
      })
      .finally(() => setAuthLoading(false));
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
      setLang((data.user.preferredLanguage as Language) || 'mn');
      setActiveView('overview');
      fetchAndApplyHistory(data.token, setRecords, setAnalysis, setCurrentCvId);
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
      setLang((data.user.preferredLanguage as Language) || 'mn');
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
      const normalized = normalizeDbAnalysis(record);
      if (normalized) {
        setAnalysis(normalized.analysis);
        setCurrentCvId(normalized.cvId);
        setActiveView('analysis');
        setTemporaryToast(lang === 'mn' ? 'Шинжилгээ ачааллагдлаа.' : 'Analysis loaded.');
      }
    } catch {
      setTemporaryToast(lang === 'mn' ? 'Ачааллахад алдаа гарлаа.' : 'Failed to load analysis.');
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

  const handleFile = (file: File) => {
    setUploadError('');
    const fileType = buildFileType(file);
    if (!fileType) {
      setUploadError(lang === 'mn' ? 'Зөвхөн PDF болон DOCX файл upload хийнэ үү.' : 'Only PDF and DOCX files are allowed.');
      setSelectedFile(null);
      return;
    }
    if (file.size <= 0) {
      setUploadError(lang === 'mn' ? 'Хоосон файл байна.' : 'The selected file is empty.');
      setSelectedFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(lang === 'mn' ? 'Файлын хэмжээ 10MB-аас их байна.' : 'File size must be under 10MB.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const runAnalysis = async () => {
    if (!selectedFile && !rawText.trim()) {
      setUploadError(lang === 'mn' ? 'CV файл эсвэл CV текст оруулна уу.' : 'Upload a CV file or paste CV text.');
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

      if (!res.ok || payload.success === false) throw new Error(payload?.error?.message || 'Analysis failed');

      const normalized = normalizeApiAnalysis(payload, lang);
      if (normalized) {
        setAnalysis(normalized);
        const hasInterviewPrep = normalized.interview.technical.length > 0 ||
          normalized.interview.hr.length > 0 ||
          normalized.interview.behavioral.length > 0 ||
          normalized.interview.suggestedAnswers.length > 0;
        nextView = hasInterviewPrep ? 'interview' : 'analysis';
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
        setRecords((prev) => [newRecord, ...prev]);
      }
    } catch {
      setTemporaryToast(lang === 'mn' ? 'Серверт холбогдож чадсангүй.' : 'Could not connect to server.');
    }

    setProcessingStatus('completed');
    setIsProcessing(false);
    setActiveView(nextView);
    setTemporaryToast(lang === 'mn' ? 'AI шинжилгээ амжилттай дууслаа.' : 'AI analysis completed.');
  };

  const acceptFeedback = async (id: string) => {
    if (token && currentCvId) {
      await fetch(`/api/career/suggestions/${id}/approve`, {
        method: 'POST',
        headers: {Authorization: `Bearer ${token}`},
      }).catch(() => {});
    }
    setAnalysis((cur) => ({
      ...cur,
      feedback: cur.feedback.map((f) => (f.id === id ? {...f, status: 'accepted' as const} : f)),
    }));
    setTemporaryToast(lang === 'mn' ? 'Rewrite шинэ CV draft-д нэмэгдлээ.' : 'Rewrite accepted into the CV draft.');
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
    setTemporaryToast(lang === 'mn' ? 'Санал татгалзагдлаа.' : 'Suggestion rejected.');
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
          setTemporaryToast(lang === 'mn' ? 'AI suggestion дахин үүсгэлээ.' : 'Suggestion regenerated.');
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
      setTemporaryToast(lang === 'mn' ? 'Татах сайжруулсан CV одоогоор алга байна.' : 'No improved CV is available to download yet.');
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

  if (authLoading) {
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
                {lang === 'mn' ? item.labelMn : item.labelEn}
              </button>
            ))}
          </nav>

          <div className="hidden px-5 py-4 lg:block">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck size={18} />
                <p className="text-sm font-black">Privacy guard</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-900">
                {lang === 'mn'
                  ? 'CV personal data, raw CV text, AI prompt/output console log хийхгүй байх зарчимтай.'
                  : 'No CV personal data, raw text, AI prompt or output should be logged.'}
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
                  <MiniStat label="Overall" value={overall ? `${overall}/100` : '--'} />
                  <MiniStat label="Rewrite" value={`${acceptedCount}/${analysis.feedback.length}`} />
                  <MiniStat label="Status" value={getStatusText(processingStatus, lang)} compact />
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
              {activeView === 'analysis' && <AnalysisView analysis={analysis} overall={overall} lang={lang} />}
              {activeView === 'rewrite' && (
                <RewriteView
                  analysis={analysis}
                  lang={lang}
                  acceptFeedback={acceptFeedback}
                  rejectFeedback={rejectFeedback}
                  regenerateFeedback={regenerateFeedback}
                />
              )}
              {activeView === 'interview' && <InterviewView analysis={analysis} lang={lang} />}
              {activeView === 'career' && <CareerView analysis={analysis} lang={lang} />}
              {activeView === 'export' && <ExportView analysis={analysis} lang={lang} exportOptimizedCv={() => exportImprovedCv()} />}
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
          <ScoreCard icon={Gauge} label={lang === 'mn' ? 'Нийт оноо' : 'Overall Score'} value={overall} helper={lang === 'mn' ? '5 метрикийн дундаж' : '5 metric average'} />
          <ScoreCard icon={FileCheck2} label="ATS Score" value={analysis.scores[0]?.value || 0} helper={lang === 'mn' ? 'Keyword & бүтэц' : 'Keyword & structure'} />
          <ScoreCard icon={ClipboardCheck} label="Grammar" value={analysis.scores[4]?.value || 0} helper={lang === 'mn' ? 'Tone & алдаа' : 'Tone & spelling'} />
          <ScoreCard icon={BriefcaseBusiness} label={lang === 'mn' ? 'Skill тохирол' : 'Skills Match'} value={analysis.scores[2]?.value || 0} helper={lang === 'mn' ? 'Зорилтот ажилд тохирол' : 'Target role fit'} />
        </div>

        <Panel title={lang === 'mn' ? 'Сүүлийн CV файлууд' : 'Recent CVs'} icon={History}>
          {records.length === 0 ? (
            <p className="text-sm text-slate-500">{lang === 'mn' ? 'Одоохондоо CV байхгүй байна. Upload хийнэ үү.' : 'No CVs yet. Upload one to get started.'}</p>
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

        <Panel title={lang === 'mn' ? 'AI feedback хураангуй' : 'AI feedback summary'} icon={Sparkles}>
          <p className="text-sm leading-7 text-slate-700">{analysis.summary || (lang === 'mn' ? 'CV upload хийснийхээ дараа шинжилгээ гарна.' : 'Analysis will appear after you upload a CV.')}</p>
          {(analysis.strengths.length > 0 || analysis.weaknesses.length > 0) && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Checklist title={lang === 'mn' ? 'Давуу тал' : 'Strengths'} items={analysis.strengths} positive />
              <Checklist title={lang === 'mn' ? 'Сайжруулах хэсэг' : 'Areas to improve'} items={analysis.weaknesses} />
            </div>
          )}
        </Panel>
      </section>

      <aside className="space-y-5">
        <Panel title={lang === 'mn' ? 'Хурдан үйлдлүүд' : 'Quick Actions'} icon={ArrowRight}>
          <div className="space-y-2">
            {[
              {label: lang === 'mn' ? 'Шинэ CV upload хийх' : 'Upload new CV', view: 'upload' as ActiveView, icon: UploadCloud},
              {label: lang === 'mn' ? 'Rewrite санал харах' : 'Review rewrites', view: 'rewrite' as ActiveView, icon: Sparkles},
              {label: lang === 'mn' ? 'Interview бэлтгэх' : 'Prepare interview', view: 'interview' as ActiveView, icon: MessageSquareText},
              {label: lang === 'mn' ? 'Export татах' : 'Download export', view: 'export' as ActiveView, icon: Download},
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

        <Panel title={lang === 'mn' ? 'Аюулгүй байдлын шалгуур' : 'Security checklist'} icon={LockKeyhole}>
          <div className="space-y-3 text-sm text-slate-700">
            {(lang === 'mn'
              ? ['OpenAI API key frontend дээр байхгүй', 'Prompt injection guardrail server prompt-д байна', 'Sensitive CV data console log хийхгүй', 'JWT токен нь LocalStorage-д хадгалагдана']
              : ['OpenAI API key is not exposed on frontend', 'Prompt injection guardrails in server prompt', 'Sensitive CV data is not console logged', 'JWT token stored in localStorage']
            ).map((item) => (
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
          <input ref={fileInputRef} className="hidden" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div className="mx-auto flex size-14 items-center justify-center rounded-lg bg-slate-950 text-white">
            <UploadCloud size={28} />
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-950">
            {selectedFile ? selectedFile.name : copy.dropFile}
          </h2>
          <p className="mt-2 text-sm text-slate-500">PDF / DOCX / Max 10MB</p>
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
            {lang === 'mn' ? 'Профайл зураг (заавал биш — PDF-д харагдана)' : 'Profile photo (optional — appears in exported PDF)'}
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
                {lang === 'mn' ? 'Зураг сонгох' : 'Choose photo'}
              </button>
              {profileImage && (
                <button
                  className="text-sm font-bold text-rose-600 hover:underline"
                  onClick={clearProfileImage}
                  type="button"
                >
                  {lang === 'mn' ? 'Арилгах' : 'Remove'}
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
              placeholder={lang === 'mn' ? 'CV текстийг энд буулгана уу...' : 'Paste CV text here...'} />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-500">{copy.jobDesc}</span>
            <textarea className="min-h-56 w-full rounded-lg border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
              placeholder={lang === 'mn' ? 'Зорилтот ажлын байрны шаардлагыг буулгана уу...' : 'Paste target job description to optimize keywords...'} />
          </label>
        </div>

        <button
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-lg bg-blue-700 px-6 py-4 text-sm font-black text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isProcessing} onClick={runAnalysis} type="button">
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
          {isProcessing ? getStatusText(processingStatus, lang) : copy.analyze}
        </button>
      </Panel>

      <Panel title={lang === 'mn' ? 'Боловсруулалтын явц' : 'Processing status'} icon={Gauge}>
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
                  {status === 'uploaded' && (lang === 'mn' ? 'Файл шалгах, хэмжээ/төрөл баталгаажуулах' : 'File validation, size/type check')}
                  {status === 'parsing' && (lang === 'mn' ? 'Текст болон бүтэцтэй JSON гаргах' : 'Raw text + structured JSON extraction')}
                  {status === 'analyzing' && (lang === 'mn' ? 'AI шинжилгээ болон schema баталгаажуулалт' : 'Stage-based AI scoring + schema validation')}
                  {status === 'completed' && (lang === 'mn' ? 'Dashboard, rewrite, interview, export бэлэн' : 'Dashboard, rewrite, interview, export ready')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AnalysisView({analysis, overall, lang}: {analysis: AnalysisResult; overall: number; lang: Language}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 xl:col-span-2">
          <p className="text-xs font-black uppercase text-blue-800">{lang === 'mn' ? 'Нийт CV оноо' : 'Overall CV Score'}</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-6xl font-black text-slate-950">{overall}</span>
            <span className="mb-2 text-lg font-black text-slate-500">/100</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{analysis.summary}</p>
        </div>
        {analysis.scores.map((metric) => <MetricTile key={metric.key} metric={metric} />)}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title={lang === 'mn' ? 'Дутуу keyword' : 'Missing keywords'} icon={Target}>
          <KeywordCloud items={analysis.keywords.missing} tone="missing" />
        </Panel>
        <Panel title={lang === 'mn' ? 'Санал болгох keyword' : 'Recommended keywords'} icon={Sparkles}>
          <KeywordCloud items={analysis.keywords.recommended} tone="recommended" />
        </Panel>
      </div>

      <Panel title={lang === 'mn' ? 'Recruiter feedback' : 'Recruiter-style feedback'} icon={UserRound}>
        <div className="grid gap-4 lg:grid-cols-3">
          {analysis.feedback.map((item) => <FeedbackCard key={item.id} item={item} lang={lang} compact />)}
        </div>
      </Panel>
    </div>
  );
}

function RewriteView({analysis, lang, acceptFeedback, rejectFeedback, regenerateFeedback}: {
  analysis: AnalysisResult; lang: Language;
  acceptFeedback: (id: string) => void; rejectFeedback: (id: string) => void; regenerateFeedback: (id: string) => void;
}) {
  return (
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

function ExportView({analysis, lang, exportOptimizedCv}: {analysis: AnalysisResult; lang: Language; exportOptimizedCv: () => Promise<void>}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel title={lang === 'mn' ? 'Сайжруулсан CV preview' : 'Optimized CV preview'} icon={FileCheck2}>
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-950">
          {analysis.rewrittenCv.trim() && (
            <pre className="mb-6 whitespace-pre-wrap rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-slate-800">{analysis.rewrittenCv}</pre>
          )}
          <p className="text-xs font-black uppercase text-blue-700">{lang === 'mn' ? 'Мэргэжлийн хураангуй' : 'Professional Summary'}</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">{analysis.summary || (lang === 'mn' ? 'CV шинжилгээ хийсний дараа гарна.' : 'Run analysis to see preview.')}</p>
          <p className="mt-6 text-xs font-black uppercase text-blue-700">{lang === 'mn' ? 'Гол ур чадварууд' : 'Core Skills'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.keywords.recommended.map((kw) => (
              <span key={kw} className="rounded-md bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{kw}</span>
            ))}
          </div>
          <p className="mt-6 text-xs font-black uppercase text-blue-700">{lang === 'mn' ? 'Туршлагын онцлох хэсгүүд' : 'Experience highlights'}</p>
          <div className="mt-3 space-y-3">
            {analysis.feedback.map((item) => (
              <p key={item.id} className="rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">{item.suggestion}</p>
            ))}
          </div>
        </div>
      </Panel>

      <Panel title={lang === 'mn' ? 'Татаж авах' : 'Download'} icon={Download}>
        <div className="space-y-3">
          <button
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-blue-700 px-5 py-4 text-sm font-black text-white hover:bg-blue-600 active:scale-[.98] transition-transform"
            onClick={() => exportOptimizedCv()}
            type="button"
          >
            <Download size={18} /> {lang === 'mn' ? 'PDF татах' : 'Download PDF'}
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {lang === 'mn'
            ? 'PDF нь professional хоёр баганат загвараар үүснэ. Профайл зураг оруулсан бол PDF-д харагдана.'
            : 'PDF is generated as a professional two-column resume. Your profile photo will appear in the PDF if uploaded.'}
        </p>
      </Panel>
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

function MetricTile({metric}: {metric: Metric}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-950">{metric.label}</p>
        <span className="rounded-md bg-slate-950 px-3 py-1 text-xs font-black text-white">{metric.value}/100</span>
      </div>
      <div className="mt-4 h-2 rounded bg-slate-100">
        <div className="h-2 rounded bg-emerald-600 transition-all duration-700" style={{width: `${metric.value}%`}} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{metric.explanation}</p>
      <p className="mt-3 text-xs font-bold text-slate-500">Confidence: {Math.round(metric.confidence * 100)}%</p>
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

function FeedbackCard({item, lang, actions, compact}: {item: Feedback; lang: Language; actions?: ReactNode; compact?: boolean}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase text-slate-600">{item.type}</span>
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
        {!compact && <p className="text-xs leading-5 text-slate-500">{item.explanation}</p>}
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
