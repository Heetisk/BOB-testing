# Reference.md — AccountGuard AI Codebase Guide

For senior devs who need to understand, maintain, or scale this project without reading every file.

---

## Architecture at a Glance

```
Request Flow (Production):
  Browser → Vercel SPA (/) ──────────────────────────────────────────────┐
            Vercel API Proxy (/api → bob-testing.onrender.com)           │
                ↓                                                        │
            FastAPI (Render) → Route → Service → Model → PostgreSQL (Render)
                                        ↓
                                  RiskService (ML + Rules)
                                        ↓
                                  AlertService / CaseService

Request Flow (Local Development):
  Browser → Vite Dev Server (localhost:5173)
            Vite API Proxy (/api → localhost:8000)
                ↓
            FastAPI → Route → Service → Model → SQLite (accountguard.db)

Real-time Flow (Simulator):
  SimulatorService → RiskService → DB (persisted) → Frontend polls (5s interval)
                                        ↓
                                  SSE Queue → EventSource (fallback: polling)
```

**Key Principle:** Routes are thin. Services contain business logic. Models are pure data. ML is isolated.

**Deployment:** Vercel (frontend) + Render (backend + PostgreSQL). Vercel proxies `/api` to Render via `vercel.json` rewrites. Render builds with `pip install` + ML model training, seeds DB at startup.

---

## Backend File Map

### Entry & Config
| File | Purpose | What to modify |
|------|---------|----------------|
| `backend/main.py` | App factory, CORS, lifespan (DB init + seed on startup), route registration. **Health check:** `@app.api_route("/health", methods=["GET", "HEAD"])` — Render sends HEAD for health checks | Change CORS origins, add middleware, mount static files |
| `backend/app/core/config.py` | Pydantic Settings — loads from `.env`, cached singleton | Add new env vars here |
| `backend/app/core/database.py` | Async SQLAlchemy engine, session factory, `get_db()` with auto-commit, `init_db()`. **URL rewrite:** `postgresql://` → `postgresql+asyncpg://` (asyncpg driver required). **PostgreSQL constraint:** `timestamp without time zone` — all datetimes must be naive (`datetime.utcnow()`) | Change DB URL, pool settings, add migration support |
| `backend/app/core/security.py` | JWT create/decode, bcrypt hash/verify | Change token expiry, add refresh tokens |

### Adding a New Feature (End-to-End)

```
1. Model:      backend/app/models/your_model.py        → Define table
2. Schema:     backend/app/schemas/your_schema.py       → Request/Response shapes
3. Service:    backend/app/services/your_service.py     → Business logic
4. Route:      backend/app/api/v1/routes/your_route.py  → HTTP handlers
5. Register:   backend/app/api/v1/router.py             → include_router()
6. Frontend:   frontend/src/api/yourApi.js              → API client
7. Page:       frontend/src/pages/YourPage.jsx          → UI component
8. Route:      frontend/src/AppRoutes.jsx               → Add <Route>
```

### Models (13 tables)
| Model | Table | Key Fields | Relationships |
|-------|-------|------------|---------------|
| `user.py` | users | user_id, email, password_hash, role, usual_city, usual_device | → devices, login_events, transactions, alerts, fraud_cases |
| `device.py` | devices | device_id, user_id, device_name, browser, os, is_trusted | → user |
| `login_event.py` | login_events | user_id, ip, city, device_id, risk_score, risk_level, is_new_device, is_new_location | → user |
| `transaction.py` | transactions | user_id, amount, beneficiary_id, city, risk_score, status | → user |
| `alert.py` | alerts | user_id, alert_type, risk_level, message, status | → user, fraud_case (1:1) |
| `fraud_case.py` | fraud_cases | alert_id (FK), user_id, risk_score, case_status, admin_notes | → alert |
| `kyc_verification.py` | kyc_verifications | user_id, document_type, document_hash, status, risk_score | → user |
| `password_reset.py` | password_resets | user_id, token_hash, device_id, city, risk_score | → user |
| `audit_log.py` | audit_logs | user_id, action, resource_type, risk_score, ip_address | — |
| `session_event.py` | session_events | user_id, session_token, event_type, city, risk_score, is_suspicious | — |
| `verification_request.py` | verification_requests | user_id, code_hash, verification_type, is_verified | — |
| `privacy.py` | consent_records + data_access_logs | consent_type, is_granted / action, resource_type | — |

