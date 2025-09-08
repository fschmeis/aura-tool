export async function fetchLog() {
  const res = await fetch('/api/logfile');
  const text = await res.text();
  return text.trim().split('\n').map(line => {
    try {
      const entry = JSON.parse(line);
      let type = 'info';
      let message = '';
      let details = '';
      // Helper to get repo name from path
      const getRepoName = (repoPath: string | undefined) => {
        if (!repoPath) return '';
        const parts = repoPath.split('/');
        return parts[parts.length - 1] || repoPath;
      };
      switch (entry.action) {
        case 'clone': {
          const detailsObj = entry.details && typeof entry.details === 'object' ? entry.details : {};
          const url = entry.repoUrl || detailsObj.repoUrl;
          const success = typeof entry.success === 'boolean' ? entry.success : detailsObj.success;
          const errorMsg = entry.error || detailsObj.error;
          if (success) {
            type = 'success';
            message = `Cloned ${url}`;
            details = '';
          } else {
            type = 'error';
            message = errorMsg ? `Error: ${errorMsg}` : `Clone failed: ${url}`;
            details = '';
          }
          break;
        }
        case 'lint-exec': {
          const repoName = getRepoName(entry.repoPath);
          type = 'info';
          message = `Started ESLint analysis on ${repoName}`;
          details = entry.cmd || '';
          break;
        }
        case 'lint-success': {
          const repoName = getRepoName(entry.repoPath);
          type = 'success';
          message = `ESLint analysis finished on ${repoName}`;
          details = '';
          break;
        }
        case 'lint-error':
        case 'lint-parse-error': {
          const repoName = getRepoName(entry.repoPath);
          type = 'error';
          message = `ESLint analysis failed on ${repoName}`;
          details = entry.error || entry.details || '';
          break;
        }
        case 'llm-success': {
          const repoName = getRepoName(entry.repoPath);
          type = 'success';
          message = `LLM analysis finished on ${repoName}`;
          details = '';
          break;
        }
        case 'llm-error': {
          const repoName = getRepoName(entry.repoPath);
          type = 'error';
          message = `LLM analysis failed on ${repoName}`;
          details = entry.error || '';
          break;
        }
        default: {
          // Show all other actions as info
          type = 'info';
          message = entry.action ? `Action: ${entry.action}` : 'Unknown log action';
          details = JSON.stringify(entry, null, 2);
          break;
        }
      }
      return {
        timestamp: entry.timestamp,
        message,
        type,
        details: details || ''
      };
    } catch {
      return { timestamp: '', message: line, type: 'error' };
    }
  }).filter(Boolean).reverse();
}

export function openLogfile() {
  window.open('/api/logfile', '_blank');
}
