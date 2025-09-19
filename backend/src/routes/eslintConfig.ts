import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { logAction } from '../utils/logger';

const router = Router();

// Get current ESLint config
router.get('/', (req, res) => {
  const configPath = path.resolve(__dirname, '../../eslint.config.mjs');
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      res.json({ success: true, content, configPath });
    } else {
      res.status(404).json({ error: 'ESLint config file not found' });
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ error: errorMsg });
  }
});

// Edit ESLint config in editor
router.post('/edit', (req, res) => {
  const configPath = path.resolve(__dirname, '../../eslint.config.mjs');
  
  if (!fs.existsSync(configPath)) {
    logAction('eslint-config-edit-error', { error: 'Config file not found', configPath });
    return res.status(404).json({ error: 'ESLint config file not found' });
  }
  
  // Try VS Code first
  exec(`code "${configPath}"`, (error, stdout, stderr) => {
    if (!error) {
      logAction('eslint-config-edit-success', { configPath, usedCommand: 'code' });
      return res.json({ 
        message: 'ESLint config opened in VS Code', 
        configPath: configPath,
        usedCommand: 'code'
      });
    }
    
    // Try xdg-open as fallback
    exec(`xdg-open "${configPath}"`, (error2, stdout2, stderr2) => {
      logAction('eslint-config-edit-success', { 
        configPath, 
        usedCommand: 'xdg-open',
        note: 'Command may report error but editor should open'
      });
      
      res.json({ 
        message: 'ESLint config opened in default editor', 
        configPath: configPath,
        usedCommand: 'xdg-open'
      });
    });
  });
});

// Update ESLint config content
router.post('/update', (req, res) => {
  const { content } = req.body;
  const configPath = path.resolve(__dirname, '../../eslint.config.mjs');
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  try {
    // Backup current config
    const backupPath = configPath + '.backup.' + Date.now();
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
    }
    
    // Write new content
    fs.writeFileSync(configPath, content, 'utf8');
    
    logAction('eslint-config-update-success', { configPath, backupPath });
    res.json({ 
      success: true, 
      message: 'ESLint config updated successfully',
      backupPath: path.basename(backupPath)
    });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    logAction('eslint-config-update-error', { configPath, error: errorMsg });
    res.status(500).json({ error: errorMsg });
  }
});

export default router;