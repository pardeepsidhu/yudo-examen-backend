import mongoose from "mongoose";

const testSeriesSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    thumbnail: { type: String },
    credits: [{ type: String }],
    category: { type: String, required: true },
    tags: [{ type: String }],
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export const TestSeries = mongoose.model("TestSeries", testSeriesSchema);
