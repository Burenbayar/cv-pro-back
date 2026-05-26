const sampleResults = {
  candidateName: "Sample Candidate",
  targetRole: "Frontend Developer",
  summary: "You have a solid baseline for client-side work and should focus on portfolio depth plus stronger API integration skills.",
  skills: ["HTML", "CSS", "JavaScript", "React"],
  experienceLevel: "Junior",
  weakPoints: ["Few quantified achievements", "Limited backend exposure"],
  careerRecommendations: [
    "Target frontend and UI-focused roles first.",
    "Build projects that consume external APIs.",
    "Practice explaining business impact in interviews."
  ],
  cvImprovementSuggestions: [
    "Add measurable outcomes to project bullets.",
    "Include a stronger professional summary.",
    "Separate core skills into a clean section."
  ],
  rewrittenCv: "SAMPLE CANDIDATE\nFrontend Developer Candidate\n\nPROFESSIONAL SUMMARY\nMotivated candidate with frontend fundamentals and growing product engineering experience.",
  metadata: {
    provider: "simulated",
    source: "text-input",
    language: "en"
  }
};

const translations = {
  en: {
    "nav.home": "Home",
    "nav.upload": "Upload CV",
    "nav.results": "Results",
    "nav.account": "Account",
    "nav.login": "Login",
    "nav.logout": "Logout",
    "nav.loggedInAs": "Signed in as {name}",
    "home.eyebrow": "Smart Career Guidance",
    "home.title": "Turn your CV into a focused career action plan.",
    "home.subtitle": "Upload your CV, describe your dream role, and get role matches, skill gaps, and next-step recommendations from your AI advisor.",
    "home.start": "Start Analysis",
    "home.samples": "View Sample Results",
    "home.cardTitle": "What the platform does",
    "home.feature1": "Reviews CV details and target role goals",
    "home.feature2": "Suggests suitable career paths",
    "home.feature3": "Highlights missing skills to build next",
    "home.feature4": "Creates practical next-step recommendations",
    "home.step1Title": "1. Upload Your CV",
    "home.step1Body": "Share your latest resume or CV and tell the system what kind of role you want next.",
    "home.step2Title": "2. Get AI Insights",
    "home.step2Body": "The backend route evaluates your goals and returns role suggestions, strengths, and skill gaps.",
    "home.step3Title": "3. Build Your Plan",
    "home.step3Body": "Use the result page to review recommendations and map out your next career moves.",
    "upload.eyebrow": "Career Intake",
    "upload.title": "Upload and review your CV before analysis",
    "upload.subtitle": "Add a PDF or paste CV text, review the extracted content in the preview panel, then send it for AI analysis.",
    "upload.fullName": "Full name",
    "upload.fullNamePlaceholder": "Jane Doe",
    "upload.targetRole": "Target role",
    "upload.targetRolePlaceholder": "Frontend Developer",
    "upload.experienceYears": "Years of experience",
    "upload.experienceYearsPlaceholder": "3",
    "upload.uploadTitle": "Upload CV file",
    "upload.uploadCopy": "Drag and drop a PDF or TXT file here, or click to browse.",
    "upload.fileMeta": "Accepted formats: PDF, TXT. Maximum size: 5MB.",
    "upload.noFile": "No file selected",
    "upload.careerGoals": "Career goals",
    "upload.careerGoalsPlaceholder": "I want to transition into a product-focused engineering role...",
    "upload.cvText": "Or paste CV text",
    "upload.cvTextPlaceholder": "Paste resume text here if you do not want to upload a file.",
    "upload.analyze": "Analyze CV",
    "upload.builderBadge": "Structured builder",
    "upload.builderTitle": "Build a recruiter-ready CV profile",
    "upload.builderCopy": "This workspace is organized like a professional CV builder so your information is cleaner before AI analysis begins.",
    "upload.historyHint": "Sign in to automatically save each analysis to your CV history.",
    "upload.sidebarEyebrow": "CV Builder",
    "upload.sidebarTitle": "Resume sections",
    "upload.sidebarStep1Title": "Personal profile",
    "upload.sidebarStep1Copy": "Add your name, target role, and experience level.",
    "upload.sidebarStep2Title": "Source document",
    "upload.sidebarStep2Copy": "Upload a file or paste the latest CV content.",
    "upload.sidebarStep3Title": "Career direction",
    "upload.sidebarStep3Copy": "Describe the role, industry, and growth goal you want next.",
    "upload.sidebarStep4Title": "AI review",
    "upload.sidebarStep4Copy": "Generate a stronger CV draft and role-specific feedback.",
    "upload.sectionPersonalTitle": "Personal profile",
    "upload.sectionPersonalCopy": "Start with the core details a recruiter expects to see first.",
    "upload.sectionSourceTitle": "CV source",
    "upload.sectionSourceCopy": "Import your latest file or paste the full CV text for a cleaner AI review.",
    "upload.sectionGoalsTitle": "Career direction",
    "upload.sectionGoalsCopy": "Clarify what kind of next role you want so the advice feels tailored, not generic.",
    "upload.sectionContentTitle": "CV content",
    "upload.sectionContentCopy": "Paste the latest version here if you want full control over what the AI reads.",
    "upload.previewTitle": "Text Preview",
    "upload.previewBadge": "Live preview",
    "upload.previewCopy": "Preview pasted text or supported text-file content before sending it to the API.",
    "upload.previewPlaceholder": "Your CV preview will appear here.",
    "upload.fileSelected": "{name} selected",
    "upload.pdfSelected": "PDF selected. Preview is available for pasted text or text files.",
    "upload.dropReady": "Release to upload this CV file.",
    "upload.fileError": "Only PDF and TXT files up to 5MB are supported.",
    "upload.validation": "Please upload a PDF or paste CV text.",
    "upload.analyzing": "Analyzing CV...",
    "upload.analyzingButton": "Analyzing...",
    "upload.complete": "Analysis complete. Redirecting to results...",
    "upload.savedToHistory": "Analysis complete and saved to your history.",
    "upload.networkError": "Could not reach the backend. Make sure the Node server is running.",
    "upload.timeoutError": "The request timed out. Please try again.",
    "results.eyebrow": "Analysis Output",
    "results.title": "Your career guidance results",
    "results.subtitle": "This page shows either sample data or the most recent backend response, including a rewritten CV draft.",
    "results.candidate": "Candidate",
    "results.targetRole": "Target role",
    "results.summary": "Summary",
    "results.skills": "Skills",
    "results.experienceLevel": "Experience level",
    "results.weakPoints": "Weak points",
    "results.careerRecommendations": "Career recommendations",
    "results.cvImprovements": "CV improvement suggestions",
    "results.rewrittenCv": "Rewritten CV",
    "results.unknownCandidate": "Unknown candidate",
    "results.notProvided": "Not provided",
    "results.unknown": "Unknown",
    "results.noRewrittenCv": "No rewritten CV returned.",
    "results.downloadCv": "Download CV",
    "results.refreshHistory": "Refresh History",
    "results.downloadReady": "Your improved CV file has been downloaded.",
    "results.downloadMissing": "No rewritten CV is available to download yet.",
    "history.eyebrow": "Saved History",
    "history.title": "Your previous CV analyses",
    "history.subtitle": "Sign in to keep a timeline of AI career reviews and improved CV versions.",
    "history.loginPrompt": "Sign in to save and review your previous CV analyses.",
    "history.empty": "No saved analyses yet. Run your first CV review from the upload page.",
    "history.loadError": "Could not load saved history right now.",
    "history.loadButton": "Open result",
    "history.itemMeta": "{date} • {role}",
    "auth.eyebrow": "Account Access",
    "auth.title": "Create an account or sign in",
    "auth.subtitle": "Save your CV analysis history, return to improved versions, and keep your preferred language in sync.",
    "auth.loginTab": "Login",
    "auth.signupTab": "Sign Up",
    "auth.fullName": "Full name",
    "auth.fullNamePlaceholder": "Jane Doe",
    "auth.email": "Email",
    "auth.emailPlaceholder": "jane@example.com",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "Minimum 6 characters",
    "auth.submitLogin": "Login",
    "auth.submitSignup": "Create Account",
    "auth.loggingIn": "Signing you in...",
    "auth.signingUp": "Creating your account...",
    "auth.successLogin": "Login successful. Redirecting...",
    "auth.successSignup": "Account created. Redirecting...",
    "auth.summaryEyebrow": "Account Benefits",
    "auth.summaryTitle": "What you unlock when you sign in",
    "auth.benefit1": "Saved CV analysis history for each account",
    "auth.benefit2": "Quick return to previous rewritten CV versions",
    "auth.benefit3": "Language preference that stays consistent across sessions",
    "auth.benefit4": "Cleaner workflow for exporting your latest career review"
  },
  mn: {
    "nav.home": "Нүүр",
    "nav.upload": "CV оруулах",
    "nav.results": "Үр дүн",
    "nav.account": "Бүртгэл",
    "nav.login": "Нэвтрэх",
    "nav.logout": "Гарах",
    "nav.loggedInAs": "{name} хэрэглэгч нэвтэрсэн",
    "home.eyebrow": "Ухаалаг карьер зөвлөмж",
    "home.title": "CV-гээ карьерын илүү тодорхой төлөвлөгөө болгон хувиргаарай.",
    "home.subtitle": "CV-гээ оруулж, зорьж буй ажлын чиглэлээ тодорхойлоод, тохирох ажлын байр, ур чадварын зөрүү болон дараагийн алхмуудын зөвлөмжөө AI зөвлөхөөс аваарай.",
    "home.start": "Шинжилгээ эхлүүлэх",
    "home.samples": "Жишээ үр дүн харах",
    "home.cardTitle": "Платформ юу хийдэг вэ",
    "home.feature1": "CV болон зорилтот ажлын чиглэлийг шинжилнэ",
    "home.feature2": "Тохирох карьерын чиглэл санал болгоно",
    "home.feature3": "Сайжруулах шаардлагатай ур чадварыг тодруулна",
    "home.feature4": "Дараагийн хэрэгжүүлэх алхмуудыг гаргана",
    "home.step1Title": "1. CV-гээ оруулна",
    "home.step1Body": "Сүүлийн CV эсвэл resume-гээ оруулаад, дараагийн зорьж буй ажлаа бичнэ.",
    "home.step2Title": "2. AI шинжилгээ авна",
    "home.step2Body": "Backend нь таны мэдээллийг үнэлж, тохирох чиглэл, давуу тал болон сайжруулах хэсгүүдийг буцаана.",
    "home.step3Title": "3. Төлөвлөгөөгөө гаргана",
    "home.step3Body": "Үр дүнгийн хуудаснаас зөвлөмжүүдээ харж, дараагийн карьер алхмаа төлөвлөнө.",
    "upload.eyebrow": "Карьерын мэдээлэл",
    "upload.title": "Шинжилгээний өмнө CV-гээ оруулж шалгана уу",
    "upload.subtitle": "PDF файл оруулах эсвэл CV текстээ paste хийгээд preview хэсэгт шалгасны дараа AI шинжилгээнд илгээнэ үү.",
    "upload.fullName": "Овог нэр",
    "upload.fullNamePlaceholder": "Бат Энх",
    "upload.targetRole": "Зорилтот албан тушаал",
    "upload.targetRolePlaceholder": "Frontend Developer",
    "upload.experienceYears": "Ажлын туршлагын жил",
    "upload.experienceYearsPlaceholder": "3",
    "upload.uploadTitle": "CV файл оруулах",
    "upload.uploadCopy": "PDF эсвэл TXT файлаа энд чирж оруулах, эсвэл дарж сонгоно уу.",
    "upload.fileMeta": "Дэмжих формат: PDF, TXT. Дээд хэмжээ: 5MB.",
    "upload.noFile": "Файл сонгогдоогүй",
    "upload.careerGoals": "Карьерын зорилго",
    "upload.careerGoalsPlaceholder": "Би product-focused engineering role руу шилжихийг хүсэж байна...",
    "upload.cvText": "Эсвэл CV текстээ оруулна уу",
    "upload.cvTextPlaceholder": "Хэрэв файл оруулахгүй бол CV текстээ энд paste хийнэ үү.",
    "upload.analyze": "CV шинжлэх",
    "upload.builderBadge": "Бүтэцтэй builder",
    "upload.builderTitle": "Recruiter-д бэлэн CV профайлаа бүрдүүлээрэй",
    "upload.builderCopy": "Энэ ажлын талбар нь мэргэжлийн CV builder шиг зохион байгуулагдсан тул AI шинжилгээ хийхээс өмнө таны мэдээлэл илүү цэгцтэй болно.",
    "upload.historyHint": "Нэвтэрсэн тохиолдолд таны анализ бүр CV history хэсэгт автоматаар хадгалагдана.",
    "upload.sidebarEyebrow": "CV Builder",
    "upload.sidebarTitle": "Resume хэсгүүд",
    "upload.sidebarStep1Title": "Хувийн мэдээлэл",
    "upload.sidebarStep1Copy": "Нэр, зорилтот албан тушаал, туршлагын түвшнээ оруулна.",
    "upload.sidebarStep2Title": "Эх сурвалж",
    "upload.sidebarStep2Copy": "Файл оруулах эсвэл хамгийн сүүлийн CV агуулгаа paste хийнэ.",
    "upload.sidebarStep3Title": "Карьерын чиглэл",
    "upload.sidebarStep3Copy": "Дараагийн зорьж буй албан тушаал, салбар, өсөлтийн зорилгоо тодорхой бичнэ.",
    "upload.sidebarStep4Title": "AI үнэлгээ",
    "upload.sidebarStep4Copy": "Илүү хүчтэй CV хувилбар болон role-specific зөвлөмж гаргана.",
    "upload.sectionPersonalTitle": "Хувийн профайл",
    "upload.sectionPersonalCopy": "Recruiter эхэлж хардаг үндсэн мэдээллээ энд оруулна.",
    "upload.sectionSourceTitle": "CV эх сурвалж",
    "upload.sectionSourceCopy": "Шинэчилсэн CV файлаa оруулах эсвэл бүх текстээ paste хийж AI-д илүү цэвэр өгөгдөл өгнө.",
    "upload.sectionGoalsTitle": "Карьерын чиглэл",
    "upload.sectionGoalsCopy": "Дараагийн хүсэж буй ажлаа тодорхой бичвэл зөвлөмж нь илүү оновчтой болно.",
    "upload.sectionContentTitle": "CV агуулга",
    "upload.sectionContentCopy": "AI яг ямар агуулга уншихыг өөрөө хянахыг хүсвэл энд сүүлийн хувилбараа paste хийнэ үү.",
    "upload.previewTitle": "Текст preview",
    "upload.previewBadge": "Шууд preview",
    "upload.previewCopy": "API руу илгээхээсээ өмнө paste хийсэн эсвэл text файлын агуулгыг энд шалгана уу.",
    "upload.previewPlaceholder": "Таны CV preview энд харагдана.",
    "upload.fileSelected": "{name} сонгогдлоо",
    "upload.pdfSelected": "PDF файл сонгогдлоо. Preview нь paste текст эсвэл text файл дээр харагдана.",
    "upload.dropReady": "CV файлаа оруулахын тулд энд суллана уу.",
    "upload.fileError": "Зөвхөн 5MB хүртэлх PDF болон TXT файл дэмжинэ.",
    "upload.validation": "PDF файл оруулах эсвэл CV текстээ paste хийнэ үү.",
    "upload.analyzing": "CV-г шинжилж байна...",
    "upload.analyzingButton": "Шинжилж байна...",
    "upload.complete": "Шинжилгээ дууслаа. Үр дүн рүү шилжиж байна...",
    "upload.savedToHistory": "Шинжилгээ дуусаж, таны history хэсэгт хадгалагдлаа.",
    "upload.networkError": "Backend-т холбогдож чадсангүй. Server ажиллаж байгаа эсэхийг шалгана уу.",
    "upload.timeoutError": "Хүсэлт хэт удааширлаа. Дахин оролдоно уу.",
    "results.eyebrow": "Шинжилгээний үр дүн",
    "results.title": "Таны карьерын зөвлөмжийн үр дүн",
    "results.subtitle": "Энд жишээ өгөгдөл эсвэл хамгийн сүүлийн backend хариу, мөн сайжруулсан CV-ийн хувилбар харагдана.",
    "results.candidate": "Нэр дэвшигч",
    "results.targetRole": "Зорилтот албан тушаал",
    "results.summary": "Товч дүгнэлт",
    "results.skills": "Ур чадвар",
    "results.experienceLevel": "Туршлагын түвшин",
    "results.weakPoints": "Сайжруулах хэсэг",
    "results.careerRecommendations": "Карьерын зөвлөмж",
    "results.cvImprovements": "CV сайжруулах зөвлөмж",
    "results.rewrittenCv": "Сайжруулсан CV",
    "results.unknownCandidate": "Тодорхойгүй нэр дэвшигч",
    "results.notProvided": "Өгөгдөөгүй",
    "results.unknown": "Тодорхойгүй",
    "results.noRewrittenCv": "Сайжруулсан CV буцаагдаагүй байна.",
    "results.downloadCv": "CV татах",
    "results.refreshHistory": "History шинэчлэх",
    "results.downloadReady": "Сайжруулсан CV файл татагдлаа.",
    "results.downloadMissing": "Татах боломжтой сайжруулсан CV одоогоор алга байна.",
    "history.eyebrow": "Хадгалсан түүх",
    "history.title": "Таны өмнөх CV шинжилгээнүүд",
    "history.subtitle": "Нэвтэрснээр AI карьерын үнэлгээнүүд болон сайжруулсан CV хувилбаруудаа цагийн дарааллаар хадгална.",
    "history.loginPrompt": "Өмнөх CV шинжилгээнүүдээ хадгалах, харахын тулд нэвтэрнэ үү.",
    "history.empty": "Одоогоор хадгалсан анализ алга. Upload page дээрээс анхны CV review-гээ ажиллуулна уу.",
    "history.loadError": "History мэдээллийг одоогоор ачаалж чадсангүй.",
    "history.loadButton": "Үр дүнг нээх",
    "history.itemMeta": "{date} • {role}",
    "auth.eyebrow": "Бүртгэл",
    "auth.title": "Шинэ бүртгэл үүсгэх эсвэл нэвтрэх",
    "auth.subtitle": "CV analysis history-гаа хадгалж, сайжруулсан хувилбарууд руугаа буцаж орж, хэлний сонголтоо тогтвортой ашиглаарай.",
    "auth.loginTab": "Нэвтрэх",
    "auth.signupTab": "Бүртгүүлэх",
    "auth.fullName": "Овог нэр",
    "auth.fullNamePlaceholder": "Бат Энх",
    "auth.email": "Имэйл",
    "auth.emailPlaceholder": "jane@example.com",
    "auth.password": "Нууц үг",
    "auth.passwordPlaceholder": "Хамгийн багадаа 6 тэмдэгт",
    "auth.submitLogin": "Нэвтрэх",
    "auth.submitSignup": "Бүртгэл үүсгэх",
    "auth.loggingIn": "Нэвтрүүлж байна...",
    "auth.signingUp": "Бүртгэл үүсгэж байна...",
    "auth.successLogin": "Амжилттай нэвтэрлээ. Шилжиж байна...",
    "auth.successSignup": "Бүртгэл амжилттай үүслээ. Шилжиж байна...",
    "auth.summaryEyebrow": "Давуу тал",
    "auth.summaryTitle": "Нэвтэрснээр нээгдэх боломжууд",
    "auth.benefit1": "Хэрэглэгч бүрийн CV analysis history хадгалагдана",
    "auth.benefit2": "Өмнөх сайжруулсан CV хувилбарууд руу хурдан буцаж орно",
    "auth.benefit3": "Хэлний тохиргоо session бүр дээр тогтвортой хадгалагдана",
    "auth.benefit4": "Сүүлийн карьерын review-гээ PDF болгон экспортлоход илүү цэгцтэй болно"
  }
};

