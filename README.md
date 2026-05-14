# SOS DIGITAL — Invoicing & Business Management

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)

> A full-stack, bilingual (FR/EN) invoicing and business management platform for digital freelancers and small businesses in Cameroon.

**Tech Stack:** React 18 (Vite) · Node.js/Express · PostgreSQL (Prisma ORM) · JWT Auth · Docker

---

## ✨ Features

### 🧾 Invoice Editor
- **6-tab form** — Company, Client, Details, Services, Notes, Design
- **Live A4 preview** — updates in real-time as you type
- **4 document templates** — Élégant, Classique, Moderne, Minimaliste
- **8 color palettes** — Bleu ciel, Violet, Émeraude, Orange, Rose, Brun, Ardoise, Or
- **6 font choices** — Inter, Arial, Georgia, Times New Roman, Courier New, Trebuchet MS
- **Custom watermark** — type (text/image), style, position, size & opacity sliders
- **Custom stamp** — image upload, size/opacity sliders, click-to-place on preview
- **Grouped service sections** with per-section subtotals
- **PDF export** — Classic & Modern templates

### 📊 Business Modules
- **Dashboard** — Revenue charts, KPIs, top clients, recent invoices
- **CRM** — Full client management (status: Active/Inactive/VIP)
- **Quotes** — Create, send, convert to invoice in one click
- **Catalog** — Reusable service items with quick-add to invoice
- **Payments** — Record partial/full payments (Virement, Mobile Money, etc.)
- **Reports** — Annual summary + filtered CSV export

### 🔐 Auth & Access Control
- JWT-based authentication
- 3 roles: **Admin**, **Sales**, **Accounting**
- Role-based route protection (frontend + backend)

### 🌐 Bilingual
- Full French / English UI toggle (persisted per session)
- Document language per invoice/quote (FR or EN)

### 💬 Chatbot
- Floating FAQ chatbot with quick-action chips
- Message count badge on floating button
- Bilingual responses

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or use Docker)

### 1. Clone & Install

```bash
git clone https://github.com/gdac-dev/sos-digital-invoicing.git
cd sos-digital-invoicing

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/sos_digital"
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="7d"
PORT=3001
ADMIN_NAME="Admin"
ADMIN_EMAIL="admin@sosdigital.cm"
ADMIN_PASSWORD="Admin@SOS2024"
```

### 3. Setup Database & Seed

```bash
cd server
node setup.js
```

This runs: Prisma generate → db push → seed (admin user + sample data)

### 4. Start Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

App available at **http://localhost:5173**

### Default Admin Credentials
| Field | Value |
|---|---|
| Email | `admin@sosdigital.cm` |
| Password | `Admin@SOS2024` |

---

## 🐳 Docker (Full Stack)

```bash
# At project root
docker-compose up --build
```

Services started:
- `db` — PostgreSQL 15
- `api` — Node.js/Express on port 3001
- `client` — Nginx serving React build on port 80

---

## ☁️ Deployment

### Frontend → Vercel
1. Import repo on [vercel.com/new](https://vercel.com/new)
2. Set **Root Directory** = `client`
3. Framework = **Vite**
4. Add env var: `VITE_API_URL=https://your-backend-url.com`
5. Deploy

### Backend → Railway
1. [railway.app](https://railway.app) → New Project → GitHub repo
2. Select `server` as root
3. Add PostgreSQL plugin
4. Set all env vars from `.env.example`
5. Deploy — copy the URL → paste into Vercel `VITE_API_URL`

---

## 📁 Project Structure

```
sos-digital-invoicing/
├── client/                   # React frontend (Vite)
│   ├── public/logo.jpeg      # Company logo + favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── chatbot/      # Floating chatbot widget
│   │   │   ├── invoices/     # InvoicePreview, EditorTabs, constants
│   │   │   └── layout/       # AppLayout, sidebar
│   │   ├── context/          # AuthContext, LangContext
│   │   ├── pages/            # All app pages
│   │   ├── translations/     # fr.json, en.json
│   │   └── utils/            # api.js, pdf.js, helpers.js
│   └── vercel.json
├── server/                   # Express backend
│   ├── prisma/
│   │   ├── schema.prisma     # Database models
│   │   └── seed.js           # Initial data seeding
│   ├── src/
│   │   ├── middleware/       # JWT auth middleware
│   │   ├── routes/           # invoices, clients, quotes, payments...
│   │   └── utils/            # email, cron jobs
│   ├── setup.js              # One-command DB setup
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## 📄 License

MIT — © 2025 SOS DIGITAL / GUEKOUE ARSENE
