const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'jpg', 'png', 'other'],
    required: true
  },
  url: {
    type: String,
    required: [true, 'Document URL is required']
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  isPublic: {
    type: Boolean,
    default: false
  }
});

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image'],
    default: 'text'
  },
  attachments: [documentSchema],
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const caseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Case description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Case category is required'],
    enum: {
      values: [
        'Civil Law', 'Criminal Law', 'Corporate Law', 'Family Law',
        'Property Law', 'Constitutional Law', 'Tax Law', 'Intellectual Property',
        'Labor Law', 'Environmental Law', 'Banking Law', 'Insurance Law',
        'Real Estate Law', 'Immigration Law', 'Consumer Law', 'Cyber Law',
        'Media Law', 'Sports Law', 'Healthcare Law', 'Education Law'
      ],
      message: 'Invalid case category'
    }
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Client ID is required']
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'under_review', 'completed', 'cancelled', 'escalated'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  location: {
    state: {
      type: String,
      required: [true, 'State is required']
    },
    district: {
      type: String,
      required: [true, 'District is required']
    },
    city: String
  },
  documents: [documentSchema],
  messages: [messageSchema],
  estimatedDuration: {
    type: Number, // in days
    min: [1, 'Estimated duration must be at least 1 day']
  },
  budget: {
    min: {
      type: Number,
      min: [0, 'Minimum budget cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum budget cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Case timeline
  timeline: [{
    action: {
      type: String,
      required: true
    },
    description: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Case outcomes
  outcome: {
    status: {
      type: String,
      enum: ['successful', 'partially_successful', 'unsuccessful', 'settled', 'dismissed'],
      default: null
    },
    description: String,
    resolutionDate: Date,
    finalAmount: Number
  },
  
  // Case ratings and reviews
  clientRating: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    review: String,
    reviewDate: Date
  },
  
  lawyerRating: {
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    review: String,
    reviewDate: Date
  },
  
  // Case deadlines
  deadlines: [{
    title: String,
    description: String,
    dueDate: Date,
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedDate: Date
  }],
  
  // Case notes
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Case assignments
  assignedAt: Date,
  startedAt: Date,
  completedAt: Date,
  
  // Case visibility
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Case statistics
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Matchmaking metadata (optional, added after initial schema)
caseSchema.add({
  matchInfo: {
    score: { type: Number, min: 0, max: 100 },
    reasons: [{ type: String }],
    assignedAt: { type: Date }
  },
  assignmentHistory: [
    {
      lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      score: Number,
      reasons: [String],
      assignedAt: Date,
      unassignedAt: Date,
      reason: String
    }
  ],
  lawyerAccepted: { type: Boolean, default: false }
});

// Indexes
caseSchema.index({ clientId: 1 });
caseSchema.index({ lawyerId: 1 });
caseSchema.index({ category: 1 });
caseSchema.index({ status: 1 });
caseSchema.index({ priority: 1 });
caseSchema.index({ 'location.state': 1, 'location.district': 1 });
caseSchema.index({ createdAt: -1 });
caseSchema.index({ tags: 1 });

// Virtual for case duration
caseSchema.virtual('duration').get(function() {
  if (!this.startedAt || !this.completedAt) return null;
  return Math.ceil((this.completedAt - this.startedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for case age
caseSchema.virtual('age').get(function() {
  return Math.ceil((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for budget range
caseSchema.virtual('budgetRange').get(function() {
  if (!this.budget) return null;
  return `${this.budget.currency} ${this.budget.min} - ${this.budget.max}`;
});

// Pre-save middleware to update timeline
caseSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      action: `Status changed to ${this.status}`,
      description: `Case status updated to ${this.status}`,
      performedBy: this.lawyerId || this.clientId
    });
  }
  
  if (this.isModified('lawyerId') && this.lawyerId) {
    this.timeline.push({
      action: 'Lawyer assigned',
      description: 'A lawyer has been assigned to this case',
      performedBy: this.lawyerId
    });
    this.assignedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'in_progress' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Static method to find cases by criteria
caseSchema.statics.findByCriteria = function(criteria) {
  const query = {};
  
  if (criteria.category) {
    query.category = criteria.category;
  }
  
  if (criteria.status) {
    query.status = criteria.status;
  }
  
  if (criteria.priority) {
    query.priority = criteria.priority;
  }
  
  if (criteria.location) {
    if (criteria.location.state) query['location.state'] = criteria.location.state;
    if (criteria.location.district) query['location.district'] = criteria.location.district;
  }
  
  if (criteria.clientId) {
    query.clientId = criteria.clientId;
  }
  
  if (criteria.lawyerId) {
    query.lawyerId = criteria.lawyerId;
  }
  
  if (criteria.tags) {
    query.tags = { $in: Array.isArray(criteria.tags) ? criteria.tags : [criteria.tags] };
  }
  
  if (criteria.budget) {
    if (criteria.budget.min) query['budget.min'] = { $gte: criteria.budget.min };
    if (criteria.budget.max) query['budget.max'] = { $lte: criteria.budget.max };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to add message
caseSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  return this.save();
};

// Instance method to add document
caseSchema.methods.addDocument = function(documentData) {
  this.documents.push(documentData);
  return this.save();
};

// Instance method to update status
caseSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  this.timeline.push({
    action: `Status changed to ${newStatus}`,
    description: `Case status updated to ${newStatus}`,
    performedBy: userId
  });
  return this.save();
};

// JSON transformation
caseSchema.methods.toJSON = function() {
  const caseObject = this.toObject();
  return caseObject;
};

module.exports = mongoose.model('Case', caseSchema); 