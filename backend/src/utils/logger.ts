import fs from 'fs';
import path from 'path';

const LOG_PATH = path.join('/tmp', 'aura-tool', 'aura-tool.log');

export function logAction(action: string, details?: any) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    ...(details ? { details } : {})
  };
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
}

export function getLogFilePath() {
  return LOG_PATH;
}
