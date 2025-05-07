import mongoose from "mongoose";
import { Question } from "../models/question.model.js";
import { TestSeries } from "../models/test.model.js";
import { User } from "../models/user.model.js";

export const createQuestion = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      solution,
      options,
      rightOption,
      image,
      video,
      shorts,
      testSeriesId
    } = req.body;

    // Basic validation
    if (!title || !options || !rightOption ) {
      return res.status(400).json({
        success: false,
        message: "Title, options, rightOption, and detailedAnswe are required"
      });
    }

    // Validate options array
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "Exactly 4 options are required"
      });
    }

    // Validate rightOption exists in options
    if (!options.includes(rightOption)) {
      return res.status(400).json({
        success: false,
        message: "rightOption must be one of the provided options"
      });
    }

    // Validate shorts if provided
    if (shorts && (!Array.isArray(shorts) || shorts.length > 3)) {
      return res.status(400).json({
        success: false,
        message: "Shorts must be an array of up to 3 strings"
      });
    }

    const newQuestion = new Question({
      title,
      description,
      solution,
      options,
      rightOption,
      image,
      video,
      shorts
    });

    await newQuestion.save();

    // Handle test series linkage
    if (testSeriesId && mongoose.Types.ObjectId.isValid(testSeriesId)) {
      const testSeries = await TestSeries.findById(testSeriesId);

      if (!testSeries) {
        return res.status(404).json({
          success: false,
          message: "Test series not found",
          question: newQuestion
        });
      }

      if (testSeries.user.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to modify this test series",
          question: newQuestion
        });
      }

      await TestSeries.findByIdAndUpdate(
        testSeriesId,
        { $push: { questions: newQuestion._id } }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      question: newQuestion
    });

  } catch (error) {
    console.error("Error creating question:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create question",
      error: error.message
    });
  }
};


// Get all questions created by the user
export const getMyQuestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category || null;
    const difficulty = req.query.difficulty || null;
    const search = req.query.search || "";
    
    let query = { user: userId };
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Add difficulty filter if provided
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Add search functionality
    if (search) {
      query = {
        ...query,
        $or: [
          { question: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const questions = await Question.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalQuestions = await Question.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: questions.length,
      totalPages: Math.ceil(totalQuestions / limit),
      currentPage: page,
      questions
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: error.message
    });
  }
};

// Get a single question by ID
export const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID"
      });
    }
    
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      question
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch question",
      error: error.message
    });
  }
};

// Update a question
export const updateQuestion = async (req, res) => {
  try {
   
    const { _id } = req.body;
    const bodyData = req.body;
    delete bodyData._id;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID"
      });
    }
    
    const question = await Question.findById(_id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }
    
    // Check if the user is the owner of the question

    
    // Validate if updating options and correctAnswer
    if (req.body.options && req.body.correctAnswer !== undefined) {
      if (!Array.isArray(req.body.options) || req.body.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "At least two options are required"
        });
      }
      
      if (req.body.correctAnswer < 0 || req.body.correctAnswer >= req.body.options.length) {
        return res.status(400).json({
          success: false,
          message: "correctAnswer must be a valid index in the options array"
        });
      }
    } else if (req.body.options && req.body.correctAnswer === undefined) {
      // If options are updated but correctAnswer isn't, check if the current correctAnswer is still valid
      if (question.correctAnswer >= req.body.options.length) {
        return res.status(400).json({
          success: false,
          message: "The current correctAnswer is no longer valid with the new options. Please provide a valid correctAnswer."
        });
      }
    } else if (req.body.correctAnswer !== undefined && !req.body.options) {
      // If correctAnswer is updated but options aren't, check if the new correctAnswer is valid
      if (req.body.correctAnswer < 0 || req.body.correctAnswer >= question.options.length) {
        return res.status(400).json({
          success: false,
          message: "correctAnswer must be a valid index in the options array"
        });
      }
    }
    
    const updatedQuestion = await Question.findByIdAndUpdate(
      _id,
      { $set: bodyData },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question: updatedQuestion
    });
  } catch (error) {
    console.error("Error updating question:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update question",
      error: error.message
    });
  }
};

// Delete a question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {testId}=req.body.testId;

    await TestSeries.updateOne(
      {_id:testId},
      { $pull: { questions: id } }
    );

    await Question.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: "Question deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
      error: error.message
    });
  }
};

// Get questions by test series ID
export const getQuestionsByTestSeries = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(testSeriesId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID"
      });
    }
    
    const testSeries = await TestSeries.findById(testSeriesId)
      .populate("questions");
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      count: testSeries.questions.length,
      testSeriesTitle: testSeries.title,
      questions: testSeries.questions
    });
  } catch (error) {
    console.error("Error fetching questions by test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: error.message
    });
  }
};

// Bulk create questions
export const bulkCreateQuestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { questions, testSeriesId } = req.body;
    
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required and cannot be empty"
      });
    }
    
    // Validate all questions before saving
    for (const q of questions) {
      if (!q.question || !q.options || q.correctAnswer === undefined) {
        return res.status(400).json({
          success: false,
          message: "Each question must have question, options, and correctAnswer fields"
        });
      }
      
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Each question must have at least two options"
        });
      }
      
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return res.status(400).json({
          success: false,
          message: "correctAnswer must be a valid index in the options array for all questions"
        });
      }
    }
    
    // Add user ID to each question
    const questionsWithUser = questions.map(q => ({
      ...q,
      user: userId
    }));
    
    // Save all questions
    const savedQuestions = await Question.insertMany(questionsWithUser);
    
    // If a test series ID is provided, add all questions to that test series
    if (testSeriesId && mongoose.Types.ObjectId.isValid(testSeriesId)) {
      const testSeries = await TestSeries.findById(testSeriesId);
      
      if (!testSeries) {
        return res.status(404).json({
          success: false,
          message: "Test series not found",
          questions: savedQuestions
        });
      }
      
      // Check if the user is the owner of the test series
      if (testSeries.user.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this test series",
          questions: savedQuestions
        });
      }
      
      // Add all questions to the test series
      const questionIds = savedQuestions.map(q => q._id);
      await TestSeries.findByIdAndUpdate(
        testSeriesId,
        { $push: { questions: { $each: questionIds } } }
      );
    }
    
    return res.status(201).json({
      success: true,
      message: `Successfully created ${savedQuestions.length} questions`,
      questions: savedQuestions
    });
  } catch (error) {
    console.error("Error bulk creating questions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create questions",
      error: error.message
    });
  }
};