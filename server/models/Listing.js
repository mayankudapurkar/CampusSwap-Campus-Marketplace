const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: function() { return this.type === 'sell'; },
    min: [0, 'Price cannot be negative']
  },
  type: {
    type: String,
    enum: ['sell', 'exchange', 'free'],
    required: [true, 'Listing type is required']
  },
  exchangeFor: {
    type: String,
    required: function() { return this.type === 'exchange'; }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'textbooks',
      'notes',
      'electronics',
      'lab-equipment',
      'stationery',
      'sports',
      'clothing',
      'furniture',
      'cycles',
      'calculators',
      'software',
      'other'
    ]
  },
  condition: {
    type: String,
    enum: ['new', 'like-new', 'good', 'fair', 'poor'],
    required: [true, 'Condition is required']
  },
  images: [{
    url: String,
    public_id: String
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  college: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'reserved', 'expired'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [String],
  subject: String,
  semester: String,
  negotiable: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for search
listingSchema.index({ title: 'text', description: 'text', tags: 'text' });
listingSchema.index({ college: 1, category: 1, status: 1 });
listingSchema.index({ seller: 1 });

listingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Listing', listingSchema);
