import express from 'express';
import { MockRegulatoryPolicy } from './regulatory-policy.js';
import { createInMemoryRepositories } from './in-memory-store.js';
import { registerApiRoutes } from '../adapters/http/api.js';

const PORT = 5000;

const policy = new MockRegulatoryPolicy();
const { routes, banking, pools } = createInMemoryRepositories(policy);

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});
app.use(express.json());

registerApiRoutes(app, { routes, banking, pools, policy });

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Fuel EU Maritime API listening on http://localhost:${PORT}`);
});
