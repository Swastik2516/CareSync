"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Only authenticated patients can initiate payments
router.post('/create-order', auth_1.authenticateToken, (0, auth_1.requireRole)('PATIENT'), paymentController_1.createOrder);
exports.default = router;
