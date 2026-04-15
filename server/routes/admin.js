const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Review = require('../models/Review');
const { Message, Conversation } = require('../models/Chat');
const Notification = require('../models/Notification');
const { adminProtect, superAdminOnly } = require('../middleware/adminAuth');

const generateAdminToken = (id) =>
  jwt.sign({ id }, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_admin', { expiresIn: '8h' });

// ─── AUTH ───────────────────────────────────────────────────────────

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin || !admin.isActive) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await admin.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    res.json({
      token: generateAdminToken(admin._id),
      admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed' });
  }
});

// GET /api/admin/me
router.get('/me', adminProtect, (req, res) => res.json({ admin: req.admin }));

// ─── DASHBOARD STATS ────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', adminProtect, async (req, res) => {
  try {
    const [
      totalUsers, verifiedUsers, totalListings, activeListings,
      soldListings, totalConversations, totalMessages,
      usersToday, listingsToday
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Listing.countDocuments({ status: 'sold' }),
      Conversation.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } }),
      Listing.countDocuments({ createdAt: { $gte: new Date(Date.now() - 86400000) } })
    ]);

    // Category breakdown
    const categoryBreakdown = await Listing.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Listings per day (last 7 days)
    const last7Days = await Listing.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers, verifiedUsers, totalListings, activeListings,
      soldListings, totalConversations, totalMessages,
      usersToday, listingsToday, categoryBreakdown, last7Days
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// ─── USERS MANAGEMENT ───────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', adminProtect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, verified, sort = '-createdAt' } = req.query;
    const query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } }
    ];
    if (verified !== undefined && verified !== 'all') query.isVerified = verified === 'true';

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -verificationToken -resetPasswordToken')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ users, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', adminProtect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [listings, reviews] = await Promise.all([
      Listing.find({ seller: req.params.id }).sort('-createdAt').limit(10),
      Review.find({ reviewee: req.params.id }).populate('reviewer', 'name avatar').sort('-createdAt').limit(10)
    ]);

    res.json({ user, listings, reviews });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// PATCH /api/admin/users/:id/verify
router.patch('/users/:id/verify', adminProtect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User verified', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to verify user' });
  }
});

// PATCH /api/admin/users/:id/suspend  (super admin only)
router.patch('/users/:id/suspend', adminProtect, superAdminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    // Mark all active listings as suspended
    await Listing.updateMany({ seller: req.params.id, status: 'active' }, { status: 'expired' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: false, bio: `[SUSPENDED] ${reason || ''}` },
      { new: true }
    );
    res.json({ message: 'User suspended', user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to suspend user' });
  }
});

// DELETE /api/admin/users/:id  (super admin only)
router.delete('/users/:id', adminProtect, superAdminOnly, async (req, res) => {
  try {
    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Listing.deleteMany({ seller: req.params.id }),
      Conversation.deleteMany({ participants: req.params.id }),
      Notification.deleteMany({ recipient: req.params.id })
    ]);
    res.json({ message: 'User and all associated data deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// ─── LISTINGS MANAGEMENT ────────────────────────────────────────────

// GET /api/admin/listings
router.get('/listings', adminProtect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, category, sort = '-createdAt' } = req.query;
    const query = {};
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    const total = await Listing.countDocuments(query);
    const listings = await Listing.find(query)
      .populate('seller', 'name email college avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ listings, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch listings' });
  }
});

// PATCH /api/admin/listings/:id/status
router.patch('/listings/:id/status', adminProtect, async (req, res) => {
  try {
    const { status } = req.body;
    const listing = await Listing.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ message: `Listing marked as ${status}`, listing });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update listing status' });
  }
});

// DELETE /api/admin/listings/:id
router.delete('/listings/:id', adminProtect, async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete listing' });
  }
});

// ─── ADMIN MANAGEMENT (super admin only) ────────────────────────────

// POST /api/admin/admins  — create new admin
router.post('/admins', adminProtect, superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const exists = await Admin.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Admin with this email already exists' });
    const admin = await Admin.create({ name, email, password, role: role || 'moderator' });
    res.status(201).json({ message: 'Admin created', admin: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

// GET /api/admin/admins
router.get('/admins', adminProtect, superAdminOnly, async (req, res) => {
  try {
    const admins = await Admin.find().sort('-createdAt');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
});

module.exports = router;