const LANGUAGE_STORAGE_KEY = "careerAdvisorLanguage";
const RESULT_STORAGE_KEY = "careerAdvisorResults";
const AUTH_TOKEN_STORAGE_KEY = "careerAdvisorAuthToken";
const AUTH_USER_STORAGE_KEY = "careerAdvisorAuthUser";
let currentLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || "en";
let currentUser = readStoredUser();
let authMode = "login";

const API_BASE_URL = (() => {
  if (window.CAREER_API_BASE) {
    return String(window.CAREER_API_BASE).replace(/\/$/, "");
  }

  if (window.location.protocol === "http:" || window.location.protocol === "https:") {
    return window.location.origin.replace(/\/$/, "");
  }

  return "http://localhost:3001";
})();

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
}

function setAuthState(token, user) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  if (user) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }

  currentUser = user || null;
  updateAuthUi();
}

async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  const headers = new Headers(options.headers || {});
  const authToken = getAuthToken();

  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const errorMessage = errorBody && errorBody.error ? errorBody.error : "Request failed.";

      if (response.status === 401) {
        setAuthState("", null);
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(t("upload.timeoutError"));
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function t(key, replacements = {}) {
  const dictionary = translations[currentLanguage] || translations.en;
  let value = dictionary[key] || translations.en[key] || key;

  Object.entries(replacements).forEach(([replacementKey, replacementValue]) => {
    value = value.replace(`{${replacementKey}}`, replacementValue);
  });

  return value;
}

function applyTranslations() {
  document.documentElement.lang = currentLanguage === "mn" ? "mn" : "en";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  document.querySelectorAll("[data-i18n-label]").forEach((element) => {
    const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = `\n            ${t(element.dataset.i18nLabel)}\n            `;
    }
  });

  document.querySelectorAll(".lang-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === currentLanguage);
  });

  updateAuthUi();
}

