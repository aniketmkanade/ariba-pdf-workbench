import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import previewRouter from './routes/preview';
import aiRouter from './routes/ai';

import validateRouter from './routes/validate';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/preview', previewRouter);
app.use('/api/ai', aiRouter);
app.use('/api/validate', validateRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
