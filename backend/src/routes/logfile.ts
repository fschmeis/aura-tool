import { Router } from 'express';
import fs from 'fs';
import { getLogFilePath } from '../utils/logger';

const router = Router();

router.get('/', (req, res) => {
  const logPath = getLogFilePath();
  if (!fs.existsSync(logPath)) return res.status(404).json({ error: 'Logfile not found' });
  const content = fs.readFileSync(logPath, 'utf-8');
  res.type('text/plain').send(content);
});

// Clear log file
router.delete('/', (req, res) => {
  const logPath = getLogFilePath();
  try {
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to clear log' });
  }
});

export default router;
