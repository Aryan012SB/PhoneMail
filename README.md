# PhoneMail - Phone Number Based Email Platform

PhoneMail is a modern, full-stack email platform where a user's **phone number acts directly as their primary email address** (e.g. `9876543210@phonemail.com`). PhoneMail bridges mobile messaging with traditional email by offering a **dual responsive UI**: a mobile-first interface inspired by **WhatsApp** and a desktop mail interface inspired by **Gmail**.

---

## 1. Project Overview

PhoneMail simplifies email communication by replacing long, hard-to-remember email addresses with phone numbers. Anyone can send an email to a phone number (e.g. `9123456789@phonemail.com`), and the system automatically delivers the message to the recipient's inbox while triggering an SMS notification.

### Key Highlights
- **Phone Number as Email ID**: Instant identity creation (`<phone_number>@phonemail.com`).
- **Responsive Dual Interface**: Automatic layout selection between WhatsApp Mobile Chat view and Gmail Desktop Mail view.
- **Full Database Persistence**: Every user action (Read/Unread, Starred, Trash, Archive, Important, Draft Edits, Permanent Deletion) is saved directly to the database and restored across sessions and page refreshes.
- **Provider Abstractions**: Plug-and-play architecture for OTP authentication, SMS delivery, and Toll-Free IVR voice call registration.

---

## 2. Features

- 📱 **Phone Email Identity**: Automatic account creation mapping `<phone>@phonemail.com`.
- 🔐 **OTP & Quick Auth**: SMS-based 6-digit OTP verification and 1-click Demo Login for fast testing.
- 💬 **WhatsApp Mobile View**: Mobile-first chat bubble interface with swipe-to-reply, message thread grouping, and instant filter chips (`All`, `Unread`, `Attachments`, `Starred`).
- ✉️ **Gmail Desktop View**: Classic 3-pane email layout with folder sidebar, searchable email stream, rich reading pane, attachment previews, and locked thread headers.
- 🗑️ **3-Dot Context Menus & Permanent Delete**: Dropdown menus for email actions with confirmation modal dialogs for permanent deletion.
- 📲 **SMS Notification Triggers**: Automatic SMS alerts sent to recipients when new emails arrive.
- 📞 **Toll-Free Voice / IVR Registration**: Webhook handler for account activation via inbound toll-free phone calls.
- 🏷️ **Alias Management**: Create and manage secondary email aliases pointing to the primary account.
- 🔄 **Live Sync & Persistence**: Automated background refresh synchronizing database state across active sessions.

---

## 3. Tech Stack

