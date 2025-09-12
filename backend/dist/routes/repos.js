"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const REPO_ROOT = path_1.default.join('/tmp', 'aura-tool');
router.get('/', (req, res) => {
    if (!fs_1.default.existsSync(REPO_ROOT))
        return res.json([]);
    const repos = fs_1.default.readdirSync(REPO_ROOT)
        .filter(name => fs_1.default.statSync(path_1.default.join(REPO_ROOT, name)).isDirectory())
        .map(name => ({
        name,
        path: path_1.default.join(REPO_ROOT, name)
    }));
    res.json(repos);
});
exports.default = router;
