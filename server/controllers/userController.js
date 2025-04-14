import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import Stripe from "stripe";
import Course from "../models/Course.js";
import { CourseProgress } from "../models/CourseProgress.js";
import cloudinary from "../configs/cloudinary.js";
import fs from "fs";

// Get User Data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: 'User Not Found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Users Enrolled Courses With Lecture Links
export const userEnrolledCourses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const userData = await User.findById(userId).populate('enrolledCourses');

    res.json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Cleaned Purchase Course
export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }

    const courseData = await Course.findById(courseId);
    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (userData.enrolledCourses.includes(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'User already enrolled in this course'
      });
    }

    const amount = parseFloat(
      (courseData.coursePrice - (courseData.discount * courseData.coursePrice / 100)).toFixed(2)
    );

    const purchase = await Purchase.create({
      courseId: courseData._id,
      userId,
      amount,
      status: 'pending'
    });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = process.env.CURRENCY?.toLowerCase() || 'usd';

    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: courseData.courseTitle,
          },
          unit_amount: Math.floor(amount * 100),
        },
        quantity: 1,
      },
    ];

    const cleanOrigin = origin?.endsWith('/') ? origin.slice(0, -1) : origin || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      success_url: `${cleanOrigin}/loading/my-enrollments`,
      cancel_url: `${cleanOrigin}/course/${courseId}`,
      line_items,
      mode: 'payment',
      metadata: {
        purchaseId: purchase._id.toString(),
        courseId: courseData._id.toString(),
        userId: userId.toString(),
      },
    });

    res.status(200).json({
      success: true,
      session_url: session.url
    });

  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Something went wrong during purchase'
    });
  }
};

// Update User Course Progress
export const updateUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId, lectureId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    if (progressData) {
      if (progressData.lectureCompleted.includes(lectureId)) {
        return res.json({ success: false, message: 'Lecture Already Completed' });
      }
      progressData.lectureCompleted.push(lectureId);
      await progressData.save();
    } else {
      await CourseProgress.create({
        userId,
        courseId,
        lectureCompleted: [lectureId]
      });
    }
    res.json({ success: true, message: 'Progress Updated' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get User Course Progress
export const getUserCourseProgress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { courseId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });

    res.json({ success: true, progressData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add User Ratings to Course
export const addUserRating = async (req, res) => {
    const userId = req.auth.userId;
    const { courseId, rating } = req.body;
  
    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid rating details' 
      });
    }
  
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ 
          success: false, 
          message: 'Course not found' 
        });
      }
  
      // Check if user is enrolled
      const user = await User.findById(userId);
      if (!user || !user.enrolledCourses.includes(courseId)) {
        return res.status(403).json({ 
          success: false, 
          message: 'You must be enrolled to rate this course' 
        });
      }
  
      // Check if user already rated
      const existingRatingIndex = course.courseRatings.findIndex(
        r => r.userId.toString() === userId.toString()
      );
  
      if (existingRatingIndex > -1) {
        // Update existing rating
        course.courseRatings[existingRatingIndex].rating = rating;
      } else {
        // Add new rating
        course.courseRatings.push({ userId, rating });
      }
  
      await course.save();
      return res.json({ success: true, message: 'Rating submitted' });
    } catch (error) {
      console.error('Rating error:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  };

// Add Course (Educator)
export const addCourse = async (courseData) => {
  try {
    // Validate required fields
    const requiredFields = ['courseTitle', 'courseDescription', 'coursePrice', 'imagePath'];
    for (const field of requiredFields) {
      if (!courseData[field]) {
        throw new Error(`${field} is required`);
      }
    }

    // Process course content if exists
    if (courseData.courseContent) {
      try {
        courseData.courseContent = JSON.parse(courseData.courseContent);
      } catch (e) {
        throw new Error('Invalid course content format');
      }
    }

    const newCourse = {
      ...courseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newCourse;
  } catch (error) {
    console.error('Error in addCourse controller:', error);
    throw error;
  }
};
