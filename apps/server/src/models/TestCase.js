import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Test case name is required'],
      trim: true,
      minlength: [2, 'Test case name must be at least 2 characters'],
      maxlength: [150, 'Test case name must not exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Test case description must not exceed 1000 characters'],
      default: '',
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
    dsl: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'DSL JSON workflow is required'],
    },
  },
  {
    timestamps: true,
  }
);

const TestCase = mongoose.model('TestCase', testCaseSchema);

export default TestCase;
