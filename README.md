# PhoneMail - Phone Number Based Email Platform

PhoneMail is a modern full-stack email platform where a user's **phone number acts directly as their email ID** (e.g. `9876543210@phonemail.com`). It provides two responsive user experiences: a **mobile-first interface inspired by WhatsApp** and a **desktop web interface inspired by Gmail**.

---

## 🚀 Quick Start (Docker)

```bash
docker compose up -d
```

Access the applications in your browser:
- **Web App Interface (Frontend):** `http://localhost:3000`
- **Backend API Service:** `http://localhost:5000/api/health`

---

## 🔑 Demo Test Accounts (Pre-Seeded)

The database comes pre-seeded with rich sample conversations and demo accounts:

| User Name | Phone Number | Email Address | Default Password | Quick Login Code (DEV) |
|---|---|---|---|---|
| **Alex Rivera** | `9876543210` | `9876543210@phonemail.com` | `password123` | `123456` |
| **Sarah Connor** | `9123456789` | `9123456789@phonemail.com` | `password123` | `123456` |
| **David Miller** | `9998887776` | `9998887776@phonemail.com` | `password123` | `123456` |

---

## 📐 Architecture Overview

PhoneMail employs a clean modular full-stack architecture:

```
                  ┌─────────────────────────────────────┐
                  │       Frontend (React + Vite)        │
                  │   WhatsApp Mobile & Gmail Desktop   │
                  └──────────────────┬──────────────────┘
                                     │ REST / API
                  ┌──────────────────▼──────────────────┐
                  │      Backend API (Node/Express)     │
                  │  Auth | Emails | Provider Engine    │
                  └─────────┬───────────┬───────────────┘
                            │           │
       ┌────────────────────▼──┐     ┌──▼──────────────────┐
       │ PostgreSQL (Prisma)   │     │ Provider Layer      │
       │ Users | Emails | OTPs │     │ Mock / Twilio       │
       └───────────────────────┘     └─────────────────────┘
```

### Provider Architecture Abstractions
PhoneMail decouples external services using clean provider interfaces:
- **`OtpProvider`**: `MockOtpProvider` (default) & `TwilioOtpProvider`.
- **`SmsProvider`**: `MockSmsProvider` (logs SMS to console) & `TwilioSmsProvider`.
- **`IvrProvider`**: `MockIvrProvider` (toll-free IVR inbound call handler) & `TwilioIvrProvider`.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT, bcryptjs, Multer
- **Database:** PostgreSQL 15
- **Containerization:** Docker, Docker Compose, Nginx

---

## 📂 Folder Structure

```
phonemail/
├── apps/
│   ├── web/                     # React Frontend (WhatsApp & Gmail UIs)
│   │   ├── src/
│   │   │   ├── components/      # Auth, Mobile & Desktop Views, Modals
│   │   │   ├── context/         # AuthContext, EmailContext
│   │   │   └── services/        # Centralized API service
│   │   ├── Dockerfile
│   │   └── vite.config.ts
│   └── api/                     # Node/Express Backend API
│       ├── src/
│       │   ├── config/          # Environment configuration
│       │   ├── middleware/      # Auth & Rate Limiting
│       │   ├── providers/       # OTP, SMS, IVR Abstractions
│       │   ├── routes/          # Express route controllers
│       │   └── utils/           # Prisma client instance
│       └── Dockerfile
├── prisma/
│   ├── schema.prisma            # PostgreSQL Data Models
│   └── seed.ts                  # Seed script for demo accounts & emails
├── docker-compose.yml           # Full-stack orchestrator
├── test-suite.ts                # Integration test runner
├── .env.example
└── README.md
```

---

## 🔧 Environment Variables (`.env`)

```ini
PORT=5000
NODE_ENV=development
DEV_MODE=true
JWT_SECRET=phonemail_secure_jwt_secret_key_2026_hackathon

DATABASE_URL="postgresql://phonemail:phonemailpass@localhost:5432/phonemail?schema=public"

# Provider Selections: mock | twilio
DEFAULT_OTP_PROVIDER=mock
DEFAULT_SMS_PROVIDER=mock
DEFAULT_IVR_PROVIDER=mock

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## 📲 Key Features

1. **Phone Number Email ID:** Auto-generates `<phone_number>@phonemail.com` upon OTP or Web signup.
2. **Responsive Dual Interface:**
   - **WhatsApp Mobile View:** Chat bubbles, swipe & reply thread grouping, filter chips (`All`, `Unread`, `Attachments`, `Starred`).
   - **Gmail Desktop View:** Gmail sidebar, reading pane, attachment previews, locked To/CC reply fields.
3. **SMS Notifications:** Triggers SMS notifications whenever an email arrives: `"You have received an email from <Sender>. Subject: <Subject>."`
4. **Toll-Free / IVR Account Registration:** Includes webhook integration for inbound calls (`MockIvrProvider`).
5. **Alias IDs:** Manage secondary email aliases pointing to the primary account.

---

## 🧪 Running Automated Tests

Run the integration test suite:

```bash
npm run test
```

This verifies:
- OTP generation & hashing
- Account creation & email generation
- Duplicate phone prevention
- Internal email delivery & conversation threading
- SMS notification triggers
- IVR call webhook handling

---

## 📜 License

MIT License - Developed for the Buildathon.
