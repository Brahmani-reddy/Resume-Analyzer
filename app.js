const stopWords = new Set(`
  a about above after again against all am an and any are as at be because been before being below between both but by
  can did do does doing down during each few for from further had has have having he her here hers herself him himself
  his how i if in into is it its itself just me more most my myself no nor not of off on once only or other our ours
  ourselves out over own same she should so some such than that the their theirs them themselves then there these they
  this those through to too under until up very was we were what when where which while who whom why will with you your
  yours yourself yourselves
`.trim().split(/\s+/));

const roleSkills = {
  software: [
    "javascript", "typescript", "react", "node", "python", "java", "sql", "postgresql", "mongodb", "api",
    "rest", "graphql", "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "testing", "jest",
    "microservices", "system design", "git", "security", "performance"
  ],
  data: [
    "python", "sql", "machine learning", "deep learning", "nlp", "pandas", "numpy", "scikit-learn",
    "tensorflow", "pytorch", "statistics", "experiment", "a/b testing", "spark", "airflow", "tableau",
    "power bi", "feature engineering", "model deployment", "data pipeline", "etl"
  ],
  product: [
    "roadmap", "strategy", "stakeholders", "user research", "analytics", "experimentation", "a/b testing",
    "prioritization", "go-to-market", "requirements", "prd", "kpi", "growth", "customer discovery",
    "agile", "scrum", "launch", "market analysis"
  ],
  design: [
    "figma", "wireframes", "prototype", "user research", "usability", "accessibility", "interaction design",
    "visual design", "design system", "journey map", "information architecture", "ux writing", "responsive",
    "personas", "handoff", "a/b testing"
  ],
  marketing: [
    "seo", "sem", "content", "campaign", "conversion", "analytics", "google ads", "email marketing",
    "brand", "positioning", "copywriting", "crm", "hubspot", "salesforce", "retention", "growth",
    "social media", "market research"
  ]
};

const actionVerbs = [
  "built", "created", "designed", "launched", "led", "owned", "improved", "reduced", "increased", "optimized",
  "automated", "delivered", "implemented", "architected", "managed", "scaled", "migrated", "analyzed"
];

const sampleResume = `Senior Software Engineer
Email: alex@example.com | Phone: 555-0100 | GitHub: github.com/alex

Summary
Software engineer with 6 years building React, TypeScript, Node.js, PostgreSQL, and AWS products.

Experience
Built a customer analytics dashboard in React and TypeScript that reduced reporting time by 42%.
Designed REST APIs in Node.js and PostgreSQL serving 2M monthly requests with 99.95% uptime.
Led CI/CD migration with Docker and GitHub Actions, cutting release time from 2 hours to 18 minutes.
Improved test coverage with Jest and integration testing across core payment workflows.

Skills
JavaScript, TypeScript, React, Node.js, REST, PostgreSQL, AWS, Docker, CI/CD, Jest, Git, performance optimization.

Education
B.S. Computer Science`;

const sampleJob = `We are hiring a Software Engineer to build customer-facing analytics products. Required skills include React, TypeScript, Node.js, REST APIs, PostgreSQL, AWS, Docker, CI/CD, testing, and performance optimization. The ideal candidate has experience designing reliable services, improving product metrics, collaborating with product managers, and communicating technical tradeoffs.`;

const els = {
  resume: document.querySelector("#resumeText"),
  job: document.querySelector("#jobText"),
  resumeFile: document.querySelector("#resumeFile"),
  fileStatus: document.querySelector("#fileStatus"),
  sample: document.querySelector("#loadSample"),
  role: document.querySelector("#roleSelect"),
  strictness: document.querySelector("#strictness"),
  analyze: document.querySelector("#analyzeButton"),
  overall: document.querySelector("#overallScore"),
  confidence: document.querySelector("#confidenceBadge"),
  recommendations: document.querySelector("#recommendations"),
  matched: document.querySelector("#matchedSkills"),
  missing: document.querySelector("#missingSkills"),
  keywords: document.querySelector("#keywordList")
};

let pdfjsModule;

function normalize(text) {
  return text.toLowerCase().replace(/node\.js/g, "node").replace(/ci\/cd/g, "cicd").replace(/c\+\+/g, "cplusplus");
}

