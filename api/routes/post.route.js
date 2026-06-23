// post.route.js
import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { create, deletepost, getposts, updatepost } from '../controllers/post.controller.js';
import upload from '../utils/multer.js';

const router = express.Router();

// Create: authenticated users can create (now accepts multipart/form-data / file input 'image')
router.post('/create', verifyToken, upload.single('image'), create);

// Get posts (public)
router.get('/getposts', getposts);

// Delete: admin-only (verifyToken populates req.user)
router.delete('/deletepost/:postId/:userId', verifyToken, deletepost);

// Update: author OR admin (accepts multipart/form-data / file input 'image')
router.put('/updatepost/:postId/:userId', verifyToken, upload.single('image'), updatepost);

export default router;
