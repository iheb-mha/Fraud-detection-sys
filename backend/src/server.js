import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { transactionSchema, modelFeaturesSchema } from './validation.js';
import { computeRisk } from './heuristic.js';
import { connectDB } from './db.js';
import { findUserByEmail, createUser } from './models/User.js';
import { createAnalysis, getAnalysesByUserId } from './models/Analysis.js';
import { authRequired, signUserToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fraud-backend', version: 'heuristic-v1' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await findUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await createUser({ email: email.toLowerCase().trim(), passwordHash });
    const token = signUserToken(user);

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error('Error in /api/auth/register', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signUserToken(user);
    return res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error('Error in /api/auth/login', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/predict', authRequired, async (req, res) => {
  const parseResult = transactionSchema.safeParse(req.body?.transaction);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parseResult.error.flatten() });
  }

  const transaction = parseResult.data;
  const { score, contributions } = computeRisk(transaction);
  const threshold = 0.5;
  const prob = Math.min(1, Math.max(0, score));
  const label = prob > threshold ? 1 : 0;
  const resultPayload = {
    fraud_probability: Number(prob.toFixed(4)),
    fraud_label: label,
    explanations: contributions,
    threshold,
    model_type: 'heuristic-v1'
  };

  try {
    await createAnalysis({
      userId: req.user.id,
      input: transaction,
      result: resultPayload
    });
  } catch (err) {
    console.error('Error saving analysis history', err);
  }

  res.json(resultPayload);
});

// Proxy to Python FastAPI model service
// expects body: { features: { Time, V1..V28, Amount } }
app.post('/api/predict-model', async (req, res) => {
  const parse = modelFeaturesSchema.safeParse(req.body?.features);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid features', details: parse.error.flatten() });
  }
  const features = parse.data;
  try {
    const pyUrl = process.env.PY_MODEL_URL || 'http://127.0.0.1:8000/predict';
    const r = await fetch(pyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features)
    });
    const text = await r.text();
    if (!r.ok) {
      return res.status(r.status).send(text);
    }
    let data;
    try { data = JSON.parse(text); } catch {
      return res.status(502).send('Invalid JSON from model service');
    }
    return res.json(data);
  } catch (e) {
    console.error('Error contacting Python model service', e);
    return res.status(502).json({ error: 'Model service unavailable' });
  }
});

// Get analysis history for current user
app.get('/api/analyses/me', authRequired, async (req, res) => {
  try {
    const items = await getAnalysesByUserId(req.user.id);
    return res.json({ analyses: items });
  } catch (err) {
    console.error('Error in /api/analyses/me', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Fraud backend listening on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to MySQL', err);
    process.exit(1);
  });
