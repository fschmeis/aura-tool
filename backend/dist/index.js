"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cloneRepo_1 = __importDefault(require("./routes/cloneRepo"));
const lint_1 = __importDefault(require("./routes/lint"));
const llm_1 = __importDefault(require("./routes/llm"));
const logfile_1 = __importDefault(require("./routes/logfile"));
const repos_1 = __importDefault(require("./routes/repos"));
const listfolders_1 = __importDefault(require("./routes/listfolders"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/clone', cloneRepo_1.default);
app.use('/api/lint', lint_1.default);
app.use('/api/llm', llm_1.default);
app.use('/api/logfile', logfile_1.default);
app.use('/api/repos', repos_1.default);
app.use('/api/listfolders', listfolders_1.default);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
});