function setLanguage(language) {
  currentLanguage = language === "mn" ? "mn" : "en";
  localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
  applyTranslations();

  if (document.body.dataset.page === "results") {
    const stored = localStorage.getItem(RESULT_STORAGE_KEY);
    renderResults(stored ? JSON.parse(stored) : sampleResults);
    renderHistoryState();
  }
}

function setupLanguageSwitcher() {
  document.querySelectorAll(".lang-button").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeResults(data) {
  if (!data) {
    return sampleResults;
  }

  if (data.experience_level || data.jobLevel || data.improved_cv) {
    return {
      candidateName: data.candidateName || "Candidate",
      targetRole: data.targetRole || "Recommended Role Track",
      summary: data.summary || "AI analysis completed successfully.",
      skills: data.skills || [],
      experienceLevel: data.experience_level || data.jobLevel || "Unknown",
      weakPoints: data.weaknesses || data.weakPoints || [],
      careerRecommendations: data.job_recommendations || data.careerSuggestions || [],
      cvImprovementSuggestions: data.cvImprovementSuggestions || [],
      rewrittenCv: data.improved_cv || data.improvedCv || "",
      metadata: data.metadata || {}
    };
  }

  return data;
}

function renderResults(data) {
  const container = document.getElementById("results-container");

  if (!container) {
    return;
  }

  const result = normalizeResults(data || sampleResults);
  const cards = [
    {
      title: t("results.candidate"),
      body: `<p><strong>${escapeHtml(result.candidateName || t("results.unknownCandidate"))}</strong></p><p>${escapeHtml(t("results.targetRole"))}: ${escapeHtml(result.targetRole || t("results.notProvided"))}</p>`
    },
    {
      title: t("results.summary"),
      body: `<p>${escapeHtml(result.summary)}</p>`
    },
    {
      title: t("results.skills"),
      body: `<ul>${(result.skills || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    },
    {
      title: t("results.experienceLevel"),
      body: `<p>${escapeHtml(result.experienceLevel || t("results.unknown"))}</p>`
    },
    {
      title: t("results.weakPoints"),
      body: `<ul>${(result.weakPoints || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    },
    {
      title: t("results.careerRecommendations"),
      body: `<ul>${(result.careerRecommendations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    },
    {
      title: t("results.cvImprovements"),
      body: `<ul>${(result.cvImprovementSuggestions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    },
    {
      title: t("results.rewrittenCv"),
      wide: true,
      body: `<pre>${escapeHtml(result.rewrittenCv || t("results.noRewrittenCv"))}</pre>`
    }
  ];

  container.innerHTML = cards
    .map((card) => `
      <article class="result-card ${card.wide ? "wide" : ""}">
        <h2>${card.title}</h2>
        ${card.body}
      </article>
    `)
    .join("");
}

function updatePreview(text) {
  const preview = document.getElementById("cv-preview");
  const placeholder = document.getElementById("preview-placeholder");

  if (!preview || !placeholder) {
    return;
  }

  const normalizedText = String(text || "").trim();

  if (!normalizedText) {
    preview.hidden = true;
    preview.textContent = "";
    placeholder.hidden = false;
    return;
  }

  placeholder.hidden = true;
  preview.hidden = false;
  preview.textContent = normalizedText;
}

function updateUploadState(state, message = "") {
  const dropzone = document.getElementById("upload-dropzone");
  const fileName = document.getElementById("file-name");

  if (dropzone) {
    dropzone.dataset.uploadState = state;
  }

  if (fileName && message) {
    fileName.textContent = message;
  }
}

function isSupportedCvFile(file) {
  if (!file) {
    return false;
  }

  const fileName = file.name.toLowerCase();
  const isSupportedType = file.type === "application/pdf" || file.type === "text/plain" || fileName.endsWith(".pdf") || fileName.endsWith(".txt");
  const isSupportedSize = file.size <= 5 * 1024 * 1024;
  return isSupportedType && isSupportedSize;
}

function readSelectedFile(file) {
  const previewStatus = document.getElementById("form-status");

  if (!file) {
    updateUploadState("idle", t("upload.noFile"));
    return;
  }

  if (!isSupportedCvFile(file)) {
    const fileInput = document.getElementById("cv-file");
    if (fileInput) {
      fileInput.value = "";
    }
    updateUploadState("error", t("upload.fileError"));
    updatePreview("");
    if (previewStatus) {
      previewStatus.textContent = t("upload.fileError");
    }
    return;
  }

  updateUploadState("success", t("upload.fileSelected", { name: file.name }));

  if (file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")) {
    const reader = new FileReader();
    reader.onload = () => {
      const textArea = document.getElementById("cv-text");
      const text = typeof reader.result === "string" ? reader.result : "";

      if (textArea) {
        textArea.value = text;
      }

      updatePreview(textArea ? textArea.value : text);
      if (previewStatus) {
        previewStatus.textContent = "";
      }
    };
    reader.readAsText(file);
    return;
  }

  updatePreview("");
  if (previewStatus) {
    previewStatus.textContent = t("upload.pdfSelected");
  }
}

async function submitCvForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("form-status");
  const analyzeButton = document.getElementById("analyze-button");
  const formData = new FormData(form);
  const cvFile = formData.get("cvFile");
  const cvText = String(formData.get("cvText") || "").trim();

  if ((!cvFile || !cvFile.name) && !cvText) {
    status.textContent = t("upload.validation");
    return;
  }

  status.textContent = t("upload.analyzing");
  if (analyzeButton) {
    analyzeButton.disabled = true;
    analyzeButton.textContent = t("upload.analyzingButton");
  }

  try {
    formData.set("language", currentLanguage);
    const result = await apiRequest("/api/career/analyze", {
      method: "POST",
      body: formData
    });

    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
    status.textContent = currentUser ? t("upload.savedToHistory") : t("upload.complete");
    window.setTimeout(() => {
      window.location.href = "results.html";
    }, 450);
  } catch (error) {
    status.textContent = error.message || t("upload.networkError");
  } finally {
    if (analyzeButton) {
      analyzeButton.disabled = false;
      analyzeButton.textContent = t("upload.analyze");
    }
  }
}

function setupUploadPage() {
  const form = document.getElementById("cv-form");
  const textArea = document.getElementById("cv-text");
  const fileInput = document.getElementById("cv-file");
  const dropzone = document.getElementById("upload-dropzone");

  if (form) {
    form.addEventListener("submit", submitCvForm);
  }

  if (textArea) {
    textArea.addEventListener("input", (event) => updatePreview(event.target.value));
  }

  if (fileInput) {
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
      readSelectedFile(file);
    });
  }

  if (dropzone && fileInput) {
    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        updateUploadState("dragging", t("upload.dropReady"));
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (eventName === "dragleave") {
          updateUploadState(fileInput.files && fileInput.files.length ? "success" : "idle");
        }
      });
    });

    dropzone.addEventListener("drop", (event) => {
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]
        ? event.dataTransfer.files[0]
        : null;

      if (file) {
        fileInput.files = event.dataTransfer.files;
        readSelectedFile(file);
      }
    });
  }
}

