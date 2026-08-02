# ATS Resume Builder (Simple Version)

Plain HTML/CSS/JS frontend + a small Express backend. No framework, no
build step for the frontend.

## Folder structure

```
public/
  index.html   ← the page itself (design system + builder markup)
  app.js       ← handles scoring, the AI enhance flow, and the builder logic
api/
  _atsRules.js ← free, instant format checks (no AI cost)
  score.js, rewrite.js  ← used only if you deploy to Vercel instead (ignore for Render)
server.js      ← the actual server used for Render — serves the page + API together
report.js      ← builds the downloadable analysis report (PDF/Word)
resumeExport.js ← builds the actual resume file from the builder tab (PDF/Word)
package.json
.env.example
```

## What's in this version

- **Score my resume** tab: paste an existing resume + job description,
  get a circular match-score gauge, format checks, missing/matched
  keywords, AI rewrite suggestions, and a downloadable PDF/Word report.
- **Build my resume** tab: structured fields with a live preview.
  Includes an optional job-description field — paste one to align your
  wording with it, or leave it blank and the AI will still polish your
  sentences. Each suggestion has an "Apply" button that edits your form
  directly. Downloads as an ATS-safe PDF or Word doc.

## Step 1: Test locally

You need Node.js installed (nodejs.org, LTS version).

1. Open this folder in VS Code, open a terminal (Ctrl+`)
2. `npm install`
3. `copy .env.example .env` then paste your real Anthropic API key into `.env`
4. `npm start`
5. Open `http://localhost:3000` (not the Live Server 5500 one)

## Step 2: Push to GitHub

VS Code Source Control panel → commit → Sync/Publish.

## Step 3: Deploy on Render

1. render.com → New → Web Service → connect your repo
2. Build Command: `npm install`  |  Start Command: `npm start`
3. Environment Variables → add `ANTHROPIC_API_KEY`
4. Create Web Service

Free tier sleeps after ~15 min of no visitors; first visit after that
takes 30-50 seconds to wake up, then it's fast again.
