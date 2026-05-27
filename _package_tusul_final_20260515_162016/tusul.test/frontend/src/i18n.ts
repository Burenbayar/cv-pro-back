export type Language = 'mn' | 'en';

const T = {
  // App branding
  appName:           { mn: 'CV AI Pro',                                        en: 'CV AI Pro' },
  subtitle:          { mn: 'AI-д суурилсан CV сайжруулах систем',               en: 'AI-powered CV improvement platform' },

  // Navigation
  navOverview:  { mn: 'Нүүр',       en: 'Overview' },
  navUpload:    { mn: 'CV оруулах',  en: 'CV Upload' },
  navAnalysis:  { mn: 'Шинжилгээ', en: 'Analysis' },
  navRewrite:   { mn: 'Дахин бичих',   en: 'Rewrite' },
  navInterview: { mn: 'Ярилцлага', en: 'Interview' },
  navCareer:    { mn: 'Карьер',    en: 'Career' },
  navExport:    { mn: 'Татах',    en: 'Export' },
  navHistory:   { mn: 'Түүх',      en: 'History' },

  // Auth
  loginTitle:    { mn: 'Тавтай морил',                                en: 'Welcome back' },
  loginDesc:     { mn: 'CV шинжилгээний хяналтын самбар руу нэвтрэнэ үү.', en: 'Sign in to access your CV analysis dashboard.' },
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
  welcome:     { mn: 'CV гүйцэтгэлийн самбар', en: 'CV performance dashboard' },
  welcomeDesc: {
    mn: 'CV оруулах, ATS оноо шалгах, дахин бичих санал, ярилцлагын бэлтгэл, карьерын төлөвлөгөө болон татах үйлдэл бүгд нэг дор.',
    en: 'Upload a CV, check ATS fit, review rewrite suggestions, prepare for interviews, plan a career path and export an optimized draft.',
  },
  statOverall: { mn: 'Нийт оноо', en: 'Overall' },
  statRewrite: { mn: 'Дахин бичих',   en: 'Rewrite' },
  statStatus:  { mn: 'Төлөв',    en: 'Status' },

  // Overview
  overallScoreLabel: { mn: 'Нийт оноо',    en: 'Overall Score' },
  overallHelper:     { mn: '5 метрикийн дундаж', en: '5 metric average' },
  atsHelper:         { mn: 'Түлхүүр үг ба бүтэц',     en: 'Keyword & structure' },
  grammarLabel:      { mn: 'Хэлний алдаа',        en: 'Grammar' },
  grammarHelper:     { mn: 'Өнгө аяс ба бичгийн алдаа',         en: 'Tone & spelling' },
  skillsMatchLabel:  { mn: 'Ур чадварын тохирол',        en: 'Skills Match' },
  skillsMatchHelper: { mn: 'Зорилтот ажилд тохирол', en: 'Target role fit' },
  recentCvs:         { mn: 'Сүүлийн CV файлууд',  en: 'Recent CVs' },
  noCvs:             { mn: 'Одоогоор CV байхгүй байна. Эхлээд нэг CV оруулна уу.', en: 'No CVs yet. Upload one to get started.' },
  aiFeedbackTitle:   { mn: 'AI саналын хураангуй', en: 'AI feedback summary' },
  aiFeedbackEmpty:   { mn: 'CV оруулсны дараа шинжилгээ гарна.', en: 'Analysis will appear after you upload a CV.' },
  strengthsLabel:    { mn: 'Давуу тал',       en: 'Strengths' },
  areasLabel:        { mn: 'Сайжруулах хэсэг', en: 'Areas to improve' },
  quickActions:      { mn: 'Хурдан үйлдлүүд', en: 'Quick Actions' },
  uploadNewCv:       { mn: 'Шинэ CV оруулах', en: 'Upload new CV' },
  reviewRewrites:    { mn: 'Дахин бичих саналууд харах',  en: 'Review rewrites' },
  prepareInterview:  { mn: 'Ярилцлагад бэлтгэх',    en: 'Prepare interview' },
  downloadExport:    { mn: 'Бэлэн CV татах',          en: 'Download export' },

  // Upload view
  uploadTitle:       { mn: 'CV оруулах болон шинжилгээ',       en: 'CV upload and analysis' },
  uploadDesc:        { mn: 'PDF файл 10MB хүртэл. CV текстийг зөвхөн шинжилгээний оролт гэж үзнэ.', en: 'PDF up to 10MB. CV text is treated only as untrusted analysis input.' },
  chooseFile:        { mn: 'Файл сонгох',  en: 'Choose file' },
  dropFile:          { mn: 'Файлаа энд чирж оруулах эсвэл сонгох', en: 'Drop or choose your file' },
  rawTextLabel:      { mn: 'CV-ийн уншигдсан эсвэл хуулсан текст', en: 'Extracted or pasted CV text' },
  jobDescLabel:      { mn: 'Зорилтот ажлын байрны тайлбар', en: 'Target job description' },
  analyze:           { mn: 'Шинжилгээ эхлүүлэх', en: 'Start analysis' },
  profilePhotoLabel: { mn: 'CV цээж зураг (заавал биш)', en: 'CV headshot (optional)' },
  choosePhoto:       { mn: 'Зураг сонгох', en: 'Choose photo' },
  removePhoto:       { mn: 'Арилгах',      en: 'Remove' },
  pasteCvPlaceholder:  { mn: 'CV текстийг энд буулгана уу...',                    en: 'Paste CV text here...' },
  pasteJobPlaceholder: { mn: 'Зорилтот ажлын байрны шаардлагыг буулгана уу...', en: 'Paste target job description to optimize keywords...' },
  processingStatus:  { mn: 'Боловсруулалтын явц', en: 'Processing status' },

  // Processing step descriptions
  stepUploadedDesc:   { mn: 'Файл шалгах, хэмжээ/төрөл баталгаажуулах',        en: 'File validation, size/type check' },
  stepParsingDesc:    { mn: 'Текст болон бүтэцтэй JSON гаргах',                  en: 'Raw text + structured JSON extraction' },
  stepAnalyzingDesc:  { mn: 'AI шинжилгээ болон schema баталгаажуулалт',        en: 'Stage-based AI scoring + schema validation' },
  stepCompletedDesc:  { mn: 'Самбар, дахин бичих санал, ярилцлага, татах хэсэг бэлэн',      en: 'Dashboard, rewrite, interview, export ready' },

  // CvStatus labels
  statusUploaded:  { mn: 'Оруулсан',          en: 'Uploaded' },
  statusParsing:   { mn: 'CV уншиж байна',            en: 'Parsing CV' },
  statusAnalyzing: { mn: 'AI шинжилгээ хийж байна', en: 'Analyzing' },
  statusCompleted: { mn: 'Дууссан',                  en: 'Completed' },
  statusFailed:    { mn: 'Алдаа гарсан',             en: 'Failed' },

  // Validation messages
  onlyPdf:       { mn: 'Зөвхөн PDF файл оруулна уу.',       en: 'Only PDF files are allowed.' },
  emptyFile:     { mn: 'Хоосон файл байна.',                      en: 'The selected file is empty.' },
  fileTooLarge:  { mn: 'Файлын хэмжээ 10MB-аас их байна.',        en: 'File size must be under 10MB.' },
  cvRequired:    { mn: 'CV файл эсвэл CV текст оруулна уу.',      en: 'Upload a CV file or paste CV text.' },
  loginRequired: { mn: 'Шинжилгээ хийхийн тулд эхлээд нэвтэрнэ үү.', en: 'Please log in to analyze your CV.' },
  sessionExpired: { mn: 'Нэвтрэлт хүчинтэй биш. Дахин нэвтэрнэ үү.', en: 'Session expired. Please log in again.' },
  serverError:   { mn: 'Серверт холбогдож чадсангүй.',            en: 'Could not connect to server.' },
  cvTextLoaded:  { mn: 'CV текст уншлаа ({count} тэмдэгт).', en: 'CV text loaded ({count} chars).' },
  analysisReadySummary: { mn: 'Таны CV ({count} тэмдэгт) шинжлэгдэж, шинэ CV бэлэн боллоо.', en: 'Your CV was analyzed ({count} chars). New CV is ready.' },
  analysisMissingCv: { mn: 'Шинэ CV үүсээгүй. PDF-ийн текстийг хуулж оруулаад дахин оролдоно уу.', en: 'No new CV generated. Paste CV text and try again.' },

  // Analysis view
  aiAnalysisTag:     { mn: 'AI ШИНЖИЛГЭЭ',              en: 'AI ANALYSIS' },
  cvAnalysisTitle:   { mn: 'CV Анализ',                  en: 'CV Analysis' },
  cvAnalysisSubtitle:{ mn: 'AI тусламжтайгаар CV загварыг сайжруул', en: 'Improve your CV with AI assistance' },
  standardMatch:     { mn: 'Стандарт CV тохирол',        en: 'Standard CV match' },
  standardMatchValue:{ mn: 'Стандарт CV тохирол: {value}%', en: 'Standard CV match: {value}%' },
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
  aiRewriteTitle:  { mn: 'AI дахин бичих саналууд',  en: 'AI rewrite suggestions' },
  uploadFirstMsg:  { mn: 'Эхлээд CV оруулж шинжилгээ хийлгэнэ үү.', en: 'Upload and analyze a CV first.' },
  acceptedBtn:     { mn: 'Батлагдсан', en: 'Accepted' },
  acceptBtn:       { mn: 'Батлах',     en: 'Accept' },
  regenBtn:        { mn: 'Дахин',      en: 'Regen' },
  rejectBtn:       { mn: 'Татгалзах',  en: 'Reject' },
  downloadCvBtn:   { mn: 'CV татаж авах', en: 'Download CV' },
  fallbackFeedbackOriginal: { mn: 'CV-ийн энэ хэсгийг сайжруулах шаардлагатай', en: 'CV section needs improvement' },
  fallbackFeedbackExplanation: { mn: 'ATS болон ажил олгогчид уншихад илүү ойлгомжтой болгоно.', en: 'Improves ATS alignment and recruiter readability.' },
  fallbackCareerDuration: { mn: '3-6 сар', en: '3-6 months' },
  suggestionQuantifyAppend: { mn: 'Мөн үр дүнг тоон үзүүлэлтээр тодруулж, зорилтот ажлын байрны түлхүүр үгстэй уялдуулах боломжтой.', en: 'Also quantify results and align with target role keywords.' },

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
  missingSkillsTitle:  { mn: 'Дутуу ур чадвар',            en: 'Missing skills' },
  roadmapTitle:        { mn: '3-6 сарын төлөвлөгөө',      en: '3-6 month roadmap' },

  // Export view
  previewPanelTitle:   { mn: 'Урьдчилан харах', en: 'Preview' },
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
    mn: 'PDF нь мэргэжлийн хоёр баганат загвараар үүснэ. Профайл зураг оруулсан бол PDF-д харагдана.',
    en: 'PDF is generated as a professional two-column layout. Your profile photo will appear if uploaded.',
  },
  exportPreviewIntro: { mn: 'Таны CV-г ингэж сайжрууллаа', en: 'Your CV has been improved to look like this' },
  exportPreviewEmpty: { mn: 'Эхлээд CV шинжилгээ хийж сайжруулсан агуулга аваарай.', en: 'Run analysis first.' },
  cvPreviewModalTitle: { mn: 'CV урьдчилан харах', en: 'CV preview' },
  templateRoleFallback: { mn: 'Мэргэжил', en: 'Professional' },

  // History view
  historyPanelTitle: { mn: 'CV шинжилгээний түүх', en: 'CV Analysis History' },
  noHistoryMsg:      { mn: 'Одоохондоо CV шинжилгээний түүх байхгүй байна.', en: 'No CV analysis history yet.' },
  uploadCvBtn:       { mn: 'CV оруулах', en: 'Upload a CV' },
  viewBtn:           { mn: 'Харах',          en: 'View' },

  // Feedback card
  beforeLabel: { mn: 'Өмнөх',       en: 'Before' },
  afterLabel:  { mn: 'Сайжруулсан', en: 'After' },
  improvedToLabel: { mn: 'Ингэж сайжрууллаа', en: 'Improved to' },
  changesTitle: { mn: 'Юу өөрчлөгдсөн бэ?', en: 'What changed?' },
  changesIntro: { mn: 'Таны CV-д доорх сайжруулалтуудыг хийлээ. Эдгээр нь ATS болон ажил олгогчид илүү ойлгомжтой харагдахад тусална.', en: 'We applied the improvements below so recruiters and ATS systems can read your CV more clearly.' },
  highlightedKeywords: { mn: 'Нэмсэн / онцолсон түлхүүр үг', en: 'Highlighted keywords' },
  strengthsEmphasized: { mn: 'Тодотгосон давуу тал', en: 'Strengths emphasized' },
  noAcceptedSuggestions: { mn: 'Дахин бичих хэсэгт санал батлагдаагүй байна. Гэхдээ доорх CV аль хэдийн бүтэцлэгдсэн байна.', en: 'No suggestions were accepted in Rewrite yet. Your structured CV is still ready below.' },

  // Profile dropdown
  profileMenuItem:   { mn: 'Профайл',            en: 'Profile' },
  settingsMenuItem:  { mn: 'Тохиргоо',           en: 'Settings' },
  myCvsMenuItem:     { mn: 'Миний CV-үүд',        en: 'My CVs' },
  savedJobsMenuItem: { mn: 'Хадгалсан ажлууд',   en: 'Saved Jobs' },
  logoutMenuItem:    { mn: 'Гарах',               en: 'Log out' },
  closeLabel:        { mn: 'Хаах',                en: 'Close' },
  profileImageAlt:   { mn: 'Профайл зураг',        en: 'Profile photo' },
  profilePreviewAlt: { mn: 'Профайл зургийн урьдчилсан харагдац', en: 'Profile photo preview' },
  avatarAlt:         { mn: 'Хэрэглэгчийн зураг',   en: 'Avatar' },
  switchToEnglish:   { mn: 'Англи',                en: 'English' },
  switchToMongolian: { mn: 'Монгол',               en: 'Mongolian' },

  // Toast messages
  analysisLoaded:    { mn: 'Шинжилгээ ачааллагдлаа.',        en: 'Analysis loaded.' },
  loadFailed:        { mn: 'Ачааллахад алдаа гарлаа.',       en: 'Failed to load analysis.' },
  languageRefreshing: { mn: 'Сонгосон хэлээр шинжилгээг шинэчилж байна...', en: 'Refreshing analysis in the selected language...' },
  languageRefreshed: { mn: 'Шинжилгээ сонгосон хэлээр шинэчлэгдлээ.', en: 'Analysis refreshed in the selected language.' },
  languageRefreshFailed: { mn: 'Шинжилгээг сонгосон хэлээр шинэчилж чадсангүй.', en: 'Could not refresh analysis in the selected language.' },
  allAcceptedToast:  { mn: 'Бүх санал батлагдлаа. Татах хэсэг рүү шилжиж байна...', en: 'All suggestions accepted. Opening export...' },
  suggestionAccepted:  { mn: 'Санал батлагдлаа.',            en: 'Suggestion accepted.' },
  suggestionRejected:  { mn: 'Санал татгалзагдлаа.',         en: 'Suggestion rejected.' },
  suggestionRegenned:  { mn: 'AI санал дахин үүсгэлээ.', en: 'Suggestion regenerated.' },
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

export function tf(key: TKey, lang: Language, values: Record<string, string | number>): string {
  return t(key, lang).replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ''));
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
