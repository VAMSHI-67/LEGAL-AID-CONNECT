const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    // Updated regex: allow modern TLDs (>3 chars) and hyphens in domain segments
    match: [/^[\w.+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/ , 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: ['client', 'lawyer', 'admin'],
    default: 'client'
  },
  avatar: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional user fields
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  zipCode: {
    type: String,
    trim: true,
    match: [/^[0-9]{5,10}$/, 'Please enter a valid zip code']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  
  // Client specific fields
  location: {
    state: {
      type: String,
      required: false // Made optional for now
    },
    district: {
      type: String,
      required: false // Made optional for now
    },
    city: String
  },
  language: {
    type: [String],
    default: ['English']
  },
  
  // Lawyer specific fields
  barNumber: {
    type: String,
    required: function() { return this.role === 'lawyer'; },
    // Removed inline unique because it creates a global unique index including nulls.
    // A proper partial unique index is declared below.
  },
  // Added barState to capture jurisdiction (present in frontend form)
  barState: {
    type: String,
    required: function() { return this.role === 'lawyer'; },
    trim: true
  },
  specialization: {
    type: [String],
    required: function() { return this.role === 'lawyer'; },
    enum: {
      values: [
        'Civil Law', 'Criminal Law', 'Corporate Law', 'Family Law',
        'Property Law', 'Constitutional Law', 'Tax Law', 'Intellectual Property',
        'Labor Law', 'Environmental Law', 'Banking Law', 'Insurance Law',
        'Real Estate Law', 'Immigration Law', 'Consumer Law', 'Cyber Law',
        'Media Law', 'Sports Law', 'Healthcare Law', 'Education Law'
      ],
      message: 'Invalid specialization'
    }
  },
  experience: {
    type: Number,
    required: function() { return this.role === 'lawyer'; },
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },
  languages: {
    type: [String],
    required: function() { return this.role === 'lawyer'; },
    default: ['English']
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalCases: {
    type: Number,
    default: 0,
    min: [0, 'Total cases cannot be negative']
  },
  completedCases: {
    type: Number,
    default: 0,
    min: [0, 'Completed cases cannot be negative']
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative']
  },
  bio: {
    type: String,
    maxlength: [1000, 'Bio cannot exceed 1000 characters']
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuingBody: String,
    year: Number,
    expiryDate: Date
  }],
  
  // Admin specific fields
  permissions: {
    type: [String],
    default: []
  },
  
  // Common fields
  cases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  }],
  
  // Verification fields
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Timestamps
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Indexes (email already has a unique index via schema definition; avoid duplicate)
userSchema.index({ role: 1 });
userSchema.index({ 'location.state': 1, 'location.district': 1 });
userSchema.index({ specialization: 1 });
userSchema.index({ availability: 1 });
// Partial unique index for barNumber only when role is lawyer and barNumber is a string
userSchema.index(
  { barNumber: 1 },
  { unique: true, partialFilterExpression: { role: 'lawyer', barNumber: { $type: 'string' } } }
);
userSchema.index({ rating: -1 });

// Virtual for success rate
userSchema.virtual('successRate').get(function() {
  if (this.role !== 'lawyer' || this.totalCases === 0) return 0;
  return Math.round((this.completedCases / this.totalCases) * 100);
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find lawyers by criteria
userSchema.statics.findLawyers = function(criteria) {
  const query = { role: 'lawyer', isActive: true };
  
  if (criteria.specialization) {
    query.specialization = { $in: Array.isArray(criteria.specialization) ? criteria.specialization : [criteria.specialization] };
  }
  
  if (criteria.location) {
    if (criteria.location.state) query['location.state'] = criteria.location.state;
    if (criteria.location.district) query['location.district'] = criteria.location.district;
  }
  
  if (criteria.availability) {
    query.availability = criteria.availability;
  }
  
  if (criteria.languages) {
    query.languages = { $in: Array.isArray(criteria.languages) ? criteria.languages : [criteria.languages] };
  }
  
  if (criteria.minRating) {
    query.rating = { $gte: criteria.minRating };
  }
  
  if (criteria.minExperience) {
    query.experience = { $gte: criteria.minExperience };
  }
  
  return this.find(query).sort({ rating: -1, experience: -1 });
};

// JSON transformation
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.verificationToken;
  delete userObject.verificationTokenExpires;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpires;
  delete userObject.loginAttempts;
  delete userObject.lockUntil;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 