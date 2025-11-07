const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const postRoutes = require('./routes/post.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

app.get('/', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;
  const message = isServerError ? 'Server error' : err.message || 'Server error';

  if (isServerError) {
    console.error(err.stack || err);
  }

  res.status(statusCode).json({ message });
});

module.exports = app;