### Services (14 services)
| Service | File | What it does | Used by |
|---------|------|--------------|---------|
| `AuthService` | `auth_service.py` | User lookup, password verify, JWT create, user create | Auth routes, all protected routes |
| `RiskService` | `risk_service.py` | **Core engine.** Orchestrates device+location+ML analysis. Creates LoginEvent, Alert, FraudCase. **Note:** DB queries are sequential (not parallel) — asyncpg doesn't support nested transactions on same session | Auth routes, transaction routes, simulator |
| `DeviceService` | `device_service.py` | is_new_device(), is_trusted_device(), save_device() | RiskService, recovery |
| `LocationService` | `location_service.py` | is_new_location(), is_impossible_travel(), get_last_login() | RiskService, recovery |
| `TransactionService` | `transaction_service.py` | Create transactions, check new_beneficiary, high_amount | RiskService, transaction routes |
| `AlertService` | `alert_service.py` | Create/retrieve/update alerts | RiskService, alert routes |
| `CaseService` | `case_service.py` | Create/retrieve/update fraud cases | RiskService, case routes |
| `KycService` | `kyc_service.py` | KYC submission with duplicate doc detection, risk scoring | KYC routes |
| `RecoveryService` | `recovery_service.py` | Password reset with risk analysis | Recovery routes |
| `AuditService` | `audit_service.py` | Log admin actions, detect suspicious patterns | Audit routes |
| `SessionService` | `session_service.py` | Track session events, validate session integrity | Session routes |
| `VerificationService` | `verification_service.py` | Generate/verify OTP codes with attempt limiting | Verification routes |
| `PrivacyService` | `privacy_service.py` | PII masking, consent management, data anonymization | Privacy routes |
| `SimulatorService` | `simulator_service.py` | Generate realistic traffic, run through RiskService, broadcast via SSE | Simulation routes |

### Risk Scoring Pipeline

```
Login Request
    ↓
RiskService.analyze_login_risk()
    ├── DeviceService.is_new_device()        → +25 risk
    ├── LocationService.is_new_location()    → +20 risk
    ├── LocationService.is_impossible_travel() → +30 risk
    ├── Night login check (hour < 6 or >= 22) → +10 risk
    ├── Failed attempts count                 → +5 per attempt (max 20)
    ├── Rule-based score (RiskFactors)        → 0-100
    ├── ML prediction (FraudPredictor)        → 0-100
    └── Combined: rules * 0.6 + ml * 0.4     → Final score
                                              → Level: Low(≤30) / Medium(≤70) / High(>70)
                                              → Action: Allow / Step-up / Block+Alert
                                              → Saves LoginEvent, Device, Alert, FraudCase
```

### ML Module
| File | Purpose |
|------|---------|
| `ml/risk_rules.py` | Rule-based scoring with weighted factors. **Shared helpers:** `get_risk_level()`, `get_recommended_action()`, `get_risk_level_and_action()`, `is_unusual_hour()`. Used by all services and ML module |
| `ml/feature_engineering.py` | Converts raw data → numerical feature vectors for ML model. Uses `is_unusual_hour()` from risk_rules |
| `ml/predict.py` | Loads trained RandomForest, predicts fraud probability. Falls back to rules if model missing. Uses `is_unusual_hour()` from risk_rules |
| `ml/train_model.py` | Generates 5000 synthetic samples, trains RandomForest (93.4% acc), saves to disk |

**ML weights:** `new_device=25`, `new_location=20`, `impossible_travel=30`, `night_login=10`, `high_amount=25`, `new_beneficiary=20`, `failed_attempts=5 each (cap 20)`

