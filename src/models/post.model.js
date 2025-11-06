const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (doc, ret) => {
    // add likesCount, remove __v
    try {
      ret.likesCount = Array.isArray(ret.likes) ? ret.likes.length : 0;
    } catch (e) {
      ret.likesCount = 0;
    }
    delete ret.__v;
    return ret;
  } },
  toObject: { virtuals: true }
});

// Virtual for likes count (useful when not using toJSON transform)
postSchema.virtual('likesCount').get(function() {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});

module.exports = mongoose.model('Post', postSchema);