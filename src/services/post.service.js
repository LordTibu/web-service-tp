const mongoose = require('mongoose');
const Post = require('../models/post.model');
const HttpError = require('../utils/http-error');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

function normalizeContent(content) {
  return typeof content === 'string' ? content.trim() : '';
}

function encodeCursor(doc) {
  if (!doc || !doc._id) {
    return null;
  }
  return Buffer.from(doc._id.toString()).toString('base64');
}

function decodeCursor(cursor) {
  try {
    return Buffer.from(cursor, 'base64').toString('utf8');
  } catch (error) {
    return null;
  }
}

async function createPost({ content, authorId }) {
  const normalizedContent = normalizeContent(content);

  if (!normalizedContent) {
    throw new HttpError(400, 'Content is required');
  }

  const post = new Post({
    content: normalizedContent,
    author: authorId
  });

  await post.save();
  await post.populate('author', 'username');

  return post;
}

async function listPosts({ limit, cursor }) {
  const parsedLimit = Number.parseInt(limit, 10);
  const appliedLimit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  const rawCursor = typeof cursor === 'string' ? cursor.trim() : null;
  const filter = {};

  if (rawCursor) {
    const decoded = decodeCursor(rawCursor);
    if (!decoded || !mongoose.Types.ObjectId.isValid(decoded)) {
      throw new HttpError(400, 'Invalid cursor');
    }

    filter._id = { $lt: new mongoose.Types.ObjectId(decoded) };
  }

  const posts = await Post.find(filter)
    .sort({ _id: -1 })
    .limit(appliedLimit + 1)
    .populate('author', 'username')
    .populate('likes', 'username');

  const hasNext = posts.length > appliedLimit;
  const results = hasNext ? posts.slice(0, appliedLimit) : posts;
  const nextCursor = hasNext ? encodeCursor(results[results.length - 1]) : null;

  return {
    posts: results,
    nextCursor,
    limit: appliedLimit,
    returned: results.length
  };
}

async function toggleLike({ postId, userId }) {
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new HttpError(400, 'Invalid post id');
  }

  const post = await Post.findById(postId);

  if (!post) {
    throw new HttpError(404, 'Post not found');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const alreadyLiked = post.likes.some((like) => like.equals(userObjectId));

  if (alreadyLiked) {
    post.likes.pull(userObjectId);
  } else {
    post.likes.addToSet(userObjectId);
  }

  await post.save();

  const populatedPost = await Post.findById(postId)
    .populate('author', 'username')
    .populate('likes', 'username');

  return {
    post: populatedPost,
    liked: !alreadyLiked
  };
}

module.exports = {
  createPost,
  listPosts,
  toggleLike
};
