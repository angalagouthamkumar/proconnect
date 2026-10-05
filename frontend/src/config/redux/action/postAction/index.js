import { createAsyncThunk } from "@reduxjs/toolkit";
import clientServer from "../clientServer"; 

export const getallposts = createAsyncThunk(
  "posts/getAll",
  async (_, ThunkAPI) => {
    try {
      const response = await clientServer.get("/posts/getposts");

      return ThunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      const errorText =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch posts";

      return ThunkAPI.rejectWithValue({
        text: errorText,
        type: "error",
      });
    }
  }
);

export const createPost = createAsyncThunk(
  "post/createPost",
  async (postData, ThunkAPI) => {
    const [file, body] = postData;
    try {
      const formData = new FormData();
      formData.append("token", localStorage.getItem("token"));
      
      // Changed "file" to "media" to match multer uploads.single("media")
      if (file) {
        formData.append("media", file);
      }

      // Append post content text
      formData.append("body", typeof body === "object" ? body.body : body);

      // Endpoint path matching app.use('/posts') + router.route('/post')
      const response = await clientServer.post("/posts/post", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        ThunkAPI.dispatch(getallposts());
        return ThunkAPI.fulfillWithValue("post created");
      } else {
        return ThunkAPI.rejectWithValue("Failed to create post");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Failed to create post";
      return ThunkAPI.rejectWithValue(errorMsg);
    }
  }
);
export const deletePost = createAsyncThunk(
  "post/deletePost",
  async (postData, ThunkAPI) => {
    try {
      const postId = typeof postData === "object" ? postData.postId || postData.post_id || postData._id : postData;
      const token = localStorage.getItem("token");

      const response = await clientServer.delete("/posts/deletepost", {
        data: {
          token: token,
          postId: postId,
        },
      });

      if (response.status === 200 || response.status === 201) {
        ThunkAPI.dispatch(getallposts());
        return ThunkAPI.fulfillWithValue(postId);
      } else {
        return ThunkAPI.rejectWithValue("Failed to delete post");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Failed to delete post";
      return ThunkAPI.rejectWithValue(errorMsg);
    }
  }
);

export const likePost = createAsyncThunk(
  "post/likePost",
  async ({ postId, userId }, ThunkAPI) => {
    try {
      const token = localStorage.getItem("token");

      const response = await clientServer.post("/posts/like", {
        postId,
        userId,
        token,
      });

      if (response.status === 200 || response.status === 201) {
        // Return server response data containing updated post
        return response.data;
      } else {
        return ThunkAPI.rejectWithValue("Failed to update like status");
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || error.message || "Failed to update like status";
      return ThunkAPI.rejectWithValue(errorMsg);
    }
  }
);


export const getCommentsByPost = createAsyncThunk(
  "post/getcomments",
  async (postData, ThunkAPI) => {
    try {
      const id = typeof postData === "object" ? postData.postId || postData.post_id || postData._id : postData;

      const response = await clientServer.get("/posts/getcomments", {
        params: {
          post_id: id,
        },
      });

      return ThunkAPI.fulfillWithValue({
        comments: response.data.comments || response.data,
        postId: id,
      });
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to fetch comments";
      return ThunkAPI.rejectWithValue(errorMsg);
    }
  }
);

export const addComment = createAsyncThunk(
  "post/addComment",
  async (commentData, ThunkAPI) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await clientServer.post("/posts/comment", {
        token: token,
        postId: commentData.postId || commentData.post_id,
        commentBody: commentData.body || commentData.text || commentData.comment,
      });

      return ThunkAPI.fulfillWithValue(response.data);
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to add comment";
      return ThunkAPI.rejectWithValue(errorMsg);
    }
  }
);