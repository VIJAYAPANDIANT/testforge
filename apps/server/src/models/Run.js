import mongoose from 'mongoose';

const runSchema = new mongoose.Schema(
  {
    testCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCase',
      required: [true, 'TestCase ID is required'],
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User owner is required'],
      index: true,
    },
    environment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Environment',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['queued', 'running', 'passed', 'failed'],
        message: 'Status must be queued, running, passed, or failed',
      },
      default: 'queued',
      required: [true, 'Status is required'],
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    exitCode: {
      type: Number,
      default: null,
    },
    stdout: {
      type: String,
      default: '',
    },
    stderr: {
      type: String,
      default: '',
    },
    screenshotPath: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query performance on run histories
runSchema.index({ user: 1, createdAt: -1 });
runSchema.index({ testCase: 1, createdAt: -1 });
runSchema.index({ project: 1, createdAt: -1 });

const Run = mongoose.model('Run', runSchema);

export default Run;