function renderHistoryState(history = null) {
  const empty = document.getElementById("history-empty");
  const list = document.getElementById("history-list");

  if (!empty || !list) {
    return;
  }

  if (!currentUser) {
    empty.hidden = false;
    empty.textContent = t("history.loginPrompt");
    list.innerHTML = "";
    return;
  }

  if (!history || history.length === 0) {
    empty.hidden = false;
    empty.textContent = t("history.empty");
    list.innerHTML = "";
    return;
  }

  empty.hidden = true;
  list.innerHTML = history.map((item) => {
    const dateLabel = new Date(item.createdAt).toLocaleString(currentLanguage === "mn" ? "mn-MN" : "en-US");
    const role = item.request && item.request.targetRole ? item.request.targetRole : t("results.notProvided");
    const result = normalizeResults(item.result || {});

    return `
      <article class="history-item">
        <div class="history-item-head">
          <div>
            <h3>${escapeHtml(result.candidateName || t("results.unknownCandidate"))}</h3>
            <p>${escapeHtml(t("history.itemMeta", { date: dateLabel, role }))}</p>
          </div>
          <button class="button secondary history-open-button" type="button" data-history-id="${escapeHtml(item.id)}">${escapeHtml(t("history.loadButton"))}</button>
        </div>
        <p>${escapeHtml(result.summary || "")}</p>
      </article>
    `;
  }).join("");

  list.querySelectorAll(".history-open-button").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = history.find((item) => item.id === button.dataset.historyId);

      if (selected) {
        localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(selected.result));
        renderResults(selected.result);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

async function loadHistory() {
  const status = document.getElementById("results-status");

  if (!currentUser) {
    renderHistoryState([]);
    return;
  }

  try {
    const response = await apiRequest("/api/career/history");
    renderHistoryState(response.history || []);
    if (status) {
      status.textContent = "";
    }
  } catch (error) {
    renderHistoryState([]);
    if (status) {
      status.textContent = error.message || t("history.loadError");
    }
  }
}

function slugifyFileName(value) {
  return String(value || "improved-cv")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "improved-cv";
}

function downloadImprovedCv() {
  const status = document.getElementById("results-status");
  const stored = localStorage.getItem(RESULT_STORAGE_KEY);
  const result = normalizeResults(stored ? JSON.parse(stored) : sampleResults);
  const rewrittenCv = String(result.rewrittenCv || "").trim();

  if (!rewrittenCv) {
    if (status) {
      status.textContent = t("results.downloadMissing");
    }
    return;
  }

  const fileContent = `${result.candidateName || "Candidate"}\n${result.targetRole || ""}\n\n${rewrittenCv}`;
  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${slugifyFileName(result.candidateName || result.targetRole)}-improved-cv.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  if (status) {
    status.textContent = t("results.downloadReady");
  }
}

function setupResultsPage() {
  const stored = localStorage.getItem(RESULT_STORAGE_KEY);
  renderResults(stored ? JSON.parse(stored) : sampleResults);
  renderHistoryState();

  const downloadButton = document.getElementById("download-cv-button");
  const refreshButton = document.getElementById("refresh-history-button");

  if (downloadButton) {
    downloadButton.addEventListener("click", downloadImprovedCv);
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", loadHistory);
  }

  loadHistory();
}

function updateAuthUi() {
  const authLink = document.getElementById("nav-auth-link");
  const logoutButton = document.getElementById("nav-logout-button");

  if (authLink) {
    if (currentUser) {
      authLink.textContent = t("nav.loggedInAs", { name: currentUser.fullName || currentUser.email || "User" });
      authLink.setAttribute("href", "results.html");
    } else {
      authLink.textContent = t("nav.login");
      authLink.setAttribute("href", "auth.html");
    }
  }

  if (logoutButton) {
    logoutButton.hidden = !currentUser;
  }
}

async function syncAuthState() {
  const token = getAuthToken();

  if (!token) {
    setAuthState("", null);
    return;
  }

  try {
    const response = await apiRequest("/api/auth/me");
    setAuthState(token, response.user || null);
  } catch (error) {
    setAuthState("", null);
  }
}

async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (error) {
    // Ignore logout request failures and clear local state anyway.
  }

  setAuthState("", null);

  if (document.body.dataset.page === "results") {
    renderHistoryState([]);
  }
}

