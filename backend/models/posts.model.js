import mongoose from "mongoose";
import { create } from "pdf-creator-node";

const postSchema = new mongoose.Schema({
  userId : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  body: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  media: {
    type: Array,
    default: []
  },
  active: {
    type: Boolean,
    default: true
  },
  filetype: {
    type: String,
    default: ""
  }
});

const Post = mongoose.model("Post", postSchema);

export default Post;
