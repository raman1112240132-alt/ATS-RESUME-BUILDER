const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !jobDescription) {
      res.status(400).json({ error: "resumeText and jobDescription are both required" });
      return;
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

    res.status(200).json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong generating rewrite suggestions." });
  }
};
