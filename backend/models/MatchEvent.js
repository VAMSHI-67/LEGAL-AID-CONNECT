const mongoose = require('mongoose');

const matchEventSchema = new mongoose.Schema(
  {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
      index: true,
    },
    lawyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    stage: {
      type: String,
      enum: ['candidate', 'shortlist', 'assigned', 'accepted', 'declined', 'completed'],
      default: 'candidate',
    },
    mode: {
      type: String,
      enum: ['rules', 'hybrid', 'ml'],
      default: 'rules',
    },
    modelVersion: {
      type: String,
      default: 'rules',
    },
    ruleScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    mlScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    finalScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    rankPosition: {
      type: Number,
      min: 1,
      default: null,
    },
    shownToUser: {
      type: Boolean,
      default: false,
    },
    assigned: {
      type: Boolean,
      default: false,
    },
    accepted: {
      type: Boolean,
      default: false,
    },
    declined: {
      type: Boolean,
      default: false,
    },
    consultationBooked: {
      type: Boolean,
      default: false,
    },
    caseCompleted: {
      type: Boolean,
      default: false,
    },
    clientRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    reasons: {
      type: [String],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

matchEventSchema.index({ caseId: 1, lawyerId: 1, createdAt: -1 });

module.exports = mongoose.models.MatchEvent || mongoose.model('MatchEvent', matchEventSchema);
