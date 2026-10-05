import User from "../models/user.model.js";
import Post from "../models/posts.model.js";
import Comment from "../models/comments.model.js";





export const activecheck = async (req, res) => {
    return res.status(200).json({ message: "Active check successful" });
};

export const createPost = async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findOne({ token });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const postContent = req.body.body || req.body.content;
        if (!postContent || !postContent.trim()) {
            return res.status(400).json({ message: "Post body cannot be empty" });
        }

        const newPost = new Post({
            userId: user._id,
            body: postContent.trim(),
            media: req.file != undefined ? req.file.path : "",
            filetype: req.file != undefined ? req.file.mimetype.split("/")[1] : "",
        });

        await newPost.save();
        return res.status(201).json({ message: "Post created successfully", post: newPost });
    } catch (error) {
        return res.status(500).json({ message: "Post creation failed", error: error.message });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate("userId", "name username email profilePicture");
        return res.status(200).json({ posts });
    } catch (error) {
        return res.status(500).json({ message: "Failed to retrieve posts", error: error.message });
    }
};

export const deletePost = async (req, res) => {
    // Support both postId and post_id from req.body or req.query
    const token = req.body.token || req.query.token;
    const postId = req.body.postId || req.body.post_id || req.query.postId || req.query.post_id;

    try {
        if (!token || !postId) {
            return res.status(400).json({ message: "Token and postId are required" });
        }

        const user = await User.findOne({ token }).select("_id");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const post = await Post.findOne({ _id: postId, userId: user._id });
        if (!post) {
            return res.status(404).json({ message: "Post not found or unauthorized" });
        }

        // FIX: Use deleteOne() instead of deprecated post.remove()
        await Post.deleteOne({ _id: postId });

        return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Post deletion failed", error: error.message });
    }
};

export const commentPost = async (req, res) => {
    try {
        const { token, postId, commentBody } = req.body;

        if (!token || !postId || !commentBody?.trim()) {
            return res.status(400).json({
                message: "Token, postId, and comment are required"
            });
        }

        const user = await User.findOne({ token }).select("_id");

        if (!user) {
            return res.status(401).json({
                message: "User not found. Please log in again."
            });
        }

        const post = await Post.findById(postId).select("_id");

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const newComment = await Comment.create({
            userId: user._id,
            postId: post._id,
            body: commentBody.trim()
        });

        await newComment.populate(
            "userId",
            "name username profilePicture"
        );

        return res.status(201).json({
            message: "Comment added successfully",
            comment: newComment
        });

    } catch (error) {
        console.error("Comment addition failed:", error);

        return res.status(500).json({
            message: "Comment addition failed",
            error: error.message
        });
    }
};




export const getCommentsByPost = async (req, res) => {
    const postId = req.query.post_id || req.query.postId;

    try {
        if (!postId) {
            return res.status(400).json({ message: "Post ID is required" });
        }

        // Query the Comment collection directly filtering by postId
        const comments = await Comment.find({ postId })
            .populate("userId", "name username");

        return res.status(200).json({ comments });
    } catch (error) {
        return res.status(500).json({ 
            message: "Failed to retrieve comments", 
            error: error.message 
        });
    }
};

export const deleteComment = async (req, res) => {
    const { token, commentId } = req.body;
    try {
        const user = await User.findOne({ token: token }).select("_id");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const comment = await Post.findOne({ "comments._id": commentId });
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Unauthorized action" });
        }
        await comment.remove({ "_id": commentId });

        return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Comment deletion failed", error: error.message });
    }
};

export const incrementLikes = async (req, res) => {
    const { postId } = req.body;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.likes += 1;
        await post.save();

        return res.status(200).json({ message: "Post liked successfully", post });
    } catch (error) {
        return res.status(500).json({ message: "Failed to like post", error: error.message });
    }
};
