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

  // Copy or symlink backend eslint.config.mjs to repo root
  const backendConfig = path.resolve(__dirname, '../../eslint.config.mjs');
  const targetConfig = path.join(repoPath, 'eslint.config.mjs');
  try {
    if (fs.existsSync(targetConfig)) fs.unlinkSync(targetConfig);
    try {
      fs.symlinkSync(backendConfig, targetConfig);
    } catch {
      fs.copyFileSync(backendConfig, targetConfig);
    }
  } catch (e) {
    const errMsg = (e instanceof Error) ? e.message : String(e);
    logAction('lint-error', { error: 'Failed to copy/symlink eslint.config.mjs', details: errMsg });
    return res.status(500).json({ error: 'Failed to copy/symlink eslint.config.mjs' });
  }

  const cmd = `npx eslint --format json src`;
  logAction('lint-exec', { cmd, repoPath, lintTarget, cwd: repoPath });
  exec(cmd, { cwd: repoPath }, (err, stdout) => {
    if (err && !stdout) {
      logAction('lint-error', { cmd, error: err.message });
      return res.status(500).json({ error: err.message });
    }
    try {
      const results = JSON.parse(stdout);
      const ruleCounts: Record<string, number> = {};
      results.forEach((r: any) => {
        r.messages.forEach((m: any) => {
          ruleCounts[m.ruleId] = (ruleCounts[m.ruleId] || 0) + 1;
        });
      });
      const topRules = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      logAction('lint-success', { cmd, repoPath, lintTarget, topRules });
      res.json({ results, topRules });
    } catch (e) {
      logAction('lint-parse-error', { cmd, error: (e as Error).message });
      res.status(500).json({ error: 'ESLint output parse error' });
    }
  });
});

export default router;