function setupNavAuth() {
  const logoutButton = document.getElementById("nav-logout-button");

  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }
}

function setAuthMode(mode) {
  authMode = mode === "signup" ? "signup" : "login";
  const signupField = document.getElementById("signup-name-field");
  const submitButton = document.getElementById("auth-submit-button");
  const nameInput = signupField ? signupField.querySelector("input") : null;

  document.querySelectorAll(".auth-toggle-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === authMode);
  });

  if (signupField) {
    signupField.hidden = authMode !== "signup";
  }

  if (nameInput) {
    nameInput.required = authMode === "signup";
  }

  if (submitButton) {
    submitButton.textContent = authMode === "signup" ? t("auth.submitSignup") : t("auth.submitLogin");
  }
}

async function submitAuthForm(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("auth-status");
  const submitButton = document.getElementById("auth-submit-button");
  const formData = new FormData(form);
  const endpoint = authMode === "signup" ? "/api/auth/signup" : "/api/auth/login";
  const payload = {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || "").trim(),
    language: currentLanguage
  };

  if (authMode === "signup") {
    payload.fullName = String(formData.get("fullName") || "").trim();
  }

  status.textContent = authMode === "signup" ? t("auth.signingUp") : t("auth.loggingIn");
  submitButton.disabled = true;

  try {
    const response = await apiRequest(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    setAuthState(response.token, response.user);
    status.textContent = authMode === "signup" ? t("auth.successSignup") : t("auth.successLogin");
    window.setTimeout(() => {
      window.location.href = "results.html";
    }, 500);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    setAuthMode(authMode);
  }
}

function setupAuthPage() {
  const form = document.getElementById("auth-form");
  const loginTab = document.getElementById("login-tab");
  const signupTab = document.getElementById("signup-tab");

  if (loginTab) {
    loginTab.addEventListener("click", () => setAuthMode("login"));
  }

  if (signupTab) {
    signupTab.addEventListener("click", () => setAuthMode("signup"));
  }

  if (form) {
    form.addEventListener("submit", submitAuthForm);
  }

  setAuthMode("login");
}

document.addEventListener("DOMContentLoaded", async () => {
  setupLanguageSwitcher();
  setupNavAuth();
  applyTranslations();
  await syncAuthState();

  const page = document.body.dataset.page;

  if (page === "upload") {
    setupUploadPage();
  }

  if (page === "results") {
    setupResultsPage();
  }

  if (page === "auth") {
    setupAuthPage();
  }
});
