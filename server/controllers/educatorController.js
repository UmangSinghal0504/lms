import { clerkClient } from '@clerk/express';
import Course from '../models/Course.js';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';
import {Purchase} from '../models/Purchase.js';
import fs from 'fs';


//Update role to educator
export const updateRoleToEducator = async (req, res) => {
    try {
        const userId = req.auth.userId;

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        });
        res.json({ success: true, message: 'You can publish a course now'});
    } catch (error) {
        res.json({success: false, message: error.message});
    }
};

//Add New Course
export const addCourse = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded or file too large'
            });
        }

        // Validate required fields
        if (!req.body.courseTitle || !req.body.courseContent) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'course-thumbnails',
        });

        // Remove the temporary file
        fs.unlinkSync(req.file.path);

        const courseData = {
            courseTitle: req.body.courseTitle,
            courseDescription: req.body.courseDescription || "No description",
            coursePrice: parseFloat(req.body.coursePrice) || 0,
            discount: parseFloat(req.body.discount) || 0,
            courseContent: tryParseJSON(req.body.courseContent),
            educator: req.auth.userId,
            courseThumbnail: result.secure_url,
            isPublished: true
        };

        const course = new Course(courseData);
        await course.save();

        res.json({ 
            success: true, 
            message: 'Course added successfully',
            course
        });
    } catch (error) {
        if (req.file) fs.unlinkSync(req.file.path); // Clean up on error
        console.error("Error adding course:", error);
        res.status(500).json({
            success: false,
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Helper function
function tryParseJSON(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        // Validate the structure
        if (!Array.isArray(parsed)) {
            throw new Error("Course content must be an array of chapters");
        }
        return parsed;
    } catch (e) {
        console.error("Failed to parse JSON:", jsonString);
        throw new Error("Invalid course content format");
    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });
        res.json({ success: true, courses });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Educator Dashboard Data (Total Earning, Enrolled Students, No. of Courses)
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({ educator });
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        // Calculate total earnings from purchase
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        // Collect unique enrolled students IDs with their course titles
        const enrolledStudentsData = [];
        const uniqueStudentIds = new Set();

        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents }
            }, 'name imageUrl');

            students.forEach(student => {
                if (!uniqueStudentIds.has(student._id.toString())) {
                    uniqueStudentIds.add(student._id.toString());
                    enrolledStudentsData.push({
                        courseTitle: course.courseTitle,
                        student
                    });
                }
            });
        }

        res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                enrolledStudents: enrolledStudentsData,
                totalCourses,
                totalStudents: uniqueStudentIds.size
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Enrolled Students Data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        // Ensure the educator's ID is available from the authentication
        const educator = req.auth.userId;
        if (!educator) {
            return res.status(401).json({ success: false, message: 'Educator not authenticated' });
        }

        // Find the courses taught by the educator
        const courses = await Course.find({ educator });
        if (!courses || courses.length === 0) {
            return res.status(404).json({ success: false, message: 'No courses found for this educator' });
        }

        // Get the course IDs
        const courseIds = courses.map(course => course._id);

        // Fetch completed purchases for these courses
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
        .populate('userId', 'name imageUrl') // Populate student info
        .populate('courseId', 'courseTitle'); // Populate course info

        // Map the purchase data to the enrolled student info
        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            enrollmentDate: purchase.createdAt, // Use 'createdAt' for enrollment date
            progress: purchase.amount // Assuming 'amount' represents the progress
        }));

        // Return the response with the enrolled students data
        res.json({ success: true, enrolledStudents });
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
