# AI Career Advisor

React + Node.js based AI CV analysis and career recommendation platform.

## Features

- CV text, PDF, DOCX, and TXT analysis
- OpenAI structured JSON response with safe simulated fallback
- JWT login/register/logout
- bcrypt password hashing
- Per-user CV analysis history
- ATS score, skills, weak points, missing skills, career recommendations, and improved CV
- Backend-generated professional PDF download

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3001
```

If port `3001` is busy, change `PORT` in `.env`.

## Environment

Create `.env` from `.env.example`.

```env
PORT=3001
AUTH_SECRET=replace-with-a-long-random-secret-minimum-32-characters
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=your-openai-api-key-here
```

Do not commit real `.env` files or real OpenAI API keys. Keep only `.env.example` in GitHub.

## Main API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/career/analyze`
- `POST /api/career/analyze-text`
- `GET /api/career/history`
- `POST /api/career/export-pdf`
- `POST /api/analyze-cv`

Protected requests use:

```text
Authorization: Bearer <jwt-token>
```

## Production Notes

- Local data is stored in `data/app-db.json` for this starter version.
- For real production, replace the JSON store with PostgreSQL or another managed database.
- OpenAI is called only from the backend.
- If OpenAI fails or no key is configured, the app returns a structured simulated response so the UI still works.
