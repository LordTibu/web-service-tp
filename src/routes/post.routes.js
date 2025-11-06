const express = require('express');
const router = express.Router();
const Post = require('../models/post.model');
const auth = require('../middleware/auth.middleware');

// ==============================
// Create a new post
// ==============================
router.post('/', auth, async (req, res) => {
  try {
    const post = new Post({
      content: req.body.content,
      author: req.userId
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating post' });
  }
});

// ==============================
// Cursor encoding/decoding helpers
// ==============================
function encodeCursor(doc) {
  if (!doc) return null;
  return Buffer.from(JSON.stringify({ _id: doc._id })).toString('base64');
}

function decodeCursor(cursor) {
  try {
    const str = Buffer.from(cursor, 'base64').toString('utf8');
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

// ==============================
// Get posts with cursor-based pagination
// ==============================
// Query params:
// - limit (default: 10)
// - cursor (base64 JSON { _id }) - returns posts with _id less than the cursor
router.get('/', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const cursor = req.query.cursor;

    const sort = { _id: -1 }; // consistent descending order
    let filter = {};

    if (cursor) {
      const decoded = decodeCursor(cursor);
      if (decoded && decoded._id) {
        filter = { _id: { $lt: decoded._id } };
      }
    }

    // Fetch one extra document to know if there’s a next page
    const posts = await Post.find(filter)
      .sort(sort)
      .limit(limit + 1)
      .populate('author', 'username')
      .populate('likes', 'username');

    let nextCursor = null;
    let results = posts;

    if (posts.length > limit) {
      // The (limit+1)-th element determines the next cursor
      const lastPost = posts[limit];
      nextCursor = encodeCursor(lastPost);
      results = posts.slice(0, limit);
    }

    res.json({
      posts: results,
      nextCursor,
      limit,
      returned: results.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// ==============================
// Like / Unlike a post
// ==============================
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    if (likeIndex === -1) {
      post.likes.push(req.userId); // like
    } else {
      post.likes.splice(likeIndex, 1); // unlike
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error processing like' });
  }
});

module.exports = router;
