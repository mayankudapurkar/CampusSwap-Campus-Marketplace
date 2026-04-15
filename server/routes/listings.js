// ============================================================
// REPLACEMENT FILE: server/routes/listings.js
// KEY FIX: Route /user/me must come BEFORE /user/:userId
//          otherwise Express matches "me" as a userId param.
// ============================================================
const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect, requireVerified } = require('../middleware/auth');

// ── Helpers ──────────────────────────────────────────────────────────
async function uploadToCloudinary(base64Images) {
  try {
    const cloudinary = require('cloudinary').v2;
    const results = [];
    for (const img of base64Images.slice(0, 5)) {
      const r = await cloudinary.uploader.upload(img, {
        folder: 'campus-marketplace',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }]
      });
      results.push({ url: r.secure_url, public_id: r.public_id });
    }
    return results;
  } catch {
    // Fallback: return base64 URLs as-is (works locally, not for prod)
    return base64Images.slice(0, 5).map(b => ({ url: b, public_id: null }));
  }
}

// ── GET /api/listings  — browse with filters ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, category, type, condition,
            minPrice, maxPrice, search, sort = '-createdAt', college } = req.query;

    const query = { status: 'active' };
    if (college) query.college = college;
    if (category && category !== 'all') query.category = category;
    if (type && type !== 'all') query.type = type;
    if (condition && condition !== 'all') query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('seller', 'name avatar college rating isOnline')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ listings, pagination: { total, page: Number(page), pages: Math.ceil(total / limit), limit: Number(limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

// ── POST /api/listings/upload-images  — must be before /:id ──────────
router.post('/upload-images', protect, async (req, res) => {
  try {
    const { images } = req.body;
    if (!images || !Array.isArray(images)) return res.status(400).json({ message: 'Images array required' });
    const uploaded = await uploadToCloudinary(images);
    res.json({ images: uploaded });
  } catch (err) {
    res.status(500).json({ message: 'Image upload failed' });
  }
});

// ── GET /api/listings/user/me  — OWN listings (FIXED: before /user/:userId) ──
router.get('/user/me', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Build query — no status filter = return ALL statuses for the owner
    const query = { seller: req.user._id };
    if (status && status !== 'all') query.status = status;

    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('seller', 'name avatar college rating')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ listings, total });
  } catch (err) {
    console.error('GET /user/me error:', err);
    res.status(500).json({ message: 'Failed to fetch your listings' });
  }
});

// ── GET /api/listings/user/:userId  — any user's listings ────────────
router.get('/user/:userId', async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 12 } = req.query;
    const query = { seller: req.params.userId };
    if (status !== 'all') query.status = status;

    const listings = await Listing.find(query)
      .populate('seller', 'name avatar college rating')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Listing.countDocuments(query);
    res.json({ listings, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

// ── GET /api/listings/:id  — single listing ───────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name avatar college department year rating totalSales isOnline lastSeen createdAt');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    listing.views += 1;
    await listing.save({ validateBeforeSave: false });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listing' });
  }
});

// ── POST /api/listings  — create ─────────────────────────────────────
router.post('/', protect, requireVerified, async (req, res) => {
  try {
    const { title, description, price, type, exchangeFor, category, condition,
            images, tags, subject, semester, negotiable } = req.body;

    const listing = await Listing.create({
      title, description,
      price: type !== 'free' ? Number(price) : 0,
      type, exchangeFor, category, condition,
      images: images || [],
      tags: tags || [],
      subject, semester,
      negotiable: negotiable || false,
      seller: req.user._id,
      college: req.user.college
    });

    await listing.populate('seller', 'name avatar college rating');
    res.status(201).json(listing);
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ message: err.message || 'Failed to create listing' });
  }
});

// ── PUT /api/listings/:id  — update ──────────────────────────────────
router.put('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const updated = await Listing.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).populate('seller', 'name avatar college rating');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update listing' });
  }
});

// ── DELETE /api/listings/:id ──────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete listing' });
  }
});

// ── POST /api/listings/:id/save ───────────────────────────────────────
router.post('/:id/save', protect, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const user = await User.findById(req.user._id);
    const isSaved = user.savedListings.map(id => id.toString()).includes(req.params.id);

    if (isSaved) {
      user.savedListings = user.savedListings.filter(id => id.toString() !== req.params.id);
      listing.savedBy = listing.savedBy.filter(id => id.toString() !== req.user._id.toString());
    } else {
      user.savedListings.push(req.params.id);
      listing.savedBy.push(req.user._id);
      if (listing.seller.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: listing.seller,
          sender: req.user._id,
          type: 'listing_saved',
          title: 'Someone saved your listing',
          body: `${req.user.name} saved "${listing.title}"`,
          relatedListing: listing._id
        });
      }
    }

    await user.save({ validateBeforeSave: false });
    await listing.save({ validateBeforeSave: false });
    res.json({ saved: !isSaved, savedCount: listing.savedBy.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save listing' });
  }
});

// ── PATCH /api/listings/:id/status ───────────────────────────────────
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    listing.status = status;
    await listing.save({ validateBeforeSave: false });
    if (status === 'sold') await User.findByIdAndUpdate(req.user._id, { $inc: { totalSales: 1 } });
    res.json({ message: `Listing marked as ${status}`, listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status' });
  }
});

module.exports = router;
