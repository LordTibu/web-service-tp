const postService = require('../services/post.service');

async function createPost(req, res, next) {
  try {
    const post = await postService.createPost({
      content: req.body.content,
      authorId: req.userId
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
}

async function getPosts(req, res, next) {
  try {
    const result = await postService.listPosts({
      limit: req.query.limit,
      cursor: req.query.cursor
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function toggleLike(req, res, next) {
  try {
    const result = await postService.toggleLike({
      postId: req.params.postId,
      userId: req.userId
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPost,
  getPosts,
  toggleLike
};
