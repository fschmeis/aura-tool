import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const REPO_ROOT = path.join('/tmp', 'aura-tool');
const EXTERNAL_FOLDERS_KEY = 'aura-tool-external-folders';

// Get external folders from a simple JSON file
function getExternalFolders(): Array<{name: string, path: string}> {
  const filePath = path.join(REPO_ROOT, 'external-folders.json');
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) || [];
  } catch {
    return [];
  }
}

// Save external folders to JSON file
function saveExternalFolders(folders: Array<{name: string, path: string}>) {
  fs.mkdirSync(REPO_ROOT, { recursive: true });
  const filePath = path.join(REPO_ROOT, 'external-folders.json');
  fs.writeFileSync(filePath, JSON.stringify(folders, null, 2));
}

router.get('/', (req, res) => {
  const repos: Array<{name: string, path: string}> = [];
  
  // Add cloned repositories
  if (fs.existsSync(REPO_ROOT)) {
    const clonedRepos = fs.readdirSync(REPO_ROOT)
      .filter(name => {
        const fullPath = path.join(REPO_ROOT, name);
        return name !== 'external-folders.json' && fs.statSync(fullPath).isDirectory();
      })
      .map(name => ({
        name,
        path: path.join(REPO_ROOT, name)
      }));
    repos.push(...clonedRepos);
  }
  
  // Add external folders
  const externalFolders = getExternalFolders().filter(folder => fs.existsSync(folder.path));
  repos.push(...externalFolders);
  
  res.json(repos);
});

// Add external folder
router.post('/add-folder', (req, res) => {
  const { folderPath } = req.body;
  if (!folderPath) return res.status(400).json({ error: 'folderPath required' });
  
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return res.status(400).json({ error: 'Invalid folder path' });
  }

  const folderName = path.basename(folderPath);
  const externalFolders = getExternalFolders();
  
  // Check if already exists
  if (externalFolders.some(f => f.path === folderPath)) {
    return res.status(409).json({ error: 'Folder already added' });
  }
  
  externalFolders.push({ name: folderName, path: folderPath });
  saveExternalFolders(externalFolders);
  
  res.json({ success: true, name: folderName, path: folderPath });
});

export default router;
