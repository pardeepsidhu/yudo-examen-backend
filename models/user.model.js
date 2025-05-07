import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId; // Password required if not using Google login
    },
  },
  profile: {
    type: String,
    default: '',
  },
  googleId: {
    type: String,
    default: null,
  },
  otp: {
    type: String,
    default: '',
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
  }],
  attended: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
  }],
}, { timestamps: true });

export const User =mongoose.model('User', userSchema);
