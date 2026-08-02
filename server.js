const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");
const { runAtsRuleChecks } = require("./api/_atsRules");
const { buildPdfBuffer, buildDocxBuffer } = require("./report");
const { buildResumePdfBuffer, buildResumeDocxBuffer } = require("./resumeExport");

const app = express();
const PORT = process.env.PORT || 3000;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/score", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "resumeText and jobDescription are both required" });
    }

    const ruleChecks = runAtsRuleChecks(resumeText);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are an ATS (applicant tracking system) resume analyst.
Compare the resume below against the job description. Return ONLY valid JSON
with this exact shape, no markdown fences, no preamble:

{
  "keywordMatchScore": <0-100 integer>,
  "missingKeywords": [<strings>],
  "matchedKeywords": [<strings>],
  "summary": "<2-3 sentence plain-language summary>"
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock ? textBlock.text : "{}";
    let aiScore;
    try {
      aiScore = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      aiScore = { error: "Could not parse AI response" };
    }

    res.json({ ruleChecks, aiScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong scoring the resume." });
  }
});

app.post("/api/rewrite", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText || !jobDescription) {
      return res.status(400).json({ error: "resumeText and jobDescription are both required" });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a resume writing coach. Given the resume and job
description below, suggest 3-6 rewritten bullet points that better match
the job description while staying truthful to the original content — do
not invent achievements, numbers, or experience. Return ONLY valid JSON,
no markdown fences:

{
  "suggestions": [
    { "original": "<original bullet>", "rewrite": "<improved bullet>", "reason": "<why this is stronger>" }
  ]
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock ? textBlock.text : "{}";
    let suggestions;
    try {
      suggestions = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      suggestions = { error: "Could not parse AI response" };
    }

    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong generating rewrite suggestions." });
  }
});

app.post("/api/report/pdf", async (req, res) => {
  try {
    const buffer = await buildPdfBuffer(req.body);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=ats-report.pdf");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate PDF report." });
  }
});

app.post("/api/report/docx", async (req, res) => {
  try {
    const buffer = await buildDocxBuffer(req.body);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=ats-report.docx");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate Word report." });
  }
});

app.post("/api/resume/pdf", async (req, res) => {
  try {
    const buffer = await buildResumePdfBuffer(req.body);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate resume PDF." });
  }
});

app.post("/api/resume/docx", async (req, res) => {
  try {
    const buffer = await buildResumeDocxBuffer(req.body);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=resume.docx");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate resume Word doc." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
