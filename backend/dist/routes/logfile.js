"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    const logPath = (0, logger_1.getLogFilePath)();
    if (!fs_1.default.existsSync(logPath))
        return res.status(404).json({ error: 'Logfile not found' });
    const content = fs_1.default.readFileSync(logPath, 'utf-8');
    res.type('text/plain').send(content);
});
// Clear log file
router.delete('/', (req, res) => {
    const logPath = (0, logger_1.getLogFilePath)();
    try {
        if (fs_1.default.existsSync(logPath))
            fs_1.default.unlinkSync(logPath);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to clear log' });
    }
});
exports.default = router;
