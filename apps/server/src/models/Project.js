import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name must not exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Project description must not exceed 500 characters'],
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User owner is required'],
      index: true,
    },
    autoTest: {
      enabled: {
        type: Boolean,
        default: false,
      },
      branch: {
        type: String,
        trim: true,
        default: 'main',
      },
      trigger: {
        type: String,
        enum: ['webhook'],
        default: 'webhook',
      },
      provider: {
        type: String,
        enum: ['generic', 'github'],
        default: 'generic',
      },
      github: {
        repository: {
          type: String,
          trim: true,
          default: '',
        },
      },
      webhookSecret: {
        type: String,
        default: '',
      },
      testCaseIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TestCase',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model('Project', projectSchema);

export default Project;
