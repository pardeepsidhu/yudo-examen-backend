import { AttendedTest } from "../models/attenentTest.model.js";
import { TestSeries } from "../models/test.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// Create a new test series
export const createTestSeries = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const { title, description, category, tags, credits, thumbnail } = req.body;
    
    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({ 
        success: false, 
        message: "Title, description, and category are required" 
      });
    }
    
    const newTestSeries = new TestSeries({
      user: userId,
      title,
      description,
      category,
      tags: tags || [],
      credits: credits || [],
      thumbnail: thumbnail || "",
      questions: [],
    });
    
    await newTestSeries.save();
    
    // Add test series to user's services
    await User.findByIdAndUpdate(
      userId,
      { $push: { services: newTestSeries._id } },
      { new: true }
    );
    
    return res.status(201).json({
      success: true,
      message: "Test series created successfully",
      testSeries: newTestSeries,
    });
  } catch (error) {
    console.error("Error creating test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create test series",
      error: error.message,
    });
  }
};

// Get all test series created by the user
export const getMyTestSeries = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const testSeries = await TestSeries.find({ user: userId })
      .populate("questions", "question options correctAnswer")
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: testSeries.length,
      testSeries,
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test series",
      error: error.message,
    });
  }
};

// Get a single test series by ID
export const getMyTestSeriesById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // Get user ID from auth middleware
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID",
      });
    }
    
    const testSeries = await TestSeries.findById(id)
      .populate("questions")
      .populate("user", "name profile");
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }

    // Verify if the requesting user is the owner
    if (testSeries.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only access your own test series",
      });
    }
    
    return res.status(200).json({
      success: true,
      testSeries,
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test series",
      error: error.message,
    });
  }
};

// Update a test series
export const updateTestSeries = async (req, res) => {
  try {
    const { _id } = req.body;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID",
      });
    }
    
    const testSeries = await TestSeries.findById(_id);
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }
    
    // Check if the user is the owner of the test series
    if (testSeries.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this test series",
      });
    }
    
    const updatedTestSeries = await TestSeries.findByIdAndUpdate(
      _id,
      { $set: req.body },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Test series updated successfully",
      testSeries: updatedTestSeries,
    });
  } catch (error) {
    console.error("Error updating test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update test series",
      error: error.message,
    });
  }
};

// Delete a test series
export const deleteTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID",
      });
    }
    
    const testSeries = await TestSeries.findById(id);
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }
    
    // Check if the user is the owner of the test series
    if (testSeries.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this test series",
      });
    }
    
    // Remove test series from user's services
    await User.findByIdAndUpdate(
      userId,
      { $pull: { services: testSeries._id } }
    );
    
    // Delete the test series
    await TestSeries.findByIdAndDelete(id);
    
    return res.status(200).json({
      success: true,
      message: "Test series deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete test series",
      error: error.message,
    });
  }
};

// Add a question to a test series
export const addQuestion = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    const userId = req.user._id;
    const { questionId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(testSeriesId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID",
      });
    }
    
    // if (!mongoose.Types.ObjectId.isValid(questionId)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid question ID",
    //   });
    // }
    
    const testSeries = await TestSeries.findById(testSeriesId);
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }
    
    // Check if the user is the owner of the test series
    if (testSeries.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this test series",
      });
    }
    
    // Check if the question is already in the test series
    if (testSeries.questions.includes(questionId)) {
      return res.status(400).json({
        success: false,
        message: "Question already exists in this test series",
      });
    }
    
    // Add the question to the test series
    const updatedTestSeries = await TestSeries.findByIdAndUpdate(
      testSeriesId,
      { $push: { questions: questionId } },
      { new: true }
    ).populate("questions");
    
    return res.status(200).json({
      success: true,
      message: "Question added to test series successfully",
      testSeries: updatedTestSeries,
    });
  } catch (error) {
    console.error("Error adding question to test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add question to test series",
      error: error.message,
    });
  }
};

// Remove a question from a test series
export const removeQuestion = async (req, res) => {
  try {
    const { testSeriesId, questionId } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(testSeriesId) || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series or question ID",
      });
    }
    
    const testSeries = await TestSeries.findById(testSeriesId);
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }
    
    // Check if the user is the owner of the test series
    if (testSeries.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this test series",
      });
    }
    
    // Check if the question exists in the test series
    if (!testSeries.questions.includes(questionId)) {
      return res.status(400).json({
        success: false,
        message: "Question does not exist in this test series",
      });
    }
    
    // Remove the question from the test series
    const updatedTestSeries = await TestSeries.findByIdAndUpdate(
      testSeriesId,
      { $pull: { questions: questionId } },
      { new: true }
    ).populate("questions");
    
    return res.status(200).json({
      success: true,
      message: "Question removed from test series successfully",
      testSeries: updatedTestSeries,
    });
  } catch (error) {
    console.error("Error removing question from test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove question from test series",
      error: error.message,
    });
  }
};

// Like a test series
export const likeTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID",
      });
    }
    
    const testSeries = await TestSeries.findById(id);
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }
    
    // Check if the user has already liked the test series
    const isLiked = testSeries.likes.includes(userId);
    
    let updatedTestSeries;
    
    if (isLiked) {
      // Unlike the test series
      updatedTestSeries = await TestSeries.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true }
      );
    } else {
      // Like the test series
      updatedTestSeries = await TestSeries.findByIdAndUpdate(
        id,
        { $push: { likes: userId } },
        { new: true }
      );
    }
    
    return res.status(200).json({
      success: true,
      message: isLiked ? "Test series unliked successfully" : "Test series liked successfully",
      testSeries: updatedTestSeries,
    });
  } catch (error) {
    console.error("Error liking/unliking test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to like/unlike test series",
      error: error.message,
    });
  }
};

// Get all public test series (for discovery)
export const getAllTestSeries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category || null;
    const search = req.query.search || "";
    
    let query = {};
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Add search functionality
    if (search) {
      query = {
        ...query,
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const testSeries = await TestSeries.find(query)
      .populate("user", "name profile _id")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const totalTestSeries = await TestSeries.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: testSeries.length,
      totalPages: Math.ceil(totalTestSeries / limit),
      currentPage: page,
      testSeries,
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test series",
      error: error.message,
    });
  }
};

// Mark a test series as attended
export const attendTestSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID",
      });
    }
    
    const testSeries = await TestSeries.findById(id);
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }
    
    // Check if the user has already attended the test series
    const user = await User.findById(userId);
    const hasAttended = user.attended.includes(id);
    
    if (hasAttended) {
      return res.status(400).json({
        success: false,
        message: "You have already attended this test series",
      });
    }
    
    // Mark the test series as attended by the user
    await User.findByIdAndUpdate(
      userId,
      { $push: { attended: id } },
      { new: true }
    );
    
    return res.status(200).json({
      success: true,
      message: "Test series marked as attended successfully",
    });
  } catch (error) {
    console.error("Error marking test series as attended:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark test series as attended",
      error: error.message,
    });
  }
};




//  get test seris thout user permission to attent test
export const getTestSeriesById = async (req, res) => {
  try {
    const { id } = req.params;

    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID",
      });
    }
    
    const testSeries = await TestSeries.findById(id)
      .populate("questions")
      .populate("user", "name profile");
    
    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      testSeries,
    });
  } catch (error) {
    console.error("Error fetching test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test series",
      error: error.message,
    });
  }
};



export const getMyAllTestAttended = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the user and populate attended test series
    const tests = await AttendedTest.find({user:userId}).populate({
     path: 'user', select: 'name profile' 
    })
    .populate({
     path: 'test'
    });

    if (!tests) {
      return res.status(404).json({
        success: false,
        message: "Tests not found",
      });
    }

    return res.status(200).json({
      success: true,
      count: tests.length,
      testSeries: tests,
    });
  } catch (error) {
    console.error("Error fetching attended test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch attended test series",
      error: error.message,
    });
  }
};



// Delete a test series (by owner)
export const deleteMyTest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid test series ID",
      });
    }

    const testSeries = await TestSeries.findById(id);

    if (!testSeries) {
      return res.status(404).json({
        success: false,
        message: "Test series not found",
      });
    }

    // Check if the user is the owner of the test series
    if (testSeries.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this test series",
      });
    }

    // Remove test series from user's services
    await User.findByIdAndUpdate(
      userId,
      { $pull: { services: testSeries._id } }
    );

    // Delete the test series
    await TestSeries.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Test series deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test series:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete test series",
      error: error.message,
    });
  }
};

