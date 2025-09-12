import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/', (req, res) => {
  const { repoPath } = req.body;
  if (!repoPath || !fs.existsSync(repoPath)) return res.json([]);

  const omit = ['node_modules', '.git'];
  const result: string[] = [];

  function walk(dir: string, prefix = '', depth = 0) {
    if (depth > 1) return;
    const entries = fs.readdirSync(dir);
    for (const name of entries) {
      if (name.startsWith('.') || omit.includes(name)) continue;
      const fullPath = path.join(dir, name);
      if (fs.statSync(fullPath).isDirectory()) {
        const relPath = prefix ? `${prefix}/${name}` : name;
        result.push(relPath);
        walk(fullPath, relPath, depth + 1);
      }
    }
  }
  walk(repoPath);
  res.json(result);
});

export default router;
