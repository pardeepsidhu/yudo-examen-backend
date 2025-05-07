import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    solution:{
      type:String,
      required:true
    },
    options: {
      type: [String], // Array of 4 options
      validate: [opt => opt.length === 4, "Exactly 4 options required"],
      required: true,
    },
    code:{type:String},
    codeLang:{type:String},
    rightOption: {
      type: String,
      required: true,
    },
    image: {
      type: String, // URL of the image (optional)
    },
    video: {
      type: String, // YouTube or hosted video link (optional)
    },
    shorts: {
      type: [String],
      validate: [arr => arr.length <= 3, "Maximum 3 shorts allowed"],
    },
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);
