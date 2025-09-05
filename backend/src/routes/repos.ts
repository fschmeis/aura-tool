import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const REPO_ROOT = path.join('/tmp', 'aura-tool');

router.get('/', (req, res) => {
  if (!fs.existsSync(REPO_ROOT)) return res.json([]);
  const repos = fs.readdirSync(REPO_ROOT)
    .filter(name => fs.statSync(path.join(REPO_ROOT, name)).isDirectory())
    .map(name => ({
      name,
      path: path.join(REPO_ROOT, name)
    }));
  res.json(repos);
});

export default router;
