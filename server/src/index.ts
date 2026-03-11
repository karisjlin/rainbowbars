import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;
const reactBuildPath = path.resolve(__dirname, '../../build');
const reactIndexPath = path.join(reactBuildPath, 'index.html');
const BAR_COUNT = 7;
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;
const accountBarColors = new Map<string, string[]>();

async function sendReactApp(res: express.Response) {
  try {
    await fs.access(reactIndexPath);
    res.sendFile(reactIndexPath);
  } catch (error) {
    res.status(503).send('Frontend build not found. Run "npm run build" in the project root.');
  }
}

app.use(cors());
app.use(express.json());
app.use('/static', express.static(path.join(reactBuildPath, 'static')));

app.get('/', async (req, res) => {
  await sendReactApp(res);
});
app.get('/contact', (req, res) => {
  res.send('Hello Contact!');
});
app.get('/about', async (req, res) => {
  await sendReactApp(res);
});

app.get(['/karis', '/Karis'], async (req, res) => {
  await sendReactApp(res);
});
app.get('/account', async (req, res) => {
  await sendReactApp(res);
});

app.get('/api/account/colors/:email', (req, res) => {
  const email = req.params.email?.trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  const colors = accountBarColors.get(email) || [];
  res.json({ colors });
});

app.post('/api/account/colors', (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const colors = Array.isArray(req.body?.colors) ? req.body.colors : null;

  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  if (!colors || colors.length !== BAR_COUNT || colors.some((color: unknown) => typeof color !== 'string')) {
    res.status(400).json({ error: `Exactly ${BAR_COUNT} color values are required.` });
    return;
  }

  const normalizedColors = colors.map((color: string) => color.trim().toUpperCase());
  const hasInvalidColor = normalizedColors.some((color: string) => !HEX_COLOR_REGEX.test(color));
  if (hasInvalidColor) {
    res.status(400).json({ error: 'Each color must be a valid hex code like #A1B2C3.' });
    return;
  }

  accountBarColors.set(email, normalizedColors);
  res.status(200).json({ success: true, colors: normalizedColors });
});

app.post("/register", (req, res) => {
  //Do something with the data
  res.sendStatus(201);
});
app.put("/user/:id", (req, res) => {
  res.sendStatus(200);
});

app.patch("/user/:id", (req, res) => {
  res.sendStatus(200);
});

app.delete("/user/:id", (req, res) => {
  //Deleting
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
