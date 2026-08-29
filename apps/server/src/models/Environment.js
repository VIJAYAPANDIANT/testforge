import mongoose from 'mongoose';
import validator from 'validator';

const environmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Environment name is required'],
      trim: true,
      minlength: [2, 'Environment name must be at least 2 characters'],
      maxlength: [50, 'Environment name must not exceed 50 characters'],
    },
    baseUrl: {
      type: String,
      required: [true, 'Base URL is required'],
      trim: true,
      validate: {
        validator: (val) =>
          validator.isURL(val, {
            require_protocol: true,
            protocols: ['http', 'https'],
            require_valid_protocol: true,
          }),
        message: 'Base URL must be a valid HTTP or HTTPS URL (e.g. https://example.com)',
      },
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
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate environment names within the same project
environmentSchema.index({ project: 1, name: 1 }, { unique: true });

const Environment = mongoose.model('Environment', environmentSchema);

export default Environment;
