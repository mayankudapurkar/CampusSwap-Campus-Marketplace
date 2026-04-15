const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Listing = require('../models/Listing');
const { protect } = require('../middleware/auth');

// @GET /api/users/:id - Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// @PUT /api/users/profile - Update profile
router.put('/profile/update', protect, async (req, res) => {
  try {
    const { name, bio, phone, department, year, avatar } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (department) updateData.department = department;
    if (year) updateData.year = year;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// @GET /api/users/:id/listings - Get user's listings
router.get('/:id/listings', async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const query = { seller: req.params.id };
    if (status !== 'all') query.status = status;

    const listings = await Listing.find(query).sort('-createdAt').limit(20);
    res.json(listings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

// @GET /api/users/me/saved - Get saved listings
router.get('/me/saved', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedListings',
      populate: { path: 'seller', select: 'name avatar college' },
      match: { status: 'active' }
    });
    res.json(user.savedListings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch saved listings' });
  }
});

// @POST /api/users/:id/rate - Rate a user
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating } = req.body;
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newCount = user.rating.count + 1;
    const newAvg = ((user.rating.average * user.rating.count) + rating) / newCount;

    user.rating = { average: Math.round(newAvg * 10) / 10, count: newCount };
    await user.save({ validateBeforeSave: false });

    res.json({ rating: user.rating });
  } catch (error) {
    res.status(500).json({ message: 'Failed to rate user' });
  }
});

module.exports = router;
