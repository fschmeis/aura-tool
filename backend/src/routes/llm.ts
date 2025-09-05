import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { logAction } from '../utils/logger';

const router = Router();

function getFiles(dir: string, exts: string[], fileList: string[] = []): string[] {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, exts, fileList);
    } else if (exts.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

router.post('/', (req, res) => {
  const { repoPath, srcPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'repoPath required' });
  const target = srcPath ? path.join(repoPath, srcPath) : path.join(repoPath, 'src');
  if (!fs.existsSync(target)) {
    logAction('llm-error', { repoPath, srcPath, error: 'Target not found' });
    return res.status(400).json({ error: 'Target not found' });
  }
  try {
    const files = getFiles(target, ['.ts', '.vue']);
    const fileStats = files.map(f => {
      const content = fs.readFileSync(f, 'utf-8');
      const loc = content.split('\n').length;
      return { file: path.relative(repoPath, f), loc };
    });
    const totalLOC = fileStats.reduce((sum, f) => sum + f.loc, 0);
    logAction('llm-success', { repoPath, srcPath, totalLOC, fileCount: fileStats.length });
    res.json({ files: fileStats, totalLOC });
  } catch (e) {
    logAction('llm-error', { repoPath, srcPath, error: (e as Error).message });
    res.status(500).json({ error: 'LLM analysis failed' });
  }
});

export default router;
