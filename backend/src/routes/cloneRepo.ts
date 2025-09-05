import { Router } from 'express';
import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { logAction } from '../utils/logger';

const router = Router();

router.post('/', async (req, res) => {
  const { repoUrl } = req.body;
  if (!repoUrl) return res.status(400).json({ error: 'repoUrl required' });
  const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'repo';
  const basePath = path.join('/tmp', 'aura-tool');
  const targetPath = path.join(basePath, repoName);
  try {
    fs.mkdirSync(basePath, { recursive: true });
    const force = req.body.force === true || req.body.overwrite === true;
    if (fs.existsSync(targetPath)) {
      if (!force) {
        return res.status(409).json({ error: 'Repository already exists.' });
      }
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
    await simpleGit().clone(repoUrl, targetPath);
    const srcExists = fs.existsSync(path.join(targetPath, 'src'));
    logAction('clone', { repoUrl, targetPath, success: true, force });
    res.json({ success: true, repoPath: targetPath, srcExists });
  } catch (e) {
    logAction('clone', { repoUrl, targetPath, success: false, error: (e as Error).message });
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
