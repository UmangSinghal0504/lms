import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import {
  addCourse,
  addUserRating,
  getUserCourseProgress,
  getUserData,
  purchaseCourse,
  updateUserCourseProgress,
  userEnrolledCourses
} from '../controllers/userController.js';

const userRouter = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/courses/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExt = file.originalname.split('.').pop();
    cb(null, `${uniqueSuffix}.${fileExt}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Only allow single file upload
  },
  fileFilter: fileFilter
});

// Multer error handler middleware
userRouter.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error'
    });
  }
  next();
});

// Regular routes
userRouter.get('/data', getUserData);
userRouter.get('/enrolled-courses', userEnrolledCourses);
userRouter.post('/purchase', purchaseCourse);
userRouter.post('/update-course-progress', updateUserCourseProgress);
userRouter.post('/get-course-progress', getUserCourseProgress);
userRouter.post('/add-rating', addUserRating);

// Add Course Route with comprehensive validation
userRouter.post(
  '/add-course',
  upload.single('courseImage'),
  [
    // Basic course info validation
    body('courseTitle')
      .trim()
      .notEmpty().withMessage('Course title is required')
      .isLength({ max: 100 }).withMessage('Title must be less than 100 characters'),
    
    body('courseDescription')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
    
    body('coursePrice')
      .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    
    body('discount')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0-100')
      .default(0),
    
    // Validate course content structure
    body('courseContent')
      .isString().withMessage('Course content must be a JSON string')
      .custom((value) => {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('Course must have at least one chapter');
          }
          
          // Validate each chapter
          parsed.forEach((chapter, index) => {
            if (!chapter.chapterTitle || typeof chapter.chapterTitle !== 'string') {
              throw new Error(`Chapter ${index + 1} is missing a title`);
            }
            
            if (!Array.isArray(chapter.chapterContent) || chapter.chapterContent.length === 0) {
              throw new Error(`Chapter "${chapter.chapterTitle}" has no lectures`);
            }
            
            // Validate each lecture
            chapter.chapterContent.forEach((lecture, lIndex) => {
              if (!lecture.lectureTitle || typeof lecture.lectureTitle !== 'string') {
                throw new Error(`Lecture ${lIndex + 1} in chapter "${chapter.chapterTitle}" is missing a title`);
              }
              
              if (typeof lecture.lectureDuration !== 'number' || lecture.lectureDuration <= 0) {
                throw new Error(`Lecture "${lecture.lectureTitle}" has invalid duration`);
              }
              
              if (!lecture.lectureType || !['video', 'text', 'quiz'].includes(lecture.lectureType)) {
                throw new Error(`Lecture "${lecture.lectureTitle}" has invalid type`);
              }
            });
          });
          
          return true;
        } catch (e) {
          throw new Error(`Invalid course content: ${e.message}`);
        }
      })
  ],
  async (req, res) => {
    try {
      // Validate inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      // Validate image was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Course image is required'
        });
      }

      // Parse course content (already validated)
      const courseContent = JSON.parse(req.body.courseContent);

      // Prepare course data
      const courseData = {
        title: req.body.courseTitle.trim(),
        description: req.body.courseDescription.trim(),
        price: parseFloat(req.body.coursePrice),
        discount: parseFloat(req.body.discount) || 0,
        content: courseContent,
        imageUrl: req.file.path.replace(/\\/g, '/') // Convert Windows paths to forward slashes
      };

      // Save to database
      const newCourse = await addCourse(courseData);

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        course: newCourse
      });

    } catch (error) {
      console.error('Error creating course:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }
);

export default userRouter;