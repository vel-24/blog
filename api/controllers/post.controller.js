// post.controller.js
import Post from '../models/post.model.js';
import { errorHandler } from '../utils/error.js';

/**
 * Create a post
 * - ANY authenticated user can create a post (no admin required)
 * - If a file was uploaded (multer -> req.file), store `/uploads/<filename>` as the image path
 */
export const create = async (req, res, next) => {
  try {
    // Require title & content
    if (!req.body.title || !req.body.content) {
      return next(errorHandler(400, 'Please provide all required fields'));
    }

    // slugify title (simple)
    const slug = String(req.body.title)
      .split(' ')
      .join('-')
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, '');

    // image value: prefer uploaded file if present, else fallback to req.body.image (or model default)
    const imageValue = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    const newPost = new Post({
      ...req.body,
      slug,
      userId: req.user?.id ?? 'unknown',
      image: imageValue,
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    next(error);
  }
};

/**
 * Get posts with optional filters, pagination, sorting
 */
export const getposts = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 9;
    const sortDirection = req.query.order === 'asc' ? 1 : -1;

    const q = {};
    if (req.query.userId) q.userId = req.query.userId;
    if (req.query.category) q.category = req.query.category;
    if (req.query.slug) q.slug = req.query.slug;
    if (req.query.postId) q._id = req.query.postId;
    if (req.query.searchTerm) {
      q.$or = [
        { title: { $regex: req.query.searchTerm, $options: 'i' } },
        { content: { $regex: req.query.searchTerm, $options: 'i' } },
      ];
    }

    const posts = await Post.find(q)
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    const totalPosts = await Post.countDocuments(q);

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const lastMonthPosts = await Post.countDocuments({
      createdAt: { $gte: oneMonthAgo },
    });

    res.status(200).json({
      posts,
      totalPosts,
      lastMonthPosts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE a post
 * - Only admins can delete posts
 */
export const deletepost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return next(errorHandler(404, 'Post not found'));

    const isAuthor = req.user && (String(req.user.id) === String(post.userId));
    const isAdmin = req.user && req.user.isAdmin;

    if (!isAuthor && !isAdmin) {
      return next(errorHandler(403, 'You are not allowed to delete this post'));
    }

    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json({ message: 'The post has been deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * UPDATE a post
 * - Allowed if the requester is the post owner OR an admin
 * - Supports updating image via req.file (multer)
 */
export const updatepost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return next(errorHandler(404, 'Post not found'));

    const isAuthor = req.user && (String(req.user.id) === String(post.userId));
    const isAdmin = req.user && req.user.isAdmin;
    if (!isAuthor && !isAdmin) {
      return next(errorHandler(403, 'You are not allowed to update this post'));
    }

    const imageValue = req.file ? `/uploads/${req.file.filename}` : (req.body.image ?? post.image);

    const updatedData = {
      title: req.body.title ?? post.title,
      content: req.body.content ?? post.content,
      category: req.body.category ?? post.category,
      image: imageValue,
    };

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.postId,
      { $set: updatedData },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    next(error);
  }
};
