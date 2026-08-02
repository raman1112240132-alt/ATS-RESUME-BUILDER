/* ---------- Tab switching ---------- */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
  });
});

/* ---------- SCORE EXISTING RESUME ---------- */
const scoreBtn = document.getElementById("scoreBtn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
let lastReportData = null;

scoreBtn.addEventListener("click", async () => {
  const resumeText = document.getElementById("resumeText").value.trim();
  const jobDescription = document.getElementById("jobDescription").value.trim();

  if (!resumeText || !jobDescription) {
    statusEl.textContent = "Please fill in both fields.";
    return;
  }

  scoreBtn.disabled = true;
  statusEl.textContent = "Scoring...";
  resultsEl.innerHTML = "";

  try {
    const [scoreRes, rewriteRes] = await Promise.all([
      fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      }),
      fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription }),
      }),
    ]);

    const scoreData = await scoreRes.json();
    const suggestions = await rewriteRes.json();

    if (scoreData.error) {
      resultsEl.innerHTML = `<p style="color:var(--warn);">${scoreData.error}</p>`;
      return;
    }

    lastReportData = { ...scoreData, suggestions };
    renderResults(lastReportData);
  } catch (err) {
    resultsEl.innerHTML = `<p style="color:var(--warn);">Request failed. Is the server running?</p>`;
  } finally {
    scoreBtn.disabled = false;
    statusEl.textContent = "";
  }
});

function gaugeColor(score) {
  if (score >= 75) return "#0B6E4F";
  if (score >= 50) return "#B5730A";
  return "#B42318";
}

function gaugeVerdict(score) {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Needs work";
  return "Weak match";
}

function buildGaugeSvg(score) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;
  const color = gaugeColor(score);
  return `
    <div class="gauge-wrap">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle class="gauge-track" cx="48" cy="48" r="${radius}" />
        <circle class="gauge-fill" cx="48" cy="48" r="${radius}"
          stroke="${color}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}" />
      </svg>
      <div class="gauge-number" style="color:${color};">${score}%</div>
    </div>
  `;
}

