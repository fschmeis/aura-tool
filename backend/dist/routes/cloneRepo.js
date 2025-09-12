"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const simple_git_1 = __importDefault(require("simple-git"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    const { repoUrl } = req.body;
    if (!repoUrl)
        return res.status(400).json({ error: 'repoUrl required' });
    const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'repo';
    const basePath = path_1.default.join('/tmp', 'aura-tool');
    const targetPath = path_1.default.join(basePath, repoName);
    try {
        fs_1.default.mkdirSync(basePath, { recursive: true });
        const force = req.body.force === true || req.body.overwrite === true;
        if (fs_1.default.existsSync(targetPath)) {
            if (!force) {
                return res.status(409).json({ error: 'Repository already exists.' });
            }
            fs_1.default.rmSync(targetPath, { recursive: true, force: true });
        }
        await (0, simple_git_1.default)().clone(repoUrl, targetPath);
        const srcExists = fs_1.default.existsSync(path_1.default.join(targetPath, 'src'));
        (0, logger_1.logAction)('clone', { repoUrl, targetPath, success: true, force });
        res.json({ success: true, repoPath: targetPath, srcExists });
    }
    catch (e) {
        (0, logger_1.logAction)('clone', { repoUrl, targetPath, success: false, error: e.message });
        res.status(500).json({ error: e.message });
    }
});
exports.default = router;
