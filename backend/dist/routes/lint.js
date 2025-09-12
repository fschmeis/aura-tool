"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.post('/', (req, res) => {
    const { repoPath, lintPath } = req.body;
    if (!repoPath)
        return res.status(400).json({ error: 'repoPath required' });
    const lintTarget = lintPath ? path_1.default.join(repoPath, lintPath) : path_1.default.join(repoPath, 'src');
    if (!fs_1.default.existsSync(lintTarget))
        return res.status(400).json({ error: 'Lint target not found' });
    // Copy or symlink backend eslint.config.mjs to repo root
    const backendConfig = path_1.default.resolve(__dirname, '../../eslint.config.mjs');
    const targetConfig = path_1.default.join(repoPath, 'eslint.config.mjs');
    try {
        if (fs_1.default.existsSync(targetConfig))
            fs_1.default.unlinkSync(targetConfig);
        try {
            fs_1.default.symlinkSync(backendConfig, targetConfig);
        }
        catch {
            fs_1.default.copyFileSync(backendConfig, targetConfig);
        }
    }
    catch (e) {
        const errMsg = (e instanceof Error) ? e.message : String(e);
        (0, logger_1.logAction)('lint-error', { error: 'Failed to copy/symlink eslint.config.mjs', details: errMsg });
        return res.status(500).json({ error: 'Failed to copy/symlink eslint.config.mjs' });
    }
    // Use lintPath or default to 'src'
    const relLintPath = lintPath || 'src';
    const cmd = `npx eslint --format json "${relLintPath}"`;
    (0, logger_1.logAction)('lint-exec', { cmd, repoPath, lintTarget, cwd: repoPath });
    (0, child_process_1.exec)(cmd, { cwd: repoPath }, (err, stdout) => {
        if (err && !stdout) {
            (0, logger_1.logAction)('lint-error', { cmd, error: err.message });
            return res.status(500).json({ error: err.message });
        }
        try {
            const results = JSON.parse(stdout);
            const ruleCounts = {};
            results.forEach((r) => {
                r.messages.forEach((m) => {
                    ruleCounts[m.ruleId] = (ruleCounts[m.ruleId] || 0) + 1;
                });
            });
            const topRules = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            (0, logger_1.logAction)('lint-success', { cmd, repoPath, lintTarget, topRules });
            res.json({ results, topRules });
        }
        catch (e) {
            (0, logger_1.logAction)('lint-parse-error', { cmd, error: e.message });
            res.status(500).json({ error: 'ESLint output parse error' });
        }
    });
});
exports.default = router;
