import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'mfe-demo-secret-key-change-in-production';

// Fake user database
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    roles: ['admin', 'user'],
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    email: 'user@example.com',
    roles: ['user'],
  },
];

app.use(cors());
app.use(express.json());

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required' });
    return;
  }

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    res.status(401).json({ message: 'Invalid username or password' });
    return;
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, roles: user.roles },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    },
  });
});

// GET /api/auth/me — Verify token and return user info
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sub: string;
      username: string;
      roles: string[];
    };

    const user = users.find((u) => u.id === decoded.sub);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
    });
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// GET /api/auth/health — Health check
app.get('/api/auth/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Auth server running at http://localhost:${PORT}`);
  console.log(`  POST /api/auth/login  — Login with { username, password }`);
  console.log(`  GET  /api/auth/me     — Get current user (Bearer token)`);
  console.log(`\nTest accounts:`);
  console.log(`  admin / admin123`);
  console.log(`  user  / user123`);
});
