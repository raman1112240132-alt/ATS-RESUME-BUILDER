const PDFDocument = require("pdfkit");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} = require("docx");

function buildResumePdfBuffer(data) {
  const { fullName, email, phone, location, summary, experience, education, skills } = data;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(fullName || "Your Name", { align: "center" });
    const contactLine = [email, phone, location].filter(Boolean).join("  |  ");
    if (contactLine) doc.fontSize(10).text(contactLine, { align: "center" });
    doc.moveDown();

    if (summary) {
      doc.fontSize(13).text("Summary", { underline: true });
      doc.fontSize(11).text(summary);
      doc.moveDown();
    }

    if (experience?.length) {
      doc.fontSize(13).text("Experience", { underline: true });
      experience.forEach((job) => {
        doc.moveDown(0.3);
        doc.fontSize(12).text(`${job.title || ""} — ${job.company || ""}`);
        doc.fontSize(10).fillColor("#555555").text(job.dates || "");
        doc.fillColor("#000000");
        (job.bullets || []).forEach((b) => {
          if (b.trim()) doc.fontSize(11).text(`• ${b}`, { indent: 10 });
        });
      });
      doc.moveDown();
    }

    if (education?.length) {
      doc.fontSize(13).text("Education", { underline: true });
      education.forEach((ed) => {
        doc.moveDown(0.2);
        doc.fontSize(12).text(`${ed.degree || ""} — ${ed.institution || ""}`);
        doc.fontSize(10).fillColor("#555555").text(ed.dates || "");
        doc.fillColor("#000000");
      });
      doc.moveDown();
    }

    if (skills) {
      doc.fontSize(13).text("Skills", { underline: true });
      doc.fontSize(11).text(skills);
    }

    doc.end();
  });
}

async function buildResumeDocxBuffer(data) {
  const { fullName, email, phone, location, summary, experience, education, skills } = data;

  const children = [
    new Paragraph({ text: fullName || "Your Name", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
  ];

  const contactLine = [email, phone, location].filter(Boolean).join("  |  ");
  if (contactLine) children.push(new Paragraph({ text: contactLine, alignment: AlignmentType.CENTER }));

  if (summary) {
    children.push(new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: summary }));
  }

  if (experience?.length) {
    children.push(new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2 }));
    experience.forEach((job) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${job.title || ""} — ${job.company || ""}`, bold: true })] }));
      if (job.dates) children.push(new Paragraph({ children: [new TextRun({ text: job.dates, italics: true })] }));
      (job.bullets || []).forEach((b) => {
        if (b.trim()) children.push(new Paragraph({ text: `• ${b}` }));
      });
    });
  }

  if (education?.length) {
    children.push(new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }));
    education.forEach((ed) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${ed.degree || ""} — ${ed.institution || ""}`, bold: true })] }));
      if (ed.dates) children.push(new Paragraph({ children: [new TextRun({ text: ed.dates, italics: true })] }));
    });
  }

  if (skills) {
    children.push(new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph({ text: skills }));
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

module.exports = { buildResumePdfBuffer, buildResumeDocxBuffer };
