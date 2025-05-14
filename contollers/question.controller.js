import mongoose from "mongoose";
import { Question } from "../models/question.model.js";
import { TestSeries } from "../models/test.model.js";
import { AttendedTest } from "../models/attenentTest.model.js";
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
    const { id } = req.params;
    const userId = req.user._id;
    console.log(id+" "+userId)
    // if (!mongoose.Types.ObjectId.isValid(id)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid question ID"
    //   });
    // }
    
    const question = await Question.findById(id);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }
    
    
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
      id,
      { $set: req.body },
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
    const userId = req.user._id;
    
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
    
    // Check if the user is the owner of the question
    if (question.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this question"
      });
    }
    
    // Remove the question from any test series it belongs to
    await TestSeries.updateMany(
      { questions: id },
      { $pull: { questions: id } }
    );
    
    // Delete the question
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



export const getCurrentTestAttempt = async (req, res) => {
  try {
    const user = req.user._id;
    const { testId } = req.params;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    // Check if test exists and get its questions
    const test = await TestSeries.findById(testId)
      .populate({
        path: 'questions',
      })
      .populate({
        path: 'user'
      });
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }
    
    // Find existing test attempt
let testAttempt = await AttendedTest.findOne({
  user,
  test: testId,
  completed: false
})
  .populate({
    path: 'questionsAttended.question'
  })
  .populate({
    path: 'user'
  })
  .populate({
    path: 'test',
    populate: {
      path: 'questions' // because `questions` is an array of ObjectIds directly
    }
  })
  .populate({
    path: 'testOwner'
  });


    
    // If no test attempt exists, create a new one
    if (!testAttempt) {
      testAttempt = new AttendedTest({
        user,
        test: testId,
        questionsAttended: [],
        testOwner: test.user, // Fixed: use test.user as testOwner
        startedAt: new Date()
      });
      await testAttempt.save();
      
      // Populate the newly created test attempt
      testAttempt = await AttendedTest.findById(testAttempt._id)
        .populate({
          path: 'questionsAttended.question'
        })
        .populate({
          path: 'user',
          select: 'name email profile'
        })
        .populate({
          path: 'test'
        })
        .populate({
          path: "testOwner",
          select: 'name email profile'
        });
    }
    
    // Get progress information
    const totalQuestions = test.questions.length;
    const answeredQuestions = testAttempt.questionsAttended.length;
    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    // Get answered question IDs for frontend reference
    const answeredQuestionIds = testAttempt.questionsAttended.map(q => 
      q.question ? q.question._id.toString() : null
    ).filter(Boolean);
    
    // Convert to plain object to allow adding properties
    const testAttemptObj = testAttempt.toObject();
    
    return res.status(200).json({
      success: true,
      data: {
        ...testAttemptObj,
        totalQuestions,
        answeredQuestions,
        progress,
        answeredQuestionIds
      },
      message: testAttempt.questionsAttended.length === 0 ? "New test attempt created" : "Existing test attempt found"
    });
  } catch (error) {
    console.error("Error handling test attempt:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to handle test attempt",
      error: error.message
    });
  }
};

export const answerQuestion = async (req, res) => {
  try {
    const user = req.user._id;
    const { testId, questionId, right } = req.body;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    // Validate input
    if (!testId || !questionId || right === undefined) {
      return res.status(400).json({
        success: false, 
        message: "testId, questionId, and right are required"
      });
    }
    
    // Check if test exists
    const test = await TestSeries.findById(testId)
      .populate({
        path: 'questions',
        select: 'title description options rightOption image video shorts solution'
      })
      .populate('user'); // Populate test creator for testOwner reference
    
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found"
      });
    }
    
    // Verify question belongs to test
    const questionExists = test.questions.some(q => q._id.toString() === questionId);
    if (!questionExists) {
      return res.status(400).json({
        success: false,
        message: "Question does not belong to this test"
      });
    }
    
    // Find existing test attempt
    let testAttempt = await AttendedTest.findOne({
      user,
      test: testId,
      completed: false
    }).populate({
      path: 'questionsAttended.question',
      select: 'title description options rightOption image video shorts solution'
    });
    
    if (!testAttempt) {
      // Create new test attempt if none exists
      testAttempt = new AttendedTest({
        user,
        test: testId,
        questionsAttended: [],
        testOwner: test.user._id, // Set testOwner properly
        startedAt: new Date()
      });
    }
    
    // Check if question already answered
    const existingAnswerIndex = testAttempt.questionsAttended.findIndex(
      q => q.question && q.question._id.toString() === questionId
    );
    
    if (existingAnswerIndex !== -1) {
      // Update existing answer
      testAttempt.questionsAttended[existingAnswerIndex].isRight = right;
    } else {
      // Add new answer
      testAttempt.questionsAttended.push({
        question: questionId,
        isRight: right
      });
    }
    
    // Calculate score
    const correctAnswers = testAttempt.questionsAttended.filter(q => q.isRight).length;
    testAttempt.score = correctAnswers;
    
    // Check if all questions are answered
    const allQuestionsAnswered = test.questions.length === testAttempt.questionsAttended.length;
    if (allQuestionsAnswered) {
      testAttempt.completed = true;
      testAttempt.completedAt = new Date();
      
      // Calculate time spent in seconds
      const startTime = new Date(testAttempt.startedAt).getTime();
      const endTime = new Date(testAttempt.completedAt).getTime();
      testAttempt.timeSpent = Math.floor((endTime - startTime) / 1000);
      
      // Update user's attended tests
      await User.findByIdAndUpdate(user, {
        $addToSet: { attended: testId }
      });
    }
    
    await testAttempt.save();
    
    // Get progress information
    const totalQuestions = test.questions.length;
    const answeredQuestions = testAttempt.questionsAttended.length;
    const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    // Get answered question IDs for frontend reference
    const answeredQuestionIds = testAttempt.questionsAttended
      .map(q => q.question ? q.question._id.toString() : null)
      .filter(Boolean);
    
    // Convert to object to allow adding custom properties to response
    const testAttemptObj = testAttempt.toObject();
    
    return res.status(200).json({
      success: true,
      message: "Answer recorded successfully",
      data: {
        testAttempt: testAttemptObj,
        test: {
          _id: test._id,
          title: test.title,
          description: test.description,
          questions: test.questions,
          totalQuestions,
          answeredQuestions,
          progress,
          answeredQuestionIds
        },
        progress: {
          totalQuestions,
          answeredQuestions,
          progress,
          correctAnswers,
          score: testAttempt.score
        },
        isCompleted: testAttempt.completed
      }
    });
   
  } catch (error) {
    console.error("Error recording answer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record answer",
      error: error.message
    });
  }
};

export const getTestResults = async (req, res) => {
  try {
    const user = req.user._id;
    const { testId } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

   
  let testAttempt = await AttendedTest.findOne({
      user,
      test: testId,
      completed: false
    }).populate({
      path: 'questionsAttended.question',
      select: 'title description options rightOption image video shorts solution'
    });
    
    if (!testAttempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...testAttempt.toObject(),
        percentageScore: testAttempt.percentageScore
      }
    });

  } catch (error) {
    console.error("Error fetching test results:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test results",
      error: error.message
    });
  }
};

export const getUserTestHistory = async (req, res) => {
  try {
    const user = req.user._id;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const testHistory = await AttendedTest.find({ user })
      .populate({
        path: 'test',
        select: 'title description'
      })
      .sort({ completedAt: -1 });

    return res.status(200).json({
      success: true,
      data: testHistory
    });

  } catch (error) {
    console.error("Error fetching test history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test history",
      error: error.message
    });
  }
};