### Routes (13 modules, 50+ endpoints)
| Module | Prefix | Key Endpoints | Auth |
|--------|--------|---------------|------|
| `auth.py` | /auth | login, register, me | Public + JWT |
| `risk.py` | /risk | analyze-login, analyze-transaction | JWT |
| `dashboard.py` | /dashboard | summary, risk-distribution, fraud-reasons, login-trends, customer/* | Admin + JWT |
| `transactions.py` | /transactions | list, create, detail | JWT |
| `alerts.py` | /alerts | list, create, update-status | Admin |
| `cases.py` | /cases | list, create, update-status | Admin |
| `kyc.py` | /kyc | submit, user/{id}, suspicious, update | Admin |
| `recovery.py` | /auth | forgot-password, reset-password, history | Public + JWT |
| `audit.py` | /audit | logs, user/{id}, create, suspicious | Admin |
| `session.py` | /session | track, user/{id}, validate | JWT |
| `verification.py` | /verification | request, verify, history | JWT |
| `privacy.py` | /privacy | consent, mask/{id}, access-log, anonymize | Admin |
| `simulation.py` | /simulation | start, stop, status, stream (SSE) | Admin |

### Auth Dependencies
```python
get_current_user()    → Extracts user from JWT (any authenticated user)
require_admin()       → Requires role in ["admin", "fraud_team"] — used by most admin routes
require_fraud_team()  → Same as require_admin — defined for future use
require_role(roles)   → Factory for custom role checks — defined for future use
```

---

## Frontend File Map

### Entry & Routing
| File | Purpose |
|------|---------|
| `src/main.jsx` | Mounts React with BrowserRouter + AuthProvider |
| `src/App.jsx` | Renders AppRoutes |
| `src/AppRoutes.jsx` | **Central routing.** Defines ProtectedRoute/PublicRoute wrappers, role-based DashboardRouter, all 15 routes |
| `src/index.css` | Tailwind imports + custom theme (colors, fonts, scrollbar, focus rings) |

### API Layer
| File | Endpoints | Used by |
|------|-----------|---------|
| `api/apiClient.js` | Axios instance with JWT injection + 401 redirect | All API modules |
| `api/authApi.js` | loginUser, getCurrentUser, registerUser | AuthContext |
| `api/dashboardApi.js` | Admin: summary, risk-distribution, fraud-reasons, login-trends. Customer: summary, recent-logins, recent-transactions, devices, alerts | Dashboards |
| `api/simulationApi.js` | start, stop, status, subscribe (SSE) | SimulationPage |
| `api/riskApi.js` | analyzeLoginRisk, analyzeTransactionRisk | RiskAnalysisPage |
| `api/transactionApi.js` | getTransactions, createTransaction | TransactionsPage |
| `api/alertApi.js` | getAlerts, updateAlertStatus | AlertsPage |
| `api/featuresApi.js` | getKycStatus, submitKyc, getAuditLogs | KycPage, AuditPage |

### Components
| Component | Props | Used by |
|-----------|-------|---------|
| `Navbar` | None (uses useAuth) | AppRoutes |
| `Sidebar` | None (uses useAuth + NAV_ITEMS) | AppRoutes |
| `Loader` | size, text | All pages |
| `StatCard` | title, value, icon, color, trend | AdminDashboard, CustomerDashboard |
| `RiskBadge` | level, size | All data tables |
| `RiskScoreCard` | score, level, reasons | CustomerDashboard, RiskAnalysisPage |
| `AlertCard` | alert | CustomerDashboard, AlertsPage |

### Pages
| Page | Route | What it shows |
|------|-------|---------------|
| `LoginPage` | /login | Email/password, city selector, demo hints, register link |
| `RegisterPage` | /register | Name, email, password, phone, city |
| `AdminDashboard` | /dashboard | 7 stat cards, 3 charts (risk dist, fraud reasons, login trends) |
| `CustomerDashboard` | /dashboard | Risk score, 5 stats, alerts, recent logins/transactions, devices |
| `RiskAnalysisPage` | /risk-analysis | Form to test login risk, results display |
| `TransactionsPage` | /transactions | Create form, transaction table with risk/status |
| `AlertsPage` | /alerts | Filter buttons, alert card list |
| `CasesPage` | /cases | Fraud case table |
| `KycPage` | /kyc | Submit form, KYC status display |
| `AuditPage` | /audit | Audit log table |
| `VerificationPage` | /verification | OTP request/verify, history |
| `PrivacyPage` | /privacy | Masked data, consent toggles |
| `SimulationPage` | /simulation | Start/stop, speed, live event feed |
| `NotFoundPage` | * | 404 page |

### Charts
| Chart | Type | Data Source |
|-------|------|-------------|
| `RiskDistributionChart` | Donut/Pie | `/dashboard/risk-distribution` |
| `FraudReasonChart` | Horizontal Bar | `/dashboard/fraud-reasons` |
| `LoginTrendChart` | Area | `/dashboard/login-trends` |

### State Management
- **Auth:** React Context (`AuthContext`) — user, token, login/register/logout
- **No global state library** — each page manages its own data with `useState` + `useEffect`
- **Real-time:** SSE via `EventSource` in SimulationPage (with polling fallback)
- **Auto-refresh:** AdminDashboard, CustomerDashboard, TransactionsPage, AlertsPage, CasesPage poll every 5 seconds via `setInterval`

### Frontend Gotchas
- **Tailwind v4:** Do NOT add `* { padding: 0 }` in `index.css` — it kills ALL Tailwind padding utilities (`px-*`, `py-*`, `p-*`). Use reset only on specific elements.
- **Vercel SSE buffering:** Vercel proxies buffer SSE responses, breaking `EventSource`. SimulationPage falls back to polling (2.5s interval) when SSE fails.
- **Dashboard Promise.all:** Use `Promise.allSettled` instead of `Promise.all` for parallel API calls — partial failures don't kill the entire page.
- **Container padding:** Main content area uses `px-5 sm:px-8 lg:px-10` for adequate spacing.

---

## Simulator Architecture

```
SimulationPage
    ├── Start Button → POST /simulation/start → asyncio.create_task(_run())
    │                                            ↓
    │                                       _run() loop
    │                                            ↓
    │                                       _generate_event() → _generate_login() / _generate_transaction()
    │                                            ↓
    │                                   AsyncSessionLocal() (standalone, not FastAPI Depends)
    │                                            ↓
    │                                   RiskService(db).analyze_login_risk() / analyze_transaction_risk()
    │                                            ↓
    │                                   Persisted to DB (LoginEvent + Transaction + Alert + FraudCase)
    │                                            ↓
    │                                   SimulationEvent created → broadcast() → Queue → SSE stream
    │                                            ↓
    │                                   Frontend polls every 5s (SSE as fallback via Vercel)
    │                                            ↓
    └── EventSource(/simulation/stream) ← Frontend receives event → updates UI
```

**9 Scenarios:** normal_login, new_city_login, night_login, impossible_travel, failed_attempts, large_transaction, rapid_transactions, normal_transaction, suspicious_beneficiary

**DB Persistence:** Simulator transactions are now persisted to the database via `TransactionService.create_transaction()`, not just in-memory. Alerts and fraud cases are also persisted. Data survives server restarts.

---

## Key Patterns

### Adding a New API Endpoint
1. Create schema in `app/schemas/`
2. Add service method in `app/services/`
3. Add route in `app/api/v1/routes/`
4. Register in `app/api/v1/router.py`
5. Add frontend API function in `frontend/src/api/`
6. Use in page component

### Adding a New Database Column
1. Add to model in `app/models/`
2. Update schema in `app/schemas/`
3. Delete `accountguard.db` and re-seed (or add migration)
4. Update any service that reads/writes this field

### Adding a New Risk Factor
1. Add weight to `RISK_WEIGHTS` in `app/ml/risk_rules.py`
2. Add factor to `RiskFactors` dataclass
3. Update `calculate_risk_score()` logic
4. Update `RiskService` to populate the new factor
5. Retrain ML model: `python -m app.ml.train_model`

### Adding a New Page
1. Create in `frontend/src/pages/`
2. Add API functions in `frontend/src/api/`
3. Add route in `AppRoutes.jsx`
4. Add nav item in `constants.js` (NAV_ITEMS or CUSTOMER_NAV_ITEMS)
5. Add icon mapping in `Sidebar.jsx` if new icon

### Shared Helpers (risk_rules.py)
Services reuse these instead of duplicating logic:
- `get_risk_level(score)` → "Low" / "Medium" / "High"
- `get_recommended_action(level)` → action string
- `get_risk_level_and_action(score)` → (level, action) tuple — use this for new services
- `is_unusual_hour(hour)` → True if hour < 6 or >= 22

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_NAME` | AccountGuard AI | Application name |
| `DATABASE_URL` | sqlite+aiosqlite:///./accountguard.db | Database connection. On Render: `postgresql://...` (auto-rewritten to `postgresql+asyncpg://`) |
| `JWT_SECRET_KEY` | (change in production) | JWT signing secret |
| `JWT_ALGORITHM` | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | Token expiry |
| `CORS_ORIGINS` | ["http://localhost:5173"] | Allowed origins. On Render: `["https://accountguard-ai.vercel.app"]` |
| `ML_MODEL_PATH` | app/ml/model/model.pkl | Trained model path |
| `ML_SCALER_PATH` | app/ml/model/scaler.pkl | Feature scaler path |
| `MODEL_PATH` | model/model.pkl | Alternative model path (used by some services) |
| `SCALER_PATH` | model/scaler.pkl | Alternative scaler path (used by some services) |
| `SEED_FORCE` | false | Set `true` on Render to drop all tables and re-seed from scratch |
| `PYTHONUNBUFFERED` | 1 | Force unbuffered output (set on Render for visible logs) |
| `DEBUG` | false | Enable SQL logging |

**Render-specific:** `SEED_FORCE=true` should be set once to fix partial seeds, then removed. `PYTHONUNBUFFERED=1` ensures seed output is visible in Render logs.

---

## Deployment

### Frontend (Vercel)
- **Framework:** Vite (React)
- **Config:** `frontend/vercel.json` — rewrites `/api/*` to Render backend, SPA catch-all for React Router
- **URL:** `https://accountguard-ai.vercel.app` (or custom domain)

### Backend (Render)
- **Runtime:** Python 3.12 (pinned — `pydantic-core==2.27.2` has no wheel for 3.14)
- **Build Command:** `pip install -r requirements.txt && python -m app.ml.train_model`
- **Start Command:** `python -m app.seed.seed && uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Blueprint:** `render.yaml` — defines service, env vars, PostgreSQL database
- **Database:** Render PostgreSQL (auto-provisioned via `render.yaml`)

### Key Gotchas
1. **Render manual settings override `render.yaml`:** If you set Build/Start commands in the dashboard, they override `render.yaml`. Ensure commands match.
2. **Cold starts drop data on free tier:** Render free tier spins down on idle. Seed runs at startup, but simulator data is lost. Use `SEED_FORCE=false` after first successful seed.
3. **Vercel buffering kills SSE:** Vercel proxies buffer responses, breaking SSE streams. Frontend falls back to polling (2.5s interval for simulation, 5s for dashboards).
4. **passlib + bcrypt compatibility:** `passlib 1.7.4` + `bcrypt>=4.1` causes `AttributeError: module 'bcrypt' has no attribute '__about__'`. Pin `bcrypt==4.0.1`.

---

## Common Tasks

### Reset Database
```bash
cd backend
rm accountguard.db
python -m app.seed.seed
```

### Force Re-seed (Render)
Set `SEED_FORCE=true` in Render dashboard env vars, redeploy. This drops all tables and re-seeds from scratch. After successful seed, set back to `SEED_FORCE=false`.

### Retrain ML Model
```bash
cd backend
python -m app.ml.train_model
```

### Run Tests
```bash
cd backend
python -m pytest tests/ -v
```
Shared test fixture in `tests/conftest.py` provides `client` (in-memory SQLite + test client) for all integration tests.

### Add New Demo User
Edit `backend/app/seed/seed.py`, add to `users` list, re-seed.

### Change Risk Thresholds
Edit thresholds in `backend/app/ml/risk_rules.py`:
```python
RISK_THRESHOLDS = {
    "low": 30,    # Change this
    "medium": 70, # Change this
    "high": 100,
}
```
The `get_risk_level()`, `get_risk_level_and_action()` helpers and all services will automatically use the new thresholds.

### Add New Simulation Scenario
1. Add scenario logic in `SimulatorService._generate_login()` or `_generate_transaction()`
2. Add to `SCENARIOS` list
3. Frontend auto-displays new events

---

## Key Dependencies

### Backend (`requirements.txt`)
| Package | Version | Purpose | Gotcha |
|---------|---------|---------|--------|
| `fastapi` | latest | Web framework | — |
| `uvicorn` | latest | ASGI server | — |
| `sqlalchemy[asyncio]` | 2.0+ | Async ORM | — |
| `aiosqlite` | latest | SQLite async driver | Local dev only |
| `asyncpg` | 0.30.0 | PostgreSQL async driver | Production only |
| `pydantic` | 2.0+ | Data validation | — |
| `pydantic-settings` | latest | Env var loading | — |
| `python-jose[cryptography]` | latest | JWT tokens | — |
| `passlib[bcrypt]` | 1.7.4 | Password hashing | **Pin bcrypt==4.0.1** (see below) |
| `bcrypt` | 4.0.1 | Password hashing backend | passlib 1.7.4 + bcrypt>=4.1 causes `AttributeError: module 'bcrypt' has no attribute '__about__'` |
| `scikit-learn` | latest | ML model (RandomForest) | — |
| `numpy` | latest | Numerical ops | — |
| `httpx` | latest | HTTP client (for testing) | — |

### Frontend (`package.json`)
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `recharts` | Charts (3 types: Donut, Bar, Area) |
| `lucide-react` | Icons |
| `@tailwindcss/vite` | Tailwind v4 Vite plugin |

---

## File Counts

| Category | Count |
|----------|-------|
| Backend Python files | ~74 |
| Backend models | 13 |
| Backend services | 14 |
| Backend route modules | 13 |
| Backend ML files | 5 |
| Frontend source files | ~31 |
| Frontend pages | 13 |
| Frontend components | 7 |
| Frontend charts | 3 |
| Frontend API modules | 8 |
| **Total source files** | **~112** |
