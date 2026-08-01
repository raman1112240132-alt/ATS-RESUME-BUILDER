const PDFDocument = require("pdfkit");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Spacing,
} = require("docx");

// Builds a PDF buffer from the analysis data. Returns a Promise<Buffer>.
function buildPdfBuffer(data) {
  const { aiScore, ruleChecks, suggestions } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("ATS Resume Report", { underline: true });
    doc.moveDown();

    doc.fontSize(14).text(
      `Keyword Match Score: ${aiScore?.keywordMatchScore ?? "—"}%`
    );
    doc.moveDown(0.5);
    if (aiScore?.summary) {
      doc.fontSize(11).text(aiScore.summary);
      doc.moveDown();
    }

    if (aiScore?.matchedKeywords?.length) {
      doc.fontSize(13).text("Matched Keywords", { underline: true });
      doc.fontSize(11).text(aiScore.matchedKeywords.join(", "));
      doc.moveDown();
    }

    if (aiScore?.missingKeywords?.length) {
      doc.fontSize(13).text("Missing Keywords", { underline: true });
      doc.fontSize(11).text(aiScore.missingKeywords.join(", "));
      doc.moveDown();
    }

    if (ruleChecks?.length) {
      doc.fontSize(13).text("Format Checks", { underline: true });
      ruleChecks.forEach((check) => {
        doc
          .fontSize(11)
          .text(`${check.passed ? "[PASS]" : "[WARN]"} ${check.label}: ${check.detail}`);
      });
      doc.moveDown();
    }

    if (suggestions?.suggestions?.length) {
      doc.fontSize(13).text("Suggested Rewrites", { underline: true });
      suggestions.suggestions.forEach((s, i) => {
        doc.moveDown(0.3);
        doc.fontSize(11).text(`${i + 1}. Original: ${s.original}`);
        doc.fontSize(11).text(`   Suggested: ${s.rewrite}`);
        doc.fontSize(10).fillColor("#555555").text(`   Why: ${s.reason}`);
        doc.fillColor("#000000");
      });
    }

    doc.end();
  });
}

// Builds a DOCX buffer from the analysis data. Returns a Promise<Buffer>.
async function buildDocxBuffer(data) {
  const { aiScore, ruleChecks, suggestions } = data;

  const children = [
    new Paragraph({ text: "ATS Resume Report", heading: HeadingLevel.TITLE }),
    new Paragraph({
      text: `Keyword Match Score: ${aiScore?.keywordMatchScore ?? "—"}%`,
      heading: HeadingLevel.HEADING_2,
    }),
  ];

  if (aiScore?.summary) {
    children.push(new Paragraph({ text: aiScore.summary }));
  }

  if (aiScore?.matchedKeywords?.length) {
    children.push(new Paragraph({ text: "Matched Keywords", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: aiScore.matchedKeywords.join(", ") }));
  }

  if (aiScore?.missingKeywords?.length) {
    children.push(new Paragraph({ text: "Missing Keywords", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: aiScore.missingKeywords.join(", ") }));
  }

  if (ruleChecks?.length) {
    children.push(new Paragraph({ text: "Format Checks", heading: HeadingLevel.HEADING_2 }));
    ruleChecks.forEach((check) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${check.passed ? "[PASS] " : "[WARN] "}`,
              bold: true,
            }),
            new TextRun(`${check.label}: ${check.detail}`),
          ],
        })
      );
    });
  }

  if (suggestions?.suggestions?.length) {
    children.push(new Paragraph({ text: "Suggested Rewrites", heading: HeadingLevel.HEADING_2 }));
    suggestions.suggestions.forEach((s, i) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. Original: `, bold: true }), new TextRun(s.original)],
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Suggested: ", bold: true }), new TextRun(s.rewrite)],
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "Why: ", italics: true }), new TextRun({ text: s.reason, italics: true })],
        })
      );
    });
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

module.exports = { buildPdfBuffer, buildDocxBuffer };
