const Anthropic = require("@anthropic-ai/sdk");
const { runAtsRuleChecks } = require("./_atsRules");

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

    res.status(200).json({ ruleChecks, aiScore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong scoring the resume." });
  }
};
