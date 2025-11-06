const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const HttpError = require('../utils/http-error');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRATION = '24h';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function registerUser({ username, email, password }) {
  const normalizedUsername = normalizeString(username);
  const normalizedEmail = normalizeString(email).toLowerCase();
  const rawPassword = typeof password === 'string' ? password : '';

  if (!normalizedUsername || !normalizedEmail || !rawPassword) {
    throw new HttpError(400, 'Username, email and password are required');
  }

  const existingUser = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { username: normalizedUsername }
    ]
  });

  if (existingUser) {
    throw new HttpError(400, 'Username or email already exists');
  }

  const user = new User({
    username: normalizedUsername,
    email: normalizedEmail,
    password: rawPassword
  });

  await user.save();

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = normalizeString(email).toLowerCase();
  const rawPassword = typeof password === 'string' ? password : '';

  if (!normalizedEmail || !rawPassword) {
    throw new HttpError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const isValidPassword = await user.comparePassword(rawPassword);

  if (!isValidPassword) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  };
}

module.exports = {
  registerUser,
  loginUser
};
