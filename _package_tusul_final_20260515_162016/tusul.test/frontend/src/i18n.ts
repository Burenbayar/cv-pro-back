export type Language = 'mn' | 'en';

const T = {
  // App branding
  appName:           { mn: 'CV AI Pro',                                        en: 'CV AI Pro' },
  subtitle:          { mn: 'AI-д суурилсан CV сайжруулах систем',               en: 'AI-powered CV improvement platform' },

  // Navigation
  navOverview:  { mn: 'Нүүр',       en: 'Overview' },
  navUpload:    { mn: 'CV Upload',  en: 'CV Upload' },
  navAnalysis:  { mn: 'Шинжилгээ', en: 'Analysis' },
  navRewrite:   { mn: 'Rewrite',   en: 'Rewrite' },
  navInterview: { mn: 'Interview', en: 'Interview' },
  navCareer:    { mn: 'Карьер',    en: 'Career' },
  navExport:    { mn: 'Export',    en: 'Export' },
  navHistory:   { mn: 'Түүх',      en: 'History' },

  // Auth
  loginTitle:    { mn: 'Тавтай морил',                                en: 'Welcome back' },
  loginDesc:     { mn: 'CV шинжилгээний dashboard руу нэвтрэнэ үү.', en: 'Sign in to access your CV analysis dashboard.' },
  registerTitle: { mn: 'Бүртгэл үүсгэх',                             en: 'Create your account' },
  registerDesc:  { mn: 'AI-д суурилсан CV шинжилгээгээр карьераа хөгжүүл.', en: 'Start improving your CV with AI-powered analysis.' },
  login:         { mn: 'Нэвтрэх',    en: 'Log in' },
  register:      { mn: 'Бүртгүүлэх', en: 'Create account' },
  logout:        { mn: 'Гарах',      en: 'Log out' },
  email:         { mn: 'И-мэйл хаяг', en: 'Email address' },
  password:      { mn: 'Нууц үг',    en: 'Password' },
  fullName:      { mn: 'Овог нэр',   en: 'Full name' },
  noAccount:     { mn: 'Бүртгэл байхгүй юу?',   en: "Don't have an account?" },
  hasAccount:    { mn: 'Бүртгэлтэй юу?',         en: 'Already have an account?' },
  authError:     { mn: 'И-мэйл эсвэл нууц үг буруу байна.', en: 'Incorrect email or password.' },

  // Main header
  welcome:     { mn: 'CV performance dashboard', en: 'CV performance dashboard' },
  welcomeDesc: {
    mn: 'CV upload, ATS оноо, rewrite suggestion, interview бэлтгэл, career roadmap, export flow бүгд нэг дор.',
    en: 'Upload a CV, check ATS fit, review rewrite suggestions, prepare for interviews, plan a career path and export an optimized draft.',
  },
  statOverall: { mn: 'Нийт оноо', en: 'Overall' },
  statRewrite: { mn: 'Rewrite',   en: 'Rewrite' },
  statStatus:  { mn: 'Төлөв',    en: 'Status' },

  // Sidebar privacy / security
  privacyTitle: { mn: 'Нууцлалын хамгаалалт', en: 'Privacy guard' },
  privacyDesc: {
    mn: 'CV personal data, raw CV text, AI prompt/output console log хийхгүй байх зарчимтай.',
    en: 'No CV personal data, raw text, AI prompt or output should be logged.',
  },
  securityTitle: { mn: 'Аюулгүй байдлын шалгуур', en: 'Security checklist' },
  securityItems: {
    mn: [
      'OpenAI API key frontend дээр байхгүй',
      'Prompt injection guardrail server prompt-д байна',
      'Sensitive CV data console log хийхгүй',
      'JWT токен нь LocalStorage-д хадгалагдана',
    ],
    en: [
      'OpenAI API key is not exposed on frontend',
      'Prompt injection guardrails in server prompt',
      'Sensitive CV data is not console logged',
      'JWT token stored in localStorage',
    ],
  },

  // Overview
  overallScoreLabel: { mn: 'Нийт оноо',    en: 'Overall Score' },
  overallHelper:     { mn: '5 метрикийн дундаж', en: '5 metric average' },
  atsHelper:         { mn: 'Keyword & бүтэц',     en: 'Keyword & structure' },
  grammarLabel:      { mn: 'Хэлний алдаа',        en: 'Grammar' },
  grammarHelper:     { mn: 'Tone & алдаа',         en: 'Tone & spelling' },
  skillsMatchLabel:  { mn: 'Skill тохирол',        en: 'Skills Match' },
  skillsMatchHelper: { mn: 'Зорилтот ажилд тохирол', en: 'Target role fit' },
  recentCvs:         { mn: 'Сүүлийн CV файлууд',  en: 'Recent CVs' },
  noCvs:             { mn: 'Одоохондоо CV байхгүй байна. Upload хийнэ үү.', en: 'No CVs yet. Upload one to get started.' },
  aiFeedbackTitle:   { mn: 'AI feedback хураангуй', en: 'AI feedback summary' },
  aiFeedbackEmpty:   { mn: 'CV upload хийснийхээ дараа шинжилгээ гарна.', en: 'Analysis will appear after you upload a CV.' },
  strengthsLabel:    { mn: 'Давуу тал',       en: 'Strengths' },
  areasLabel:        { mn: 'Сайжруулах хэсэг', en: 'Areas to improve' },
  quickActions:      { mn: 'Хурдан үйлдлүүд', en: 'Quick Actions' },
  uploadNewCv:       { mn: 'Шинэ CV upload хийх', en: 'Upload new CV' },
  reviewRewrites:    { mn: 'Rewrite санал харах',  en: 'Review rewrites' },
  prepareInterview:  { mn: 'Interview бэлтгэх',    en: 'Prepare interview' },
  downloadExport:    { mn: 'Export татах',          en: 'Download export' },

  // Upload view
  uploadTitle:       { mn: 'CV upload болон шинжилгээ',       en: 'CV upload and analysis' },
  uploadDesc:        { mn: 'PDF файл 10MB хүртэл. CV текстийг зөвхөн шинжилгээний input гэж үзнэ.', en: 'PDF up to 10MB. CV text is treated only as untrusted analysis input.' },
  chooseFile:        { mn: 'Файл сонгох',  en: 'Choose file' },
  dropFile:          { mn: 'Файлаа энд чирж оруулах эсвэл сонгох', en: 'Drop or choose your file' },
  rawTextLabel:      { mn: 'CV-ийн текст', en: 'Extracted or pasted CV text' },
  jobDescLabel:      { mn: 'Зорилтот ажлын байрны тайлбар', en: 'Target job description' },
  analyze:           { mn: 'Шинжилгээ эхлүүлэх', en: 'Start analysis' },
  profilePhotoLabel: { mn: 'Профайл зураг (заавал биш — PDF-д харагдана)', en: 'Profile photo (optional — appears in exported PDF)' },
  choosePhoto:       { mn: 'Зураг сонгох', en: 'Choose photo' },
  removePhoto:       { mn: 'Арилгах',      en: 'Remove' },
  pasteCvPlaceholder:  { mn: 'CV текстийг энд буулгана уу...',                    en: 'Paste CV text here...' },
  pasteJobPlaceholder: { mn: 'Зорилтот ажлын байрны шаардлагыг буулгана уу...', en: 'Paste target job description to optimize keywords...' },
  processingStatus:  { mn: 'Боловсруулалтын явц', en: 'Processing status' },

  // Processing step descriptions
  stepUploadedDesc:   { mn: 'Файл шалгах, хэмжээ/төрөл баталгаажуулах',        en: 'File validation, size/type check' },
  stepParsingDesc:    { mn: 'Текст болон бүтэцтэй JSON гаргах',                  en: 'Raw text + structured JSON extraction' },
  stepAnalyzingDesc:  { mn: 'AI шинжилгээ болон schema баталгаажуулалт',        en: 'Stage-based AI scoring + schema validation' },
  stepCompletedDesc:  { mn: 'Dashboard, rewrite, interview, export бэлэн',      en: 'Dashboard, rewrite, interview, export ready' },

  // CvStatus labels
  statusUploaded:  { mn: 'Upload хийгдсэн',          en: 'Uploaded' },
  statusParsing:   { mn: 'CV уншиж байна',            en: 'Parsing CV' },
  statusAnalyzing: { mn: 'AI шинжилгээ хийж байна', en: 'Analyzing' },
  statusCompleted: { mn: 'Дууссан',                  en: 'Completed' },
  statusFailed:    { mn: 'Алдаа гарсан',             en: 'Failed' },

  // Validation messages
  onlyPdf:       { mn: 'Зөвхөн PDF файл upload хийнэ үү.',       en: 'Only PDF files are allowed.' },
  emptyFile:     { mn: 'Хоосон файл байна.',                      en: 'The selected file is empty.' },
  fileTooLarge:  { mn: 'Файлын хэмжээ 10MB-аас их байна.',        en: 'File size must be under 10MB.' },
  cvRequired:    { mn: 'CV файл эсвэл CV текст оруулна уу.',      en: 'Upload a CV file or paste CV text.' },
  loginRequired: { mn: 'Шинжилгээ хийхийн тулд эхлээд нэвтэрнэ үү.', en: 'Please log in to analyze your CV.' },
  sessionExpired: { mn: 'Нэвтрэлт хүчинтэй биш. Дахин нэвтэрнэ үү.', en: 'Session expired. Please log in again.' },
  serverError:   { mn: 'Серверт холбогдож чадсангүй.',            en: 'Could not connect to server.' },

  // Analysis view
  aiAnalysisTag:     { mn: 'AI ШИНЖИЛГЭЭ',              en: 'AI ANALYSIS' },
  cvAnalysisTitle:   { mn: 'CV Анализ',                  en: 'CV Analysis' },
  cvAnalysisSubtitle:{ mn: 'AI тусламжтайгаар CV загварыг сайжруул', en: 'Improve your CV with AI assistance' },
  standardMatch:     { mn: 'Стандарт CV тохирол',        en: 'Standard CV match' },
  cvAnalysisComplete:{ mn: 'CV шинжилгээ хийгдлээ.',     en: 'CV analysis complete.' },
  missingSections:   { mn: 'Дутуу хэсгүүд',              en: 'Missing sections' },
  analysisStrengths: { mn: 'Давуу талууд',               en: 'Strengths' },
  analysisWeaknesses:{ mn: 'Сул талууд',                 en: 'Weaknesses' },
  sectionScoresTitle:{ mn: 'Хэсэг бүрийн үнэлгээ',      en: 'Section scores' },
  missingBadge:      { mn: 'Дутуу',                      en: 'Missing' },
  recommendationsTitle: { mn: 'Зөвлөмжүүд',             en: 'Recommendations' },
  reanalyzeBtn:      { mn: 'Дахин анализ хийх',          en: 'Re-analyze' },
  buildCvBtn:        { mn: 'CV үүсгэх',                  en: 'Build CV' },
  levelHigh:         { mn: 'Өндөр', en: 'High' },
  levelMedium:       { mn: 'Дунд',  en: 'Medium' },
  levelLow:          { mn: 'Бага',  en: 'Low' },

  // Section score labels (used in buildSectionScores)
  secContact:    { mn: 'Холбоо барих',    en: 'Contact Info' },
  secSummary:    { mn: 'Товч танилцуулга', en: 'Summary' },
  secExperience: { mn: 'Ажлын туршлага', en: 'Work Experience' },
  secEducation:  { mn: 'Боловсрол',       en: 'Education' },
  secSkills:     { mn: 'Ур чадвар',       en: 'Skills' },

  // Rewrite view
  aiRewriteTitle:  { mn: 'AI rewrite саналууд',  en: 'AI rewrite suggestions' },
  uploadFirstMsg:  { mn: 'Эхлээд CV upload хийж шинжилгээ хийлгэнэ үү.', en: 'Upload and analyze a CV first.' },
  acceptedBtn:     { mn: 'Батлагдсан', en: 'Accepted' },
  acceptBtn:       { mn: 'Батлах',     en: 'Accept' },
  regenBtn:        { mn: 'Дахин',      en: 'Regen' },
  rejectBtn:       { mn: 'Татгалзах',  en: 'Reject' },
  downloadCvBtn:   { mn: 'CV татаж авах', en: 'Download CV' },

  // Interview view
  technicalTitle:  { mn: 'Техникийн асуулт',    en: 'Technical' },
  behavioralTitle: { mn: 'Зан чанарын асуулт',  en: 'Behavioral' },
  answerStrategy:  { mn: 'Хариултын стратеги',  en: 'Answer strategy' },
  noQuestions:     { mn: 'CV шинжилгээний дараа асуултууд гарна.', en: 'Questions will appear after CV analysis.' },

  // Career view
  careerRecTitle:      { mn: 'Карьерын зөвлөмж',     en: 'Career recommendation' },
  currentLevelLabel:   { mn: 'Одоогийн түвшин',       en: 'Current level' },
  estimatedDuration:   { mn: 'Тооцоолсон хугацаа',   en: 'Estimated duration' },
  recommendedRoles:    { mn: 'Санал болгох ажлын байр', en: 'Recommended roles' },
  missingSkillsTitle:  { mn: 'Дутуу skill',            en: 'Missing skills' },
  roadmapTitle:        { mn: '3-6 сарын roadmap',      en: '3-6 month roadmap' },

  // Export view
  previewPanelTitle:   { mn: 'Урьдчилан харах (Preview)', en: 'Preview' },
  previewRoleLabel:    { mn: 'Мэргэжил',                  en: 'Role' },
  previewSkillsLabel:  { mn: 'Ур чадвар',                 en: 'Skills' },
  previewNameFallback: { mn: 'Нэр',                       en: 'Name' },
  previewSummaryTitle: { mn: 'Мэргэжлийн хураангуй',      en: 'Professional Summary' },
  previewSummaryFallback: { mn: 'CV шинжилгээний дараа гарна.', en: 'Run analysis to see preview.' },
  previewRewrittenTitle:  { mn: 'Сайжруулсан CV',         en: 'Rewritten CV' },
  previewStrengthsTitle:  { mn: 'Давуу тал',              en: 'Strengths' },
  previewNote:            { mn: 'Энэ бол PDF-ийн хялбаршуулсан урьдчилан харалт юм.', en: 'This is a simplified preview of the exported PDF.' },
  downloadPdfBtn:         { mn: 'PDF татаж авах',          en: 'Download PDF' },
  pdfNote: {
    mn: 'PDF нь professional хоёр баганат загвараар үүснэ. Профайл зураг оруулсан бол PDF-д харагдана.',
    en: 'PDF is generated as a professional two-column layout. Your profile photo will appear if uploaded.',
  },

  // History view
  historyPanelTitle: { mn: 'CV шинжилгээний түүх', en: 'CV Analysis History' },
  noHistoryMsg:      { mn: 'Одоохондоо CV шинжилгээний түүх байхгүй байна.', en: 'No CV analysis history yet.' },
  uploadCvBtn:       { mn: 'CV upload хийх', en: 'Upload a CV' },
  viewBtn:           { mn: 'Харах',          en: 'View' },

  // Feedback card
  beforeLabel: { mn: 'Өмнөх',       en: 'Before' },
  afterLabel:  { mn: 'Сайжруулсан', en: 'After' },

  // Profile dropdown
  profileMenuItem:   { mn: 'Профайл',            en: 'Profile' },
  settingsMenuItem:  { mn: 'Тохиргоо',           en: 'Settings' },
  myCvsMenuItem:     { mn: 'Миний CV-үүд',        en: 'My CVs' },
  savedJobsMenuItem: { mn: 'Хадгалсан ажлууд',   en: 'Saved Jobs' },
  logoutMenuItem:    { mn: 'Гарах',               en: 'Log out' },
  closeLabel:        { mn: 'Хаах',                en: 'Close' },

  // Toast messages
  analysisLoaded:    { mn: 'Шинжилгээ ачааллагдлаа.',        en: 'Analysis loaded.' },
  loadFailed:        { mn: 'Ачааллахад алдаа гарлаа.',       en: 'Failed to load analysis.' },
  allAcceptedToast:  { mn: 'Бүх санал батлагдлаа. Export хэсэг рүү шилжиж байна…', en: 'All suggestions accepted. Opening export…' },
  suggestionAccepted:  { mn: 'Санал батлагдлаа.',            en: 'Suggestion accepted.' },
  suggestionRejected:  { mn: 'Санал татгалзагдлаа.',         en: 'Suggestion rejected.' },
  suggestionRegenned:  { mn: 'AI suggestion дахин үүсгэлээ.', en: 'Suggestion regenerated.' },
  noImprovedCv:        { mn: 'Татах сайжруулсан CV одоогоор алга байна.', en: 'No improved CV is available to download yet.' },

  // Feedback type labels
  cvImprovementType: { mn: 'CV сайжруулалт', en: 'CV improvement' },
} as const;

type TKey = keyof typeof T;

/** Returns the translated string for the given key and language. */
export function t(key: TKey, lang: Language): string {
  const entry = T[key];
  if (entry && typeof (entry as Record<string, unknown>).mn === 'string') {
    return ((entry as unknown) as {mn: string; en: string})[lang];
  }
  return key;
}

/** Returns a translated string array (for keys whose value is {mn: string[], en: string[]}). */
export function tArr(key: 'securityItems', lang: Language): readonly string[] {
  return T[key][lang];
}

/** Persist and read language preference from localStorage. */
export const langStorage = {
  get(): Language {
    try {
      const v = localStorage.getItem('cv_lang');
      return v === 'en' ? 'en' : 'mn';
    } catch {
      return 'mn';
    }
  },
  set(lang: Language) {
    try { localStorage.setItem('cv_lang', lang); } catch {}
  },
};
