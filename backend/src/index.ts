import express from 'express';

import cloneRepoRouter from './routes/cloneRepo';
import lintRouter from './routes/lint';
import llmRouter from './routes/llm';
import logfileRouter from './routes/logfile';
import reposRouter from './routes/repos';
import listFoldersRouter from './routes/listfolders';

const app = express();
app.use(express.json());

app.use('/api/clone', cloneRepoRouter);
app.use('/api/lint', lintRouter);
app.use('/api/llm', llmRouter);
app.use('/api/logfile', logfileRouter);
app.use('/api/repos', reposRouter);
app.use('/api/listfolders', listFoldersRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
