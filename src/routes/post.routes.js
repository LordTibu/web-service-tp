const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const auth = require('../middleware/auth.middleware');

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const post = new Post({
      content: req.body.content,
      author: req.userId
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error creating post' });
  }
});

// Helper to decode/encode cursor
function encodeCursor(doc) {
  if (!doc) return null;
  return Buffer.from(JSON.stringify({ createdAt: doc.createdAt, _id: doc._id })).toString('base64');
}

function decodeCursor(cursor) {
  try {
    const str = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// Get posts with cursor-based pagination (infinite scroll safe)
// Requires auth
// Query params:
// - limit (default 10)
// - cursor (base64 JSON { createdAt, _id }) - returns posts older than the cursor
router.get('/', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const cursor = req.query.cursor;

    const sort = { createdAt: -1, _id: -1 };

    let filter = {};
    if (cursor != null && cursor !== '') {
      const decoded = decodeCursor(cursor);
      if (decoded && decoded.createdAt && decoded._id) {
        // Documents strictly older than the cursor (createdAt, then _id to break ties)
        filter = {
          $or: [
            { createdAt: { $lt: new Date(decoded.createdAt) } },
            { createdAt: new Date(decoded.createdAt), _id: { $lt: decoded._id } }
          ]
        };
      }
    }

    const posts = await Post.find(filter)
      .sort(sort)
      .limit(limit + 1) // fetch one extra to know if there is a next page
      .populate('author', 'username')
      .populate('likes', 'username');

    let nextCursor = null;
    let results = posts;
    if (posts.length > limit) {
      const last = posts[limit - 1];
      nextCursor = encodeCursor(last);
      results = posts.slice(0, limit);
    }

    res.json({
      posts: results,
      nextCursor,
      limit: limit,
      returned: results.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Like/Unlike a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    if (likeIndex === -1) {
      // Like the post
      post.likes.push(req.userId);
    } else {
      // Unlike the post
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error processing like' });
  }
});

module.exports = router;