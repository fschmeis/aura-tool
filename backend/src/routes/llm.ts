import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { exec } from 'child_process';
import { logAction } from '../utils/logger';

const router = Router();

// OpenAI configuration - hardcoded for now
const OPENAI_CONFIG = {
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: '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',
  model: 'deepseek/deepseek-chat-v3.1:free'
};

function parseFilePattern(pattern: string): string[] {
  return pattern.split(',').map(p => p.trim()).filter(p => p.length > 0);
}

async function getFilesFromPattern(dir: string, patterns: string[], excludePatterns: string[] = []): Promise<string[]> {
  const allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = await glob(path.join(dir, '**', pattern).replace(/\\/g, '/'));
    allFiles.push(...files);
  }
  
  // Remove duplicates
  let uniqueFiles = [...new Set(allFiles)];
  
  // Apply exclude patterns
  if (excludePatterns.length > 0) {
    for (const excludePattern of excludePatterns) {
      const excludeGlob = path.join(dir, '**', excludePattern).replace(/\\/g, '/');
      const filesToExclude = await glob(excludeGlob);
      uniqueFiles = uniqueFiles.filter(file => !filesToExclude.includes(file));
    }
  }
  
  return uniqueFiles;
}

async function callOpenAI(prompt: string): Promise<any> {
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
  const promptPath = path.resolve(__dirname, '../../prompt.txt');
  
  // Check if file exists first
  if (!fs.existsSync(promptPath)) {
    logAction('llm-edit-prompt-error', { error: 'Prompt file not found', promptPath });
    return res.status(404).json({ error: 'Prompt file not found' });
  }
  
  // Try VS Code first (most likely to work in development environment)
  exec(`code "${promptPath}"`, (error, stdout, stderr) => {
    if (!error) {
      logAction('llm-edit-prompt-success', { promptPath, usedCommand: 'code' });
      return res.json({ 
        message: 'Prompt opened in VS Code', 
        promptPath: promptPath,
        usedCommand: 'code'
      });
    }
    
    // Try xdg-open as fallback
    exec(`xdg-open "${promptPath}"`, (error2, stdout2, stderr2) => {
      // For xdg-open and similar commands, we assume success if the file exists
      // since these commands often detach and may appear to "fail" even when successful
      logAction('llm-edit-prompt-success', { 
        promptPath, 
        usedCommand: 'xdg-open',
        note: 'Command may report error but editor should open'
      });
      
      res.json({ 
        message: 'Prompt opened in default editor', 
        promptPath: promptPath,
        usedCommand: 'xdg-open'
      });
    });
  });
});

router.post('/', async (req, res) => {
  const { repoPath, srcPath, filePattern = '*.ts,*.vue', excludePattern = '' } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'repoPath required' });
  
  const target = srcPath ? path.join(repoPath, srcPath) : path.join(repoPath, 'src');
  if (!fs.existsSync(target)) {
    logAction('llm-error', { repoPath, srcPath, error: 'Target not found' });
    return res.status(400).json({ error: 'Target not found' });
  }

  try {
    // Read prompt template
    const promptPath = path.resolve(__dirname, '../../prompt.txt');
    if (!fs.existsSync(promptPath)) {
      return res.status(500).json({ error: 'Prompt template not found' });
    }
    const promptTemplate = fs.readFileSync(promptPath, 'utf8');

    // Get files matching pattern
    const patterns = parseFilePattern(filePattern);
    const excludePatterns = excludePattern ? parseFilePattern(excludePattern) : [];
    const files = await getFilesFromPattern(target, patterns, excludePatterns);
    
    if (files.length === 0) {
      return res.json({ results: [], message: 'No files found matching pattern' });
    }

    const results: any[] = [];
    const totalFiles = files.length;
    
    // Create a partial results file for progress tracking
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const partialOutputPath = path.join(repoPath, `llm-analysis-partial-${timestamp}.json`);
    const finalOutputPath = path.join(repoPath, `llm-analysis-${timestamp}.json`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const code = fs.readFileSync(file, 'utf8');
      const filename = path.basename(file);
      
      const finalPrompt = promptTemplate
        .replace(/\{\{CODE\}\}/g, code)
        .replace(/\{\{FILENAME\}\}/g, filename);

      logAction('llm-analyze-file', { file: filename, progress: `${i + 1}/${totalFiles}` });

      try {
        const response = await callOpenAI(finalPrompt);
        const content = response.choices?.[0]?.message?.content ?? '{}';
        
        let parsed;
        try {
          parsed = JSON.parse(content);
        } catch {
          // If JSON parsing fails, create a structured response
          parsed = {
            summary: 'Analysis completed',
            raw_response: content,
            parsing_error: true
          };
        }

        results.push({
          file: path.relative(repoPath, file),
          ...parsed
        });

        logAction('llm-analyze-success', { file: filename, progress: `${i + 1}/${totalFiles}` });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logAction('llm-analyze-error', { file: filename, error: errorMsg });
        
        results.push({
          file: path.relative(repoPath, file),
          error: errorMsg,
          analysis_failed: true
        });
      }
      
      // Save partial results every 5 files or on the last file
      if ((i + 1) % 5 === 0 || i === files.length - 1) {
        const partialData = {
          results: results,
          progress: {
            completed: i + 1,
            total: totalFiles,
            percentage: Math.round(((i + 1) / totalFiles) * 100)
          },
          timestamp: new Date().toISOString(),
          status: i === files.length - 1 ? 'completed' : 'in_progress'
        };
        fs.writeFileSync(partialOutputPath, JSON.stringify(partialData, null, 2));
      }
    }

    // Save final results
    fs.writeFileSync(finalOutputPath, JSON.stringify(results, null, 2));
    
    // Clean up partial file
    if (fs.existsSync(partialOutputPath)) {
      fs.unlinkSync(partialOutputPath);
    }

    logAction('llm-success', { 
      repoPath, 
      srcPath, 
      filePattern,
      excludePattern, 
      totalFiles: results.length,
      outputFile: path.basename(finalOutputPath)
    });
    
    res.json({ results, outputFile: path.basename(finalOutputPath) });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    logAction('llm-error', { repoPath, srcPath, error: errorMsg });
    res.status(500).json({ error: 'LLM analysis failed: ' + errorMsg });
  }
});

export default router;
