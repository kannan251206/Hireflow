# HireFlow — Smart Hiring Platform

A full-stack web application that helps **candidates** analyze and improve their resumes, and helps **recruiters** rank candidates for a job — powered by a shared NLP scoring engine.

---

## 📁 Folder Structure

```
hireflow/
├── server/                     # Node.js + Express backend
│   ├── index.js                # Entry point
│   ├── .env.example            # Environment variable template
│   ├── package.json
│   ├── middleware/
│   │   ├── auth.js             # JWT auth middleware
│   │   └── upload.js           # Multer file upload
│   ├── models/
│   │   ├── User.js             # User schema
│   │   └── index.js            # Resume, JobDescription, Result schemas
│   ├── routes/
│   │   ├── auth.js             # POST /api/auth/register|login
│   │   ├── candidate.js        # POST /api/candidate/analyze
│   │   └── recruiter.js        # POST /api/recruiter/rank
│   └── services/
│       ├── resumeParser.js     # PDF + DOCX text extraction
│       ├── keywordExtractor.js # NLP keyword extraction
│       └── matcher.js          # Core scoring & ranking engine
│
└── client/                     # React frontend
    ├── public/
    │   └── index.html
    ├── package.json
    └── src/
        ├── App.jsx              # Router + auth-protected routes
        ├── index.js
        ├── index.css            # Global design tokens + styles
        ├── hooks/
        │   └── useAuth.js       # Auth context + hook
        ├── services/
        │   └── api.js           # Axios API service layer
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── CandidateDashboard.jsx
        │   └── RecruiterDashboard.jsx
        └── components/
            ├── shared/
            │   ├── Navbar.jsx
            │   ├── ScoreCard.jsx    # Animated SVG score ring
            │   └── FileDropzone.jsx # Drag & drop upload
            ├── candidate/
            │   └── AnalysisResult.jsx
            └── recruiter/
                └── RankingTable.jsx
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local install or MongoDB Atlas free tier)

---

### 1. Clone / unzip the project

```bash
cd hireflow
```

---

### 2. Setup the Backend

```bash
cd server
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hireflow
JWT_SECRET=change_this_to_a_random_secret_string
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

Server runs at `http://localhost:5000`

---

### 3. Setup the Frontend

```bash
cd ../client
npm install
npm start
```

App runs at `http://localhost:3000`

The React app proxies API calls to `http://localhost:5000` (configured in `package.json`).

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (name, email, password, role) |
| POST | `/api/auth/login` | Login (email, password) |
| POST | `/api/candidate/analyze` | Analyze resume vs job description |
| GET | `/api/candidate/history` | Get past analyses (auth required) |
| POST | `/api/recruiter/rank` | Rank multiple resumes |
| GET | `/api/health` | Health check |

---

## 🛠️ Tech Stack

**Frontend:** React 18, React Router v6, Axios, React Dropzone, CSS Modules

**Backend:** Node.js, Express, Mongoose, Multer, pdf-parse, mammoth, natural

**Database:** MongoDB

---

## 📈 Development Phases

- [x] **Phase 1 (MVP):** Candidate resume analysis — score, keywords, suggestions
- [x] **Phase 2:** Recruiter multi-resume ranking
- [x] **Phase 2:** Auth (register/login/JWT)
- [ ] **Phase 3:** Save history, TF-IDF scoring, embeddings-based matching

---

## 💡 Tips

- Auth is **optional** for candidates analyzing a resume — they can use it without an account
- For production, replace `JWT_SECRET` with a long random string
- To use MongoDB Atlas: replace `MONGODB_URI` with your Atlas connection string
- Max file size: 5MB per resume (PDF or DOCX only)
