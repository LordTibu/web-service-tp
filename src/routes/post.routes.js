const express = require('express');
const auth = require('../middleware/auth.middleware');
const postController = require('../controllers/post.controller');

const router = express.Router();

router.post('/', auth, postController.createPost);
router.get('/', auth, postController.getPosts);
router.post('/:postId/like', auth, postController.toggleLike);

module.exports = router;
