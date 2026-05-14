# SOS DIGITAL — Invoicing & Business Management App

A full-stack bilingual (FR/EN) invoicing and receipt management web application.

**Tech Stack:** React (Vite) · Node.js/Express · PostgreSQL (Prisma) · JWT Auth

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally (or Docker)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Copy example env
cp server/.env.example server/.env
```

Edit `server/.env` and set your **actual** PostgreSQL password:

```env
DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/sos_digital"
```

> **Tip:** Find your password in pgAdmin → right-click server → Properties → Connection

### 3. Setup Database

```bash
cd server

# Create DB tables
npx prisma db push

# Seed with admin account + sample data
node prisma/seed.js
```

### 4. Start Development Servers

**Terminal 1 — API Server:**
```bash
cd server
npm run dev
# → Running on http://localhost:3001
```

**Terminal 2 — React Client:**
```bash
cd client
npm run dev
# → Running on http://localhost:5173
```

### 5. Login

Open http://localhost:5173 and log in with:

| Field | Value |
|---|---|
| Email | `admin@sosdigital.cm` |
| Password | `Admin@SOS2024` |

---

## 🐳 Docker Deployment

```bash
# Edit docker-compose.yml — update SMTP credentials
docker-compose up -d
```

App available at: `http://localhost:5173`

---

## 📁 Project Structure

```
SOS_Digital/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Route pages
│   │   ├── context/     # Auth + Lang context
│   │   ├── translations/ # fr.json / en.json
│   │   └── utils/       # API, PDF, helpers
│   └── ...
├── server/          # Node.js + Express backend
│   ├── prisma/      # DB schema + seed
│   └── src/
│       ├── routes/  # API endpoints
│       ├── middleware/ # Auth + roles
│       └── utils/   # Email + cron
└── docker-compose.yml
```

---

## 👥 User Roles

| Role | Permissions |
|---|---|
| `admin` | Full access, user management, reports |
| `sales` | Create/manage invoices, quotes, clients |
| `accounting` | View all, access reports, payment tracking |

---

## 🌐 Features

- ✅ Bilingual FR/EN with toggle in navbar
- ✅ Two invoice templates (Classic + Modern) with PDF export
- ✅ Quote management with one-click invoice conversion
- ✅ CRM: client profiles with status (Active/Inactive/VIP)
- ✅ Service catalog with quick-add to invoices
- ✅ Payment tracking with partial payment support
- ✅ Auto email reminders at Day 7 & 14 after due date
- ✅ Dashboard with revenue chart + top 5 clients
- ✅ Monthly/annual reports with CSV export
- ✅ WhatsApp share with pre-filled message
- ✅ Floating chatbot widget (bilingual FAQ)
- ✅ Role-based access control (Admin/Sales/Accounting)

---

## 📧 Email Setup (Nodemailer)

In `server/.env`, configure SMTP:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your@gmail.com"
SMTP_PASS="your_16char_app_password"  # Google App Password
```

For Gmail: Enable 2FA → Google Account → Security → App Passwords → Generate

---

## 📊 Database Schema

Main models: `User`, `Client`, `CatalogItem`, `Invoice`, `InvoiceItem`, `Quote`, `QuoteItem`, `Payment`, `EmailReminder`

See full schema: `server/prisma/schema.prisma`

---

## 🔒 Security

- JWT tokens (7-day expiry)
- bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting (200 req/15min, 20 auth/15min)
- CORS restricted to frontend origin
- Input validation on all routes

---

## 📱 WhatsApp Integration

Pre-filled message sends to **+237 653 522 435**:

- FR: *"Bonjour, veuillez trouver ci-joint votre facture SOS DIGITAL #XXXX."*
- EN: *"Hello, please find attached your SOS DIGITAL invoice #XXXX."*

---

## 🔧 Troubleshooting

**Prisma client not initialized:**
```bash
cd server && npx prisma generate
```

**Database connection failed:**
- Check PostgreSQL is running
- Verify `DATABASE_URL` password in `server/.env`
- Create DB manually: `createdb -U postgres sos_digital`

**Port already in use:**
- Client: change `PORT` in `vite.config.js`
- Server: change `PORT` in `server/.env`
