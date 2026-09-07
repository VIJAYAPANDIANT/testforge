import mongoose from 'mongoose';

const runResultSchema = new mongoose.Schema(
  {
    run: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Run',
      required: [true, 'Run ID is required'],
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['passed', 'failed'],
        message: 'Status must be passed or failed',
      },
      required: [true, 'Status is required'],
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
    durationMs: {
      type: Number,
      default: 0,
    },
    stepResults: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const RunResult = mongoose.model('RunResult', runResultSchema);

export default RunResult;
