import mongoose from "mongoose";

const AttendedTestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    testOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TestSeries",
      required: true
    },
    
    questionsAttended: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
          required: true
        },
        isRight: {
          type: Boolean,
          required: true
        }
      }
    ],
    
    score: {
      type: Number,
      default: 0
    },
    
    completed: {
      type: Boolean,
      default: false
    },
    
    startedAt: {
      type: Date,
      default: Date.now
    },
    
    completedAt: {
      type: Date
    },
    
    timeSpent: {
      type: Number, // in seconds
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for calculating percentage score
AttendedTestSchema.virtual('percentageScore').get(function() {
  if (!this.questionsAttended.length) return 0;
  const correctAnswers = this.questionsAttended.filter(q => q.isRight).length;
  return (correctAnswers / this.questionsAttended.length) * 100;
});

// Index for faster queries
AttendedTestSchema.index({ user: 1, test: 1 });
AttendedTestSchema.index({ completed: 1 });
AttendedTestSchema.index({ completedAt: -1 });

export const AttendedTest = mongoose.model("AttendedTest", AttendedTestSchema);