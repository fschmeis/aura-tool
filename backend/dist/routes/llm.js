"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const glob_1 = require("glob");
const child_process_1 = require("child_process");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
// OpenAI configuration - hardcoded for now
const OPENAI_CONFIG = {
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: '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',
    model: 'deepseek/deepseek-chat-v3.1:free'
};
function parseFilePattern(pattern) {
    return pattern.split(',').map(p => p.trim()).filter(p => p.length > 0);
}
async function getFilesFromPattern(dir, patterns) {
    const allFiles = [];
    for (const pattern of patterns) {
        const files = await (0, glob_1.glob)(path_1.default.join(dir, '**', pattern).replace(/\\/g, '/'));
        allFiles.push(...files);
    }
    return [...new Set(allFiles)]; // Remove duplicates
}
async function callOpenAI(prompt) {
    const response = await fetch(`${OPENAI_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_CONFIG.apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: OPENAI_CONFIG.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1
        })
    });
    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    return response.json();
}
// Route to edit prompt (opens default editor)
router.post('/edit-prompt', (req, res) => {
    const promptPath = path_1.default.resolve(__dirname, '../../prompt.txt');
    (0, child_process_1.exec)(`xdg-open "${promptPath}"`, (error) => {
        if (error) {
            (0, logger_1.logAction)('llm-edit-prompt-error', { error: error.message });
            return res.status(500).json({ error: 'Failed to open prompt editor' });
        }
        (0, logger_1.logAction)('llm-edit-prompt-success', { promptPath });
        res.json({ message: 'Prompt opened in default editor' });
    });
});
router.post('/', async (req, res) => {
    const { repoPath, srcPath, filePattern = '*.ts,*.vue' } = req.body;
    if (!repoPath)
        return res.status(400).json({ error: 'repoPath required' });
    const target = srcPath ? path_1.default.join(repoPath, srcPath) : path_1.default.join(repoPath, 'src');
    if (!fs_1.default.existsSync(target)) {
        (0, logger_1.logAction)('llm-error', { repoPath, srcPath, error: 'Target not found' });
        return res.status(400).json({ error: 'Target not found' });
    }
    try {
        // Read prompt template
        const promptPath = path_1.default.resolve(__dirname, '../../prompt.txt');
        if (!fs_1.default.existsSync(promptPath)) {
            return res.status(500).json({ error: 'Prompt template not found' });
        }
        const promptTemplate = fs_1.default.readFileSync(promptPath, 'utf8');
        // Get files matching pattern
        const patterns = parseFilePattern(filePattern);
        const files = await getFilesFromPattern(target, patterns);
        if (files.length === 0) {
            return res.json({ results: [], message: 'No files found matching pattern' });
        }
        const results = [];
        const totalFiles = files.length;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const code = fs_1.default.readFileSync(file, 'utf8');
            const filename = path_1.default.basename(file);
            const finalPrompt = promptTemplate
                .replace(/\{\{CODE\}\}/g, code)
                .replace(/\{\{FILENAME\}\}/g, filename);
            (0, logger_1.logAction)('llm-analyze-file', { file: filename, progress: `${i + 1}/${totalFiles}` });
            try {
                const response = await callOpenAI(finalPrompt);
                const content = response.choices?.[0]?.message?.content ?? '{}';
                let parsed;
                try {
                    parsed = JSON.parse(content);
                }
                catch {
                    // If JSON parsing fails, create a structured response
                    parsed = {
                        summary: 'Analysis completed',
                        raw_response: content,
                        parsing_error: true
                    };
                }
                results.push({
                    file: path_1.default.relative(repoPath, file),
                    ...parsed
                });
                (0, logger_1.logAction)('llm-analyze-success', { file: filename, progress: `${i + 1}/${totalFiles}` });
            }
            catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                (0, logger_1.logAction)('llm-analyze-error', { file: filename, error: errorMsg });
                results.push({
                    file: path_1.default.relative(repoPath, file),
                    error: errorMsg,
                    analysis_failed: true
                });
            }
        }
        // Save results with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path_1.default.join(repoPath, `llm-analysis-${timestamp}.json`);
        fs_1.default.writeFileSync(outputPath, JSON.stringify(results, null, 2));
        (0, logger_1.logAction)('llm-success', {
            repoPath,
            srcPath,
            filePattern,
            totalFiles: results.length,
            outputFile: path_1.default.basename(outputPath)
        });
        res.json({ results, outputFile: path_1.default.basename(outputPath) });
    }
    catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        (0, logger_1.logAction)('llm-error', { repoPath, srcPath, error: errorMsg });
        res.status(500).json({ error: 'LLM analysis failed: ' + errorMsg });
    }
});
exports.default = router;
