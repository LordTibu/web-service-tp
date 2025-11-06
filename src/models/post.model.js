const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.likesCount = Array.isArray(ret.likes) ? ret.likes.length : 0;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

postSchema.virtual('likesCount').get(function likesCount() {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});

postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
