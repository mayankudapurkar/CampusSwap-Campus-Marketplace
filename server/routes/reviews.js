const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/reviews/user/:userId  — get all reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar college')
      .populate('listing', 'title images')
      .sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// POST /api/reviews  — submit a review
router.post('/', protect, async (req, res) => {
  try {
    const { revieweeId, listingId, rating, comment } = req.body;

    if (revieweeId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Prevent duplicate reviews for same listing
    const existing = await Review.findOne({
      reviewer: req.user._id,
      reviewee: revieweeId,
      listing: listingId || null
    });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this seller for this listing' });
    }

    const review = await Review.create({
      reviewer: req.user._id,
      reviewee: revieweeId,
      listing: listingId || null,
      rating,
      comment: comment?.trim()
    });

    await review.populate('reviewer', 'name avatar college');
    if (listingId) await review.populate('listing', 'title images');

    // Recalculate user rating
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(revieweeId, {
      'rating.average': Math.round(avg * 10) / 10,
      'rating.count': allReviews.length
    });

    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Duplicate review not allowed' });
    res.status(500).json({ message: 'Failed to submit review' });
  }
});

// DELETE /api/reviews/:id  — delete own review
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const revieweeId = review.reviewee;
    await review.deleteOne();

    // Recalculate
    const remaining = await Review.find({ reviewee: revieweeId });
    const avg = remaining.length ? remaining.reduce((s, r) => s + r.rating, 0) / remaining.length : 0;
    await User.findByIdAndUpdate(revieweeId, {
      'rating.average': Math.round(avg * 10) / 10,
      'rating.count': remaining.length
    });

    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

module.exports = router;
