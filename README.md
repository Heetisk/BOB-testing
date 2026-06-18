# AccountGuard AI - Identity Trust Framework

An AI-powered Account Takeover Detection System that combines rule-based heuristics with machine learning to detect and prevent unauthorized account access in real-time.

## Problem Statement

Account takeover (ATO) attacks are one of the most prevalent forms of fraud, causing billions in losses annually. Traditional security measures like passwords alone are insufficient against sophisticated attacks including credential stuffing, SIM swapping, and social engineering.

**AccountGuard AI** solves this by implementing a multi-layered defense system that analyzes device fingerprints, location patterns, behavioral signals, and transaction context to score every login and transaction for risk - before damage occurs.

## Live Demo

The system includes a **Traffic Simulator** that generates realistic user activities in real-time, running each event through the actual risk engine. Watch as logins and transactions are analyzed, risk scores are calculated, and alerts are automatically created for suspicious activity.

### Demo Flow

1. Login as admin (`admin@example.com` / `admin123`)
2. Navigate to **Simulator** in the sidebar
3. Click **Start Simulation** - watch live events flow with real risk scoring
4. Check **Dashboard** - alerts and stats update in real-time
5. Check **Alerts** - see auto-generated alerts for high-risk events
6. Check **Cases** - see fraud cases created for critical events
7. Try registering a new account from the login page
8. Login as customer (`jyot@example.com` / `password123`) - see personal dashboard

### Simulation Scenarios

