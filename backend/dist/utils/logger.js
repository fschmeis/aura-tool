"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = logAction;
exports.getLogFilePath = getLogFilePath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const LOG_PATH = path_1.default.join('/tmp', 'aura-tool', 'aura-tool.log');
function logAction(action, details) {
    const entry = {
        timestamp: new Date().toISOString(),
        action,
        ...(details && typeof details === 'object' ? details : { details })
    };
    fs_1.default.mkdirSync(path_1.default.dirname(LOG_PATH), { recursive: true });
    fs_1.default.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
}
function getLogFilePath() {
    return LOG_PATH;
}
