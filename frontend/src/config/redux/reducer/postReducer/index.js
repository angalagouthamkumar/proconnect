import { createSlice } from "@reduxjs/toolkit";
import {
  getallposts,
  deletePost,
  likePost,
  getCommentsByPost,
  addComment,
} from "../../action/postAction";

const initialState = {
  posts: [],
  isError: false,
  postFetched: false,
  Loading: false,
  LoggedIn: false,
  message: null,
  comments: [], // Standardized to lowercase plural
  postId: null,  // Fixed camelCase to match Dashboard (postId)
};

const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    reset: () => initialState,
    resetpostid: (state) => {
      state.postId = null;
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getallposts.pending, (state) => {
        state.loading = true;
      })

      .addCase(getallposts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.posts || [];
      })

      .addCase(getallposts.rejected, (state, action) => {
        state.loading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((post) => post._id !== action.payload);
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const updatedPost = action.payload?.post || action.payload;
        if (updatedPost && updatedPost._id) {
          const index = state.posts.findIndex((p) => p._id === updatedPost._id);
          if (index !== -1) {
            state.posts[index] = updatedPost;
          }
        }
      })
      .addCase(getCommentsByPost.fulfilled, (state, action) => {
        state.postId = action.payload?.postId || null;
        state.comments = action.payload?.comments || [];
      })
      .addCase(addComment.fulfilled, (state, action) => {
        const newComment = action.payload?.comment;
        if (newComment) {
          state.comments.push(newComment);
        }
      });
  },
});

export const { reset, resetpostid } = postSlice.actions;
export default postSlice.reducer;