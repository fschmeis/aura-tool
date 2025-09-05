import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/', (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath || !fs.existsSync(repoPath)) return res.json([]);
  const folders = fs.readdirSync(repoPath)
    .filter(name => fs.statSync(path.join(repoPath, name)).isDirectory())
    .filter(name => !name.startsWith('.'));
  res.json(folders);
});

export default router;