| Scenario | Risk Level | What Happens |
|----------|------------|--------------|
| Normal login from known device | Low | Known device + usual city = safe |
| Login from new city | Medium | Triggers location mismatch detection |
| Login at 3am from different city | High | Night login + new location = suspicious |
| Impossible travel (2 cities in 1 hour) | High | Rapid location changes = fraud signal |
| Multiple failed login attempts | High | Brute force detection kicks in |
| Large transaction to new beneficiary | Medium/High | Amount threshold + new payee |
| Rapid transactions (5 in 2 minutes) | High | Velocity check triggers |
| Small transaction to known beneficiary | Low | Normal pattern = approved |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│   (Dark OLED Theme | IBM Plex Sans | Amber/Violet)      │
│   (Real-time SSE | Traffic Simulator | Charts)           │
├─────────────────────────────────────────────────────────┤
│                   Vite Dev Server                        │
│                  (Port 5173)                              │
│                    ↕ proxy                                │
├─────────────────────────────────────────────────────────┤
│                  FastAPI Backend                          │
│               (Port 8000)                                 │
├──────────┬──────────┬──────────┬────────────────────────┤
│  Auth    │   Risk   │  Fraud   │  Simulator             │
│  Service │  Engine  │  Engine  │  (SSE + Background)    │
├──────────┴──────────┴──────────┴────────────────────────┤
│          SQLAlchemy 2.0 Async + SQLite                   │
├─────────────────────────────────────────────────────────┤
│   scikit-learn (RandomForest) │  Rule Engine            │
│   93.4% accuracy              │  Explainable scoring    │
└─────────────────────────────────────────────────────────┘
```

## Features

### Identity & Trust
- **Device Fingerprinting** - Track and trust known devices per user
- **Location Intelligence** - Detect impossible travel and geo-anomalies
- **Session Validation** - Real-time session integrity checks
- **Risk Scoring** - Hybrid rule-based + ML scoring (0-100)

### Fraud Detection
- **Login Risk Analysis** - Score every authentication attempt
- **Transaction Monitoring** - Flag suspicious financial activity
- **Real-time Alerts** - Instant notifications for high-risk events
- **Fraud Case Management** - Investigate and resolve flagged activity

### Traffic Simulator
- **Real-time Event Generation** - Live login and transaction events
- **Actual Risk Engine** - Every event runs through the real RiskService
- **SSE Streaming** - Server-Sent Events for live frontend updates
- **Configurable Speed** - Fast (0.5s) to Slow (3s) between events
- **9 Scenarios** - Mix of normal, suspicious, and fraudulent patterns

### Compliance & Privacy
- **KYC Verification** - Document verification with fraud signals
- **Audit Logging** - Privileged access monitoring (every admin action)
- **Data Masking** - PII protection with selective masking
- **Consent Management** - GDPR/DPDPA compliant consent tracking
- **Step-up Verification** - OTP-based MFA for high-risk actions

### User Management
- **Registration** - New user signup with city selection
- **Role-based Access** - Customer, Admin, Fraud Team views
- **Customer Dashboard** - Personal risk score, devices, transactions
- **Admin Dashboard** - System-wide stats, charts, trends

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Recharts, Lucide Icons |
| Backend | Python 3.12+, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| ML | scikit-learn (RandomForest), 93.4% accuracy on synthetic data |
| Database | SQLite (async via aiosqlite) |
| Auth | JWT (PyJWT) + bcrypt password hashing |
| Real-time | Server-Sent Events (SSE) for live simulation feed |
| Design | Dark OLED theme, IBM Plex Sans, Amber (#F59E0B) / Violet (#8B5CF6) |

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Seed demo data
python -m app.seed.seed

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### Access

- **Frontend:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs
- **Backend:** http://localhost:8000

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | jyot@example.com | password123 |
| Customer | rahul@example.com | password123 |
| Customer | priya@example.com | password123 |
| Admin | admin@example.com | admin123 |
| Fraud Analyst | fraud@example.com | fraud123 |

Or **register a new account** from the login page.

## API Endpoints (50+ total)

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with risk analysis
- `GET /api/v1/auth/me` - Get current user

### Simulation
- `POST /api/v1/simulation/start` - Start traffic simulation
- `POST /api/v1/simulation/stop` - Stop simulation
- `GET /api/v1/simulation/status` - Get simulation status
- `GET /api/v1/simulation/stream` - SSE event stream

### Risk Analysis
- `POST /api/v1/risk/analyze-login` - Analyze login risk
- `POST /api/v1/risk/analyze-transaction` - Analyze transaction risk

### Dashboard
- `GET /api/v1/dashboard/summary` - Admin dashboard stats
- `GET /api/v1/dashboard/risk-distribution` - Risk level breakdown
- `GET /api/v1/dashboard/fraud-reasons` - Top fraud alert types
- `GET /api/v1/dashboard/login-trends` - Login attempt trends
- `GET /api/v1/dashboard/customer/summary` - Customer own stats
- `GET /api/v1/dashboard/customer/recent-logins` - Customer login history
- `GET /api/v1/dashboard/customer/recent-transactions` - Customer transactions
- `GET /api/v1/dashboard/customer/devices` - Customer devices
- `GET /api/v1/dashboard/customer/alerts` - Customer alerts

### Transactions
- `GET /api/v1/transactions/` - List transactions
- `POST /api/v1/transactions/` - Create transaction (with risk scoring)

### Alerts
- `GET /api/v1/alerts/` - List alerts
- `PUT /api/v1/alerts/{id}/status` - Update alert status

### Fraud Cases
- `GET /api/v1/cases/` - List fraud cases
- `PUT /api/v1/cases/{id}/status` - Update case status

### KYC
- `GET /api/v1/kyc/{user_id}` - KYC status
- `POST /api/v1/kyc/` - Submit KYC document

### Audit
- `GET /api/v1/audit/` - Audit logs (admin)

### Verification
- `POST /api/v1/verification/request` - Request OTP
- `POST /api/v1/verification/verify` - Verify OTP
- `GET /api/v1/verification/history` - Verification history

### Privacy
- `GET /api/v1/privacy/consent/{user_id}` - Get consents
- `POST /api/v1/privacy/consent` - Record consent
- `GET /api/v1/privacy/mask/{user_id}` - Masked user data

## ML Risk Engine

### Hybrid Scoring (60% Rules / 40% ML)

**Rule-based factors:**
- New device detection (+25 risk)
- Impossible travel detection (+30 risk)
- Unusual login time (+10 risk)
- Multiple failed attempts (+20 risk)
- Location mismatch (+15 risk)
- High transaction amount (+25 risk)
- New beneficiary (+20 risk)

**ML model:**
- RandomForest classifier trained on synthetic login data
- Features: hour, is_new_device, is_new_location, failed_attempts, distance_km, risk_score
- Accuracy: 93.4% on test set
- Graceful fallback to rule-based when model not available

### Risk Levels
| Score | Level | Action |
|-------|-------|--------|
| 0-30 | Low | Allow |
| 31-70 | Medium | Step-up verification |
| 71-100 | High | Block + Alert + Fraud Case |

## Project Structure

```
Bob testing/
├── backend/
│   ├── main.py                        # FastAPI app factory
│   ├── requirements.txt
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              # Pydantic Settings
│   │   │   ├── database.py            # Async SQLAlchemy + auto-commit
│   │   │   └── security.py            # JWT + bcrypt
│   │   ├── models/                    # 13 SQLAlchemy models
│   │   ├── schemas/                   # Pydantic request/response
│   │   ├── api/
│   │   │   ├── v1/router.py           # All route modules
│   │   │   ├── v1/routes/             # 13 route modules
│   │   │   └── dependencies.py        # Auth + RBAC
│   │   ├── services/                  # 14 business logic services
│   │   │   ├── risk_service.py        # Core risk engine
│   │   │   ├── simulator_service.py   # Traffic generation
│   │   │   └── ...
│   │   ├── ml/
│   │   │   ├── risk_rules.py          # Rule-based scoring
│   │   │   ├── feature_engineering.py
│   │   │   ├── train_model.py         # RandomForest training
│   │   │   └── predict.py             # ML prediction + fallback
│   │   └── seed/seed.py               # Demo data seeder
│   └── tests/                         # 35 tests (unit + integration)
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js                 # Dev server + API proxy
│   └── src/
│       ├── main.jsx                   # Entry + BrowserRouter
│       ├── AppRoutes.jsx              # Protected routes + role routing
│       ├── index.css                  # Tailwind + design system
│       ├── api/                       # API client layer (8 files)
│       ├── context/AuthContext.jsx     # JWT auth + register
│       ├── components/                # 8 reusable components
│       ├── charts/                    # 3 Recharts components
│       ├── pages/                     # 13 pages
│       │   ├── LoginPage.jsx          # Login with city selector
│       │   ├── RegisterPage.jsx       # New user registration
│       │   ├── SimulationPage.jsx     # Live traffic simulator
│       │   ├── AdminDashboard.jsx     # System-wide admin view
│       │   ├── CustomerDashboard.jsx  # Personal customer view
│       │   └── ...
│       └── utils/                     # Constants + helpers
└── README.md
```

## Database Schema (13 Tables)

| Table | Purpose |
|-------|---------|
| users | User accounts with roles and usual city |
| devices | Trusted device fingerprints |
| login_events | Every login with risk data |
| transactions | Financial transactions with risk scores |
| alerts | Auto-generated security alerts |
| fraud_cases | Investigation cases for high-risk events |
| kyc_verifications | KYC document submissions |
| password_resets | Password reset tokens |
| audit_logs | Privileged access monitoring |
| session_events | Session lifecycle events |
| verification_requests | MFA/OTP requests |
| consent_records | User consent tracking |
| data_access_logs | PII access audit trail |

## Testing

```bash
cd backend

# Run all tests
python -m pytest tests/ -v

# Run unit tests only
python -m pytest tests/unit/ -v

# Run integration tests only
python -m pytest tests/integration/ -v
```

**35 tests** covering:
- Authentication & authorization
- Risk scoring accuracy
- Transaction fraud detection
- Alert & case management
- KYC verification
- Privacy & data masking
- Session validation
- OTP verification

## Design System

- **Theme:** Dark Mode OLED (#0F172A background)
- **Font:** IBM Plex Sans
- **Primary:** Amber (#F59E0B)
- **Secondary:** Violet (#8B5CF6)
- **Success:** Emerald (#10B981)
- **Warning:** Amber (#F59E0B)
- **Danger:** Red (#EF4444)
- **Info:** Blue (#3B82F6)
- **Cards:** Rounded 2xl, subtle shadows, hover elevation
- **Buttons:** Gradient backgrounds with shadow glow
- **Tables:** Alternating rows, sticky headers, uppercase labels
- **Forms:** Focus rings, rounded inputs, proper spacing

## License

MIT
