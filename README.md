# ATS Resume Builder (Simple Version)

Plain HTML/CSS/JS frontend + a small Express backend. No framework, no
build step for the frontend.

## Folder structure

```
public/
  index.html   ← the page itself
  app.js       ← handles the button click and talks to the backend
api/
  _atsRules.js ← free, instant format checks (no AI cost)
  score.js, rewrite.js  ← used only if you deploy to Vercel instead (ignore for Render)
server.js      ← the actual server used for Render — serves the page + API together
report.js      ← builds the downloadable analysis report (PDF/Word)
resumeExport.js ← builds the actual resume file from the builder tab (PDF/Word)
package.json
.env.example
```

## New: build a resume from scratch

There's now a second tab, **"Build my resume"**, alongside the scorer.
It has structured fields (name, contact, summary, experience, education,
skills) with a live preview, and downloads as an ATS-safe PDF or Word
doc — single column, standard fonts, no tables. This is separate from
the "Score my resume" tab, which is still there for people who already
have a resume and just want to check it against a job description.

After scoring, the page now also fetches AI rewrite suggestions and shows
two buttons: **Download PDF** and **Download Word**. Both pull together
the score, matched/missing keywords, format checks, and rewrite
suggestions into one file. This uses two extra packages — `pdfkit` and
`docx` — which `npm install` will pick up automatically since they're
already in `package.json`.

## Step 1: Test locally (recommended before deploying)

You need Node.js installed (nodejs.org, download the LTS version).

1. Open this folder in VS Code, open a terminal (`Ctrl+\``)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and paste in your real Anthropic API key
   (get one at console.anthropic.com):
   ```bash
   cp .env.example .env
   ```
   Then open `.env` in VS Code and paste your key after the `=` sign.
4. Start the server:
   ```bash
   npm start
   ```
5. You'll see `Server running at http://localhost:3000` in the terminal.
   Open that URL in your browser (NOT the Live Server 5500 one) — this is
   the version where the "Score my resume" button actually works, since
   the real backend is running.

Test it fully here. Once it works the way you want, move to deployment.

## Step 2: Push to GitHub

In VS Code's Source Control panel (left sidebar), click "Publish to
GitHub" if you haven't already, or commit and push your latest changes.

## Step 3: Deploy on Render

1. Go to render.com → sign up with GitHub
2. Click "New +" -> "Web Service"
3. Connect your ats-resume-builder repository
4. Fill in:
   - Name: anything, e.g. ats-resume-builder
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
   - Instance Type: Free
5. Scroll to "Environment Variables" -> add:
   - Key: ANTHROPIC_API_KEY, Value: your real key
6. Click "Create Web Service"

Render will build and deploy — takes a few minutes the first time. You'll
get a URL like ats-resume-builder.onrender.com

Reminder on the free tier: after ~15 minutes of no visitors, Render's
free tier "sleeps" your app. The next visit takes about 30-50 seconds to
wake back up, then it's fast again until it sleeps once more. This is
fine for testing and early sharing — just something to know so it
doesn't look broken if someone visits it cold.
