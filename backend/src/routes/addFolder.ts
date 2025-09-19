import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { logAction } from '../utils/logger';

const router = Router();

router.post('/', (req, res) => {
  const { folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'folderPath required' });
  
  // Validate that the folder exists and is accessible
  if (!fs.existsSync(folderPath)) {
    logAction('add-folder-error', { folderPath, error: 'Folder does not exist' });
    return res.status(400).json({ error: 'Folder does not exist' });
  }
  
  if (!fs.statSync(folderPath).isDirectory()) {
    logAction('add-folder-error', { folderPath, error: 'Path is not a directory' });
    return res.status(400).json({ error: 'Path is not a directory' });
  }

  try {
    const folderName = path.basename(folderPath);
    logAction('add-folder-success', { folderPath, name: folderName });
    res.json({ 
      success: true, 
      folderPath: folderPath,
      name: folderName
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    logAction('add-folder-error', { folderPath, error: errorMsg });
    res.status(500).json({ error: errorMsg });
  }
});

export default router;