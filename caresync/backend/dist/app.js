"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const mongoose_1 = __importDefault(require("mongoose"));
const auth_1 = __importDefault(require("./routes/auth"));
const doctor_1 = __importDefault(require("./routes/doctor"));
const appointment_1 = __importDefault(require("./routes/appointment"));
const payment_1 = __importDefault(require("./routes/payment"));
const webhook_1 = __importDefault(require("./routes/webhook"));
const report_1 = __importDefault(require("./routes/report"));
const app = (0, express_1.default)();
// ── Security middleware ───────────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
// ── CRITICAL: Webhook route registered BEFORE express.json() ─────────────────
// The webhook controller applies express.raw() per-route to capture raw buffer.
// If express.json() runs first globally, the raw body is lost and HMAC fails.
app.use('/api/webhooks', webhook_1.default);
// ── Global JSON parser (all other routes) ────────────────────────────────────
app.use(express_1.default.json());
// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/', (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests, please try again later.',
}));
// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/doctors', doctor_1.default);
app.use('/api/appointments', appointment_1.default);
app.use('/api/payments', payment_1.default);
app.use('/api/reports', report_1.default);
// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.status(200).send('CareSync API running safely'));
// ── Database + Server ─────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 8080;
mongoose_1.default.connect(process.env.MONGO_URI)
    .then(() => {
    console.log('MongoDB Connected');
    app.listen(PORT, '0.0.0.0', () => console.log(`CareSync Backend running on port ${PORT}`));
})
    .catch((err) => console.error('DB Connection Error:', err));
