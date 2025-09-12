"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
router.post('/', (req, res) => {
    const { repoPath } = req.body;
    if (!repoPath || !fs_1.default.existsSync(repoPath))
        return res.json([]);
    const omit = ['node_modules', '.git'];
    const result = [];
    function walk(dir, prefix = '', depth = 0) {
        if (depth > 1)
            return;
        const entries = fs_1.default.readdirSync(dir);
        for (const name of entries) {
            if (name.startsWith('.') || omit.includes(name))
                continue;
            const fullPath = path_1.default.join(dir, name);
            if (fs_1.default.statSync(fullPath).isDirectory()) {
                const relPath = prefix ? `${prefix}/${name}` : name;
                result.push(relPath);
                walk(fullPath, relPath, depth + 1);
            }
        }
    }
    walk(repoPath);
    res.json(result);
});
exports.default = router;
