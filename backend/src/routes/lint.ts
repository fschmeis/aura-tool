import { Router } from 'express';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logAction } from '../utils/logger';

const router = Router();

router.post('/', (req, res) => {
  const { repoPath, lintPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'repoPath required' });
  const lintTarget = lintPath ? path.join(repoPath, lintPath) : path.join(repoPath, 'src');
  if (!fs.existsSync(lintTarget)) return res.status(400).json({ error: 'Lint target not found' });

  // Run ESLint from target directory with explicit config path
  const backendConfigPath = path.resolve(__dirname, '../../eslint.config.mjs');
  const absoluteLintTarget = path.resolve(lintTarget);
  
  // Determine what to lint
  let lintPattern;
  if (fs.statSync(absoluteLintTarget).isFile()) {
    lintPattern = path.basename(absoluteLintTarget);
  } else {
    lintPattern = '**/*.{js,ts,vue}';
  }
  
  const cmd = `npx eslint --config "${backendConfigPath}" --format json "${lintPattern}"`;
  logAction('lint-exec', { cmd, repoPath, lintTarget, cwd: absoluteLintTarget });
  exec(cmd, { cwd: absoluteLintTarget }, (err, stdout) => {
    if (err && !stdout) {
      logAction('lint-error', { cmd, error: err.message });
      return res.status(500).json({ error: err.message });
    }
    try {
      const results = JSON.parse(stdout);
      logAction('lint-success', { cmd, repoPath, lintTarget });
      res.json({ results });
    } catch (e) {
      logAction('lint-parse-error', { cmd, error: (e as Error).message });
      res.status(500).json({ error: 'ESLint output parse error' });
    }
  });
});

export default router;