### Frontend
- **Framework**: React 18 (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Iconography**: Lucide React

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (TypeScript)
- **ORM**: Prisma ORM
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **File Uploads**: Multer (Attachment handling)

### Database
- **Local Dev / Testing**: SQLite (`dev.db`)
- **Production / Docker**: PostgreSQL 15

### Infrastructure & Tooling
- **Containerization**: Docker & Docker Compose
- **Scripting**: `tsx` test & seed execution

---

## 4. System Architecture

```
                  ┌───────────────────────────────────────────┐
                  │          Frontend (React + Vite)          │
                  │   WhatsApp Mobile UI  |  Gmail Desktop UI │
                  └─────────────────────┬─────────────────────┘
                                        │ REST API (JWT Bearer)
                  ┌─────────────────────▼─────────────────────┐
                  │        Backend API (Express / Node)       │
                  │ Auth  |  Email Routes  |  State Engine    │
                  └──────────┬──────────────────────┬─────────┘
                             │                      │
       ┌─────────────────────▼──────┐      ┌────────▼──────────────────┐
       │   Database (Prisma ORM)    │      │    Provider Layer         │
       │ Users | Emails | Folders   │      │ Mock Engine / Twilio API │
       └────────────────────────────┘      └───────────────────────────┘
```

### Decoupled Provider Layer
PhoneMail decouples external communications using clean interface abstractions:
- **`OtpProvider`**: `MockOtpProvider` (randomized 6-digit OTP generation) & `TwilioOtpProvider`.
- **`SmsProvider`**: `MockSmsProvider` (console logger) & `TwilioSmsProvider`.
- **`IvrProvider`**: `MockIvrProvider` (inbound toll-free call registration webhook) & `TwilioIvrProvider`.

---

## 5. Project / Folder Structure

```
phonemail/
├── apps/
│   ├── web/                         # React Frontend Application
│   │   ├── src/
│   │   │   ├── components/          # Layouts (Desktop, Mobile), Modals, Settings
│   │   │   ├── context/             # AuthContext, EmailContext, ThemeContext
│   │   │   ├── services/            # Central API Service Client (api.ts)
│   │   │   └── types/               # TypeScript interfaces
│   │   ├── Dockerfile
│   │   └── vite.config.ts
│   └── api/                         # Node/Express Backend API Service
│       ├── src/
│       │   ├── config/              # Environment parser & constants
│       │   ├── middleware/          # Auth & Rate limiting middleware
│       │   ├── providers/           # OTP, SMS, and IVR Abstractions
│       │   ├── routes/              # Auth, Email, User, and IVR route controllers
│       │   └── utils/               # Prisma client singleton instance
│       └── Dockerfile
├── prisma/
│   ├── schema.prisma                # Database schema models
│   └── seed.ts                      # Demo account and conversation seeder
├── scripts/
│   └── prepare-prisma.js            # Prisma schema builder script
├── test-suite.ts                    # Automated integration & persistence test suite
├── docker-compose.yml               # Container deployment setup
├── .env.example                     # Safe environment template
├── .gitignore                       # Version control exclusion rules
└── README.md                        # Documentation
```

---

## 6. How the Application Works

1. **Authentication Flow**:
   - The user enters their phone number on the login page.
   - The API generates a randomized 6-digit OTP, hashes it using bcrypt, and stores it in the database with a 10-minute expiration timer.
   - Upon valid OTP entry, the system returns a signed JWT token and automatically provisions the user account (`<phone_number>@phonemail.com`).

2. **Email Delivery & SMS Alerts**:
   - Sending an email resolves recipient phone numbers/email IDs to user records.
   - The message is persisted in the `Email` table, and individual `UserEmailFolder` state records are provisioned for all participants.
   - An SMS notification is triggered via the SMS provider layer to alert the recipient.

3. **State Persistence**:
   - Marking an email read, unread, favorite, spam, archived, or important sends a `PATCH /api/emails/:id/state` request to update the database.
   - Opening a thread sets `isRead: true` in `UserEmailFolder` and marks the recipient record status as `'SEEN'` with timestamp `readAt`.
   - Moving an email to Trash sets `isTrash: true`. Permanently deleting an email from Trash purges the database records when no other references remain.

---

## 7. Prerequisites

Before setting up PhoneMail, ensure you have installed:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: v2.30+
- **Docker & Docker Compose** *(Optional, for containerized execution)*

---

## 8. Environment Variables

Create a local `.env` file in the project root directory by copying the provided template:

```bash
cp .env.example .env
```

### Variable Reference

| Variable Name | Description | Default Value | Required |
|---|---|---|---|
| `PORT` | API server HTTP port | `5000` | Yes |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` | Yes |
| `DEV_MODE` | Development flag enabling debug responses | `true` | Yes |
| `JWT_SECRET` | Secret key for signing authentication tokens | *(Set secure secret)* | Yes |
| `DATABASE_URL` | Prisma database connection string | `"file:./dev.db"` | Yes |
| `DEFAULT_OTP_PROVIDER` | Selected OTP engine (`mock` or `twilio`) | `mock` | Yes |
| `DEFAULT_SMS_PROVIDER` | Selected SMS engine (`mock` or `twilio`) | `mock` | Yes |
| `DEFAULT_IVR_PROVIDER` | Selected IVR engine (`mock` or `twilio`) | `mock` | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `""` *(Optional)* | No |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `""` *(Optional)* | No |
| `TWILIO_PHONE_NUMBER` | Twilio Sender Phone Number | `""` *(Optional)* | No |
| `CLIENT_URL` | Frontend application URL for CORS | `http://localhost:3000` | Yes |

> ⚠️ **Security Warning**: Never commit your `.env` file or actual secret keys to version control.

---

## 9. Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Aryan012SB/PhoneMail.git
   cd PhoneMail
   ```

2. **Install root and workspace dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```

---

## 10. Database Setup

1. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Push Schema to SQLite Database**:
   ```bash
   npx prisma db push
   ```

3. **Seed Demo Accounts & Conversations**:
   ```bash
   npx tsx ./prisma/seed.ts
   ```

### Pre-Seeded Demo Accounts

| User Name | Phone Number | Email Address | Default Password |
|---|---|---|---|
| **Alex Rivera** | `9876543210` | `9876543210@phonemail.com` | `password123` |
| **Sarah Connor** | `9123456789` | `9123456789@phonemail.com` | `password123` |
| **David Miller** | `9998887776` | `9998887776@phonemail.com` | `password123` |

---

## 11. Backend Setup and Run

Start the Express API server in development mode:

```bash
npm --prefix apps/api run dev
```

The backend server will start at: `http://localhost:5000`
- **Health Check Endpoint**: `http://localhost:5000/api/health`

---

## 12. Frontend Setup and Run

Start the React web application in development mode:

```bash
npm --prefix apps/web run dev
```

The web application will open at: `http://localhost:3000`

---

## 13. API & Authentication Setup

All authenticated requests to the backend API require an `Authorization` header containing the JWT Bearer token:

```http
Authorization: Bearer <your_jwt_token>
```

### Core API Endpoints

- **Auth**:
  - `POST /api/auth/otp/request` - Request a 6-digit OTP for a phone number.
  - `POST /api/auth/otp/verify` - Verify OTP and receive JWT token.
  - `POST /api/auth/demo-login` - 1-click quick login for demo phone numbers.
  - `GET /api/auth/me` - Fetch authenticated user profile.
- **Emails & Conversations**:
  - `GET /api/emails` - Fetch user emails filtered by folder (`inbox`, `sent`, `drafts`, `trash`, `favorites`, `archive`, `important`).
  - `GET /api/emails/conversations` - Fetch user message threads.
  - `GET /api/emails/conversations/:id` - Fetch thread detail & mark messages as read/seen.
  - `POST /api/emails/send` - Send a new email or save/update a draft.
  - `POST /api/emails/:id/reply` - Reply to an email thread.
  - `PATCH /api/emails/:id/state` - Toggle email flags (`isRead`, `isFavorite`, `isSpam`, `isTrash`, `isArchived`, `isImportant`).
  - `DELETE /api/emails/:id` - Move email to Trash or permanently purge from DB (`?permanent=true`).
- **User & Aliases**:
  - `GET /api/users/aliases` - Fetch secondary email aliases.
  - `POST /api/users/aliases` - Create a new secondary alias.
  - `DELETE /api/users/aliases/:id` - Delete an alias.

---

## 14. Troubleshooting

- **Database Locked / Schema Out of Sync**:
  Run `npx prisma db push` to synchronize the SQLite database with your Prisma schema.
- **Port Conflicts**:
  If port `5000` or `3000` is in use, update the `PORT` or `CLIENT_URL` in your `.env` file.
- **Invalid OTP Code**:
  Ensure you enter the exact 6-digit code printed in the backend console during mock mode.
- **CORS Errors**:
  Verify `CLIENT_URL` in `.env` matches your browser URL (`http://localhost:3000`).

---

## 15. Security Notes

- **Environment File Protection**: `.env` and `.env.*` files are explicitly excluded from Git tracking via `.gitignore`.
- **Password & Token Security**: Passwords and OTP codes are hashed using `bcryptjs` with salt rounds. Session tokens are signed using JWT.
- **Database Safety**: SQL injection is prevented by Prisma ORM's parameterized query builder.
- **Input Sanitization**: Phone numbers and email inputs are normalized before processing.

---

## 🧪 Running Automated Tests

Run the integration and persistence test suite:

```bash
npm run test
```

Verifies OTP generation, account creation, duplicate prevention, internal delivery, SMS triggers, state persistence, SEEN status, draft updates, and permanent deletion.

---

## 📜 License

MIT License - Developed for the Buildathon.
