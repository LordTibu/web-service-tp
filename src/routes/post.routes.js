const express = require('express');
const mongoose = require('mongoose');
const Post = require('../models/post.model');
const auth = require('../middleware/auth.middleware');

const router = express.Router();

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

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

router.post('/', auth, async (req, res) => {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const post = new Post({
      content,
      author: req.userId
    });

    await post.save();
    await post.populate('author', 'username');

    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Error creating post' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

    const rawCursor = typeof req.query.cursor === 'string' ? req.query.cursor.trim() : null;
    const filter = {};

    if (rawCursor) {
      const decoded = decodeCursor(rawCursor);
      if (!decoded || !mongoose.Types.ObjectId.isValid(decoded)) {
        return res.status(400).json({ message: 'Invalid cursor' });
      }

      filter._id = { $lt: new mongoose.Types.ObjectId(decoded) };
    }

    const posts = await Post.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate('author', 'username')
      .populate('likes', 'username');

    const hasNext = posts.length > limit;
    const results = hasNext ? posts.slice(0, limit) : posts;
    const nextCursor = hasNext ? encodeCursor(results[results.length - 1]) : null;

    res.json({
      posts: results,
      nextCursor,
      limit,
      returned: results.length
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

router.post('/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid post id' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userObjectId = new mongoose.Types.ObjectId(req.userId);
    const alreadyLiked = post.likes.some(like => like.equals(userObjectId));

    if (alreadyLiked) {
      post.likes.pull(userObjectId);
    } else {
      post.likes.addToSet(userObjectId);
    }

    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate('author', 'username')
      .populate('likes', 'username');

    res.json({
      post: populatedPost,
      liked: !alreadyLiked
    });
  } catch (err) {
    console.error('Error processing like:', err);
    res.status(500).json({ message: 'Error processing like' });
  }
});

module.exports = router;
