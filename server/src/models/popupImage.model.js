const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PopupImageSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    imagePath: {
      type: String,
      required: true
    },
    sequence: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    link: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

const PopupImage = mongoose.model('PopupImage', PopupImageSchema);
module.exports = PopupImage; 