// Rule-based ATS compatibility checks — free, instant, no AI call needed.
// These catch formatting issues that break real ATS parsers.

function runAtsRuleChecks(resumeText) {
  const lowerText = resumeText.toLowerCase();
  const results = [];

  const standardHeaders = ["experience", "work experience", "education", "skills"];
  const hasStandardHeaders = standardHeaders.some((h) => lowerText.includes(h));
  results.push({
    passed: hasStandardHeaders,
    label: "Standard section headers",
    detail: hasStandardHeaders
      ? "Found recognizable section headers (Experience, Education, Skills)."
      : "No standard section headers found — use plain labels like 'Experience', 'Education', 'Skills'.",
  });

  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
  results.push({
    passed: hasEmail,
    label: "Parseable email address",
    detail: hasEmail
      ? "Email address detected in a standard format."
      : "No email address detected in plain text.",
  });

  const wordCount = resumeText.trim().split(/\s+/).length;
  const reasonableLength = wordCount >= 150 && wordCount <= 1200;
  results.push({
    passed: reasonableLength,
    label: "Reasonable length",
    detail: `Resume is approximately ${wordCount} words. ${
      reasonableLength
        ? "This is within a typical 1-2 page range."
        : wordCount < 150
        ? "This looks too short."
        : "This looks long — consider trimming."
    }`,
  });

  const suspiciousTableMarkers = /\t{2,}|\|{2,}/.test(resumeText);
  results.push({
    passed: !suspiciousTableMarkers,
    label: "No table/column artifacts",
    detail: suspiciousTableMarkers
      ? "Detected patterns that often come from a table or multi-column layout — these can break ATS parsing."
      : "No table/column artifacts detected.",
  });

  return results;
}

module.exports = { runAtsRuleChecks };