function renderResults(data) {
  let html = "";

  if (data.aiScore && !data.aiScore.error) {
    const score = data.aiScore.keywordMatchScore ?? 0;
    html += `<div class="card">
      <div class="gauge-row">
        ${buildGaugeSvg(score)}
        <div class="gauge-label-block">
          <h2>Keyword match</h2>
          <div class="verdict" style="color:${gaugeColor(score)};">${gaugeVerdict(score)}</div>
        </div>
      </div>
      <p style="font-size:14px;color:var(--muted);margin-top:14px;">${data.aiScore.summary ?? ""}</p>`;
    if (data.aiScore.matchedKeywords?.length) {
      html += `<div style="margin-top:8px;"><strong style="font-size:13px;">Matched:</strong><br/>`;
      for (const kw of data.aiScore.matchedKeywords) html += `<span class="tag matched">${kw}</span>`;
      html += `</div>`;
    }
    if (data.aiScore.missingKeywords?.length) {
      html += `<div style="margin-top:8px;"><strong style="font-size:13px;">Missing:</strong><br/>`;
      for (const kw of data.aiScore.missingKeywords) html += `<span class="tag">${kw}</span>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  if (data.ruleChecks) {
    html += `<div class="card"><h2>Format checks</h2>`;
    for (const check of data.ruleChecks) {
      html += `<div class="check-item"><span>${check.passed ? "✅" : "⚠️"}</span>
        <span><strong>${check.label}:</strong> ${check.detail}</span></div>`;
    }
    html += `</div>`;
  }

  if (data.suggestions?.suggestions?.length) {
    html += `<div class="card"><h2>Suggested rewrites</h2>`;
    for (const s of data.suggestions.suggestions) {
      html += `<div style="margin-bottom:14px;font-size:14px;">
        <div><strong>Original:</strong> ${s.original}</div>
        <div><strong>Suggested:</strong> ${s.rewrite}</div>
        <div style="color:var(--muted);font-size:13px;"><em>Why:</em> ${s.reason}</div>
      </div>`;
    }
    html += `</div>`;
  }

  if (data.ruleChecks || data.aiScore) {
    html += `<div class="card">
      <h2>Download full report</h2>
      <button id="downloadPdfBtn" style="margin-right:10px;">Download PDF</button>
      <button id="downloadDocxBtn" class="secondary-btn">Download Word</button>
    </div>`;
  }

  resultsEl.innerHTML = html || `<p class="placeholder">No results returned.</p>`;

  const pdfBtn = document.getElementById("downloadPdfBtn");
  const docxBtn = document.getElementById("downloadDocxBtn");
  if (pdfBtn) pdfBtn.addEventListener("click", () => downloadReport("pdf"));
  if (docxBtn) docxBtn.addEventListener("click", () => downloadReport("docx"));
}

async function downloadReport(format) {
  if (!lastReportData) return;
  await downloadFile(`/api/report/${format}`, lastReportData, `ats-report.${format}`);
}

/* ---------- BUILD RESUME FROM SCRATCH ---------- */
const experienceList = document.getElementById("experienceList");
const educationList = document.getElementById("educationList");
const experienceTemplate = document.getElementById("experienceTemplate");
const educationTemplate = document.getElementById("educationTemplate");

document.getElementById("addExperience").addEventListener("click", () => {
  const clone = experienceTemplate.content.cloneNode(true);
  experienceList.appendChild(clone);
  attachBuilderListeners();
  updatePreview();
});

document.getElementById("addEducation").addEventListener("click", () => {
  const clone = educationTemplate.content.cloneNode(true);
  educationList.appendChild(clone);
  attachBuilderListeners();
  updatePreview();
});

function attachBuilderListeners() {
  document.querySelectorAll(".remove-entry").forEach((btn) => {
    btn.onclick = (e) => {
      e.target.closest(".entry-block").remove();
      updatePreview();
    };
  });
  document.querySelectorAll("#tab-build input, #tab-build textarea").forEach((el) => {
    el.oninput = updatePreview;
  });
}

function collectResumeData() {
  const experience = [...document.querySelectorAll(".experience-entry")].map((el) => ({
    title: el.querySelector(".exp-title").value,
    company: el.querySelector(".exp-company").value,
    dates: el.querySelector(".exp-dates").value,
    bullets: el.querySelector(".exp-bullets").value.split("\n").filter((b) => b.trim()),
  }));

  const education = [...document.querySelectorAll(".education-entry")].map((el) => ({
    degree: el.querySelector(".edu-degree").value,
    institution: el.querySelector(".edu-institution").value,
    dates: el.querySelector(".edu-dates").value,
  }));

  return {
    fullName: document.getElementById("fullName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    location: document.getElementById("location").value,
    summary: document.getElementById("summary").value,
    experience,
    education,
    skills: document.getElementById("skills").value,
  };
}

function updatePreview() {
  const data = collectResumeData();
  const preview = document.getElementById("resumePreview");

  let html = `<h1>${escapeHtml(data.fullName) || "Your Name"}</h1>`;
  const contactLine = [data.email, data.phone, data.location].filter(Boolean).map(escapeHtml).join(" | ");
  html += `<div class="contact-line">${contactLine}</div>`;

  if (data.summary) html += `<h2>Summary</h2><p>${escapeHtml(data.summary)}</p>`;

  if (data.experience.length) {
    html += `<h2>Experience</h2>`;
    data.experience.forEach((job) => {
      html += `<div class="job-title">${escapeHtml(job.title)} — ${escapeHtml(job.company)}</div>`;
      html += `<div class="job-dates">${escapeHtml(job.dates)}</div>`;
      if (job.bullets.length) html += `<ul>${job.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
    });
  }

  if (data.education.length) {
    html += `<h2>Education</h2>`;
    data.education.forEach((ed) => {
      html += `<div class="job-title">${escapeHtml(ed.degree)} — ${escapeHtml(ed.institution)}</div>`;
      html += `<div class="job-dates">${escapeHtml(ed.dates)}</div>`;
    });
  }

  if (data.skills) html += `<h2>Skills</h2><p>${escapeHtml(data.skills)}</p>`;

  preview.innerHTML = html;
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.querySelectorAll("#tab-build input, #tab-build textarea").forEach((el) => {
  el.oninput = updatePreview;
});

document.getElementById("downloadResumePdfBtn").addEventListener("click", () => {
  downloadFile("/api/resume/pdf", collectResumeData(), "resume.pdf");
});
document.getElementById("downloadResumeDocxBtn").addEventListener("click", () => {
  downloadFile("/api/resume/docx", collectResumeData(), "resume.docx");
});

/* ---------- Shared download helper ---------- */
async function downloadFile(url, body, filename) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Generation failed");
    const blob = await res.blob();
    const objUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(objUrl);
  } catch (err) {
    alert("Could not download the file. Please try again.");
  }
}

updatePreview();
