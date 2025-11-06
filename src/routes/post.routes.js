const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/post.model');
const auth = require('../middleware/auth.middleware');

// Encode/decode cursor (based on _id)
function encodeCursor(doc) {
  return doc ? Buffer.from(doc._id.toString()).toString('base64') : null;
}

function decodeCursor(cursor) {
  try {
    return Buffer.from(cursor, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

// Create new post
router.post('/', auth, async (req, res) => {
  try {
    const post = new Post({
      content: req.body.content,
      author: req.userId
    });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Get posts with cursor-based pagination
router.get('/', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const cursor = req.query.cursor;
    const sort = { _id: -1 };
    let filter = {};

    if (cursor) {
      const decoded = decodeCursor(cursor);
      // Validate decoded ID before using it
      if (mongoose.Types.ObjectId.isValid(decoded)) {
        filter._id = { $lt: new mongoose.Types.ObjectId(decoded) };
      }
    }

    const posts = await Post.find(filter)
      .sort(sort)
      .limit(limit + 1)
      .populate('author', 'username')
      .populate('likes', 'username');

    const hasNextPage = posts.length > limit;
    const results = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor = hasNextPage ? encodeCursor(posts[limit - 1]) : null;

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

// Like/unlike a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(req.userId);
    if (index === -1) post.likes.push(req.userId);
    else post.likes.splice(index, 1);

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Error processing like:', err);
    res.status(500).json({ message: 'Error processing like' });
  }
});

module.exports = router;