function tokenize(text) {
  return normalize(text)
    .replace(/[^a-z0-9+#./-]+/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function termFrequency(tokens) {
  const map = new Map();
  for (const token of tokens) map.set(token, (map.get(token) || 0) + 1);
  return map;
}

function tfidfCosine(aText, bText) {
  const docs = [tokenize(aText), tokenize(bText)];
  const vectors = docs.map(termFrequency);
  const terms = [...new Set([...vectors[0].keys(), ...vectors[1].keys()])];
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const term of terms) {
    const df = docs.filter((doc) => doc.includes(term)).length;
    const idf = Math.log((1 + docs.length) / (1 + df)) + 1;
    const a = (vectors[0].get(term) || 0) * idf;
    const b = (vectors[1].get(term) || 0) * idf;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function phrasePresent(text, phrase) {
  const cleanText = normalize(text).replace(/ci\/cd/g, "cicd");
  const cleanPhrase = normalize(phrase).replace(/ci\/cd/g, "cicd");
  if (cleanPhrase.includes(" ")) return cleanText.includes(cleanPhrase);
  return new RegExp(`(^|[^a-z0-9])${cleanPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(cleanText);
}

function extractRequirements(jobText, role) {
  const skills = new Set(roleSkills[role]);
  for (const skillList of Object.values(roleSkills)) {
    for (const skill of skillList) {
      if (phrasePresent(jobText, skill)) skills.add(skill);
    }
  }
  return [...skills];
}

function topKeywords(resumeText, jobText) {
  const resumeTokens = new Set(tokenize(resumeText));
  const jobTerms = termFrequency(tokenize(jobText));
  return [...jobTerms.entries()]
    .filter(([term]) => !resumeTokens.has(term))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([term]) => term);
}

function atsReadiness(text) {
  const checks = [
    /@/.test(text),
    /\b(phone|mobile|\+?\d[\d\s().-]{7,})\b/i.test(text),
    /\b(summary|profile|objective)\b/i.test(text),
    /\b(experience|employment|work history)\b/i.test(text),
    /\b(skills|technical skills|core competencies)\b/i.test(text),
    /\b(education|degree|university|college)\b/i.test(text),
    text.length > 900,
    !/(table of contents|image only|references available upon request)/i.test(text)
  ];
  return checks.filter(Boolean).length / checks.length;
}

function evidenceQuality(text) {
  const lower = normalize(text);
  const verbHits = actionVerbs.filter((verb) => lower.includes(verb)).length;
  const metricHits = (text.match(/\b\d+(\.\d+)?\s?(%|x|k|m|million|hours|minutes|users|requests|revenue|cost)\b/gi) || []).length;
  const projectSignals = (lower.match(/\b(project|product|platform|dashboard|pipeline|service|workflow|launch)\b/g) || []).length;
  const senioritySignals = (lower.match(/\b(led|owned|managed|mentored|architected|strategy|stakeholder)\b/g) || []).length;
  return Math.min(1, verbHits / 8 * 0.32 + metricHits / 5 * 0.34 + projectSignals / 8 * 0.2 + senioritySignals / 5 * 0.14);
}

function skillCoverage(resumeText, requirements) {
  const matched = requirements.filter((skill) => phrasePresent(resumeText, skill));
  const missing = requirements.filter((skill) => !phrasePresent(resumeText, skill));
  return { matched, missing, score: requirements.length ? matched.length / requirements.length : 0 };
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function weightedScore(parts, strictness) {
  const strictPenalty = 1 - strictness / 1000;
  const score =
    parts.semantic * 0.34 +
    parts.skills * 0.32 +
    parts.ats * 0.16 +
    parts.evidence * 0.18;
  return Math.max(0, score * strictPenalty);
}

function setMetric(name, value) {
  const percent = clampPercent(value);
  document.querySelector(`#${name}Score`).textContent = `${percent}%`;
  document.querySelector(`#${name}Bar`).style.width = `${percent}%`;
}

function renderChips(target, values, type = "") {
  target.className = values.length ? "chips" : "chips empty";
  target.innerHTML = values.length
    ? values.map((value) => `<span class="chip ${type}">${value}</span>`).join("")
    : "None found";
}

function buildRecommendations({ overall, semantic, coverage, ats, evidence, keywords }) {
  const items = [];
  if (coverage.missing.length) {
    items.push(`Add honest evidence for these high-value skills if you have them: ${coverage.missing.slice(0, 6).join(", ")}.`);
  }
  if (semantic < 0.58) {
    items.push("Mirror the job description more closely in your summary and experience bullets using natural wording, not keyword stuffing.");
  }
  if (evidence < 0.68) {
    items.push("Rewrite bullets with action, scope, and measurable impact. Example: built X for Y users, improving Z by N%.");
  }
  if (ats < 0.78) {
    items.push("Use clear headings for Summary, Experience, Skills, and Education, and keep contact details in readable text.");
  }
  if (keywords.length) {
    items.push(`Consider adding relevant missing terms where truthful: ${keywords.slice(0, 5).join(", ")}.`);
  }
  if (overall >= 0.86) {
    items.push("The resume is strongly aligned. Make final improvements by tightening bullets around the exact business outcomes in the job description.");
  }
  return items.slice(0, 5);
}

function confidenceLabel(resumeText, jobText, overall) {
  const enoughText = resumeText.length > 700 && jobText.length > 250;
  if (!enoughText) return "Low confidence: add more text";
  if (overall >= 0.84) return "High match confidence";
  if (overall >= 0.66) return "Moderate match confidence";
  return "Low match confidence";
}

function setFileStatus(message, type = "") {
  els.fileStatus.textContent = message;
  els.fileStatus.className = `file-status ${type}`.trim();
}

function fileExtension(file) {
  return file.name.split(".").pop().toLowerCase();
}

async function extractPdfText(file) {
  pdfjsModule ||= await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.mjs");
  pdfjsModule.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.worker.mjs";
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsModule.getDocument({ data: bytes }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n\n").trim();
}

async function extractDocxText(file) {
  if (!window.mammoth) {
    throw new Error("DOCX extraction library is not available. Check your internet connection and reload the page.");
  }
  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value.trim();
}

async function extractResumeText(file) {
  const extension = fileExtension(file);
  if (["txt", "md", "csv"].includes(extension) || file.type.startsWith("text/")) {
    return file.text();
  }
  if (extension === "pdf" || file.type === "application/pdf") {
    return extractPdfText(file);
  }
  if (extension === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractDocxText(file);
  }
  if (extension === "doc" || file.type === "application/msword") {
    throw new Error("Legacy .doc files can be uploaded, but this browser-only app cannot reliably extract old Word binary text. Save it as .docx or PDF and upload again.");
  }
  throw new Error("Unsupported file type. Upload TXT, MD, CSV, PDF, DOCX, or convert legacy DOC to DOCX/PDF.");
}

function analyze() {
  const resumeText = els.resume.value.trim();
  const jobText = els.job.value.trim();
  if (!resumeText || !jobText) {
    alert("Paste both resume text and job description before analyzing.");
    return;
  }

  const requirements = extractRequirements(jobText, els.role.value);
  const coverage = skillCoverage(resumeText, requirements);
  const semantic = Math.min(1, tfidfCosine(resumeText, jobText) * 1.85);
  const ats = atsReadiness(resumeText);
  const evidence = evidenceQuality(resumeText);
  const strictness = Number(els.strictness.value);
  const overall = weightedScore({ semantic, skills: coverage.score, ats, evidence }, strictness);
  const keywords = topKeywords(resumeText, jobText);

  els.overall.textContent = `${clampPercent(overall)}%`;
  setMetric("semantic", semantic);
  setMetric("skill", coverage.score);
  setMetric("ats", ats);
  setMetric("evidence", evidence);
  renderChips(els.matched, coverage.matched.slice(0, 18));
  renderChips(els.missing, coverage.missing.slice(0, 18), "missing");
  renderChips(els.keywords, keywords, "keyword");
  els.confidence.textContent = confidenceLabel(resumeText, jobText, overall);
  els.recommendations.innerHTML = buildRecommendations({ overall, semantic, coverage, ats, evidence, keywords })
    .map((item) => `<li>${item}</li>`)
    .join("");
}

els.resumeFile.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  setFileStatus(`Reading ${file.name}...`);
  try {
    const text = await extractResumeText(file);
    if (!text) {
      throw new Error("No readable text was found. If this is a scanned PDF, run OCR first and upload the text-based file.");
    }
    els.resume.value = text;
    setFileStatus(`Loaded ${file.name} (${text.length.toLocaleString()} characters).`, "success");
  } catch (error) {
    els.resume.value = "";
    setFileStatus(error.message, "error");
  }
});

els.sample.addEventListener("click", () => {
  els.resume.value = sampleResume;
  els.job.value = sampleJob;
  analyze();
});

els.analyze.addEventListener("click", analyze);
