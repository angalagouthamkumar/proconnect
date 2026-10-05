import { Router } from 'express';
import multer from 'multer';
import { activecheck, createPost, getAllPosts, deletePost, commentPost, getCommentsByPost, deleteComment, incrementLikes } from '../controllers/posts.controller.js';

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // FIX: Clean spaces and special characters from filename
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, Date.now() + "-" + cleanFileName);
  }
});

const uploads = multer({ storage: storage });

router.route('/').get(activecheck).post(uploads.single("media"), createPost);
router.route('/post').post(uploads.single("media"), createPost);
router.route('/getposts').get(getAllPosts);
router.route('/deletepost').delete(deletePost);
router.route('/comment').post(commentPost);
router.route('/getcomments').get(getCommentsByPost);
router.route('/deletecomment').delete(deleteComment);
router.route('/like').post(incrementLikes);

export default router;