import Course from "../models/Course.js";

// Get All Courses
export const getAllCourse = async (req, res) => {
    try {
        const courses = await Course.find({ isPublished: true })
            .select(['-courseContent', '-enrolledStudents'])
            .populate({ path: 'educator', select: 'name imageUrl' });

        res.json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Course by Id
export const getCourseId = async (req, res) => {
    const { id } = req.params;

    try {
        const courseData = await Course.findById(id)
            .populate({ path: 'educator', select: 'name imageUrl' });

        if (!courseData) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found' 
            });
        }

        // Remove lectureUrl if isPreviewFree is false and user is not enrolled
        const userId = req.auth?.userId;
        const isEnrolled = userId && courseData.enrolledStudents.includes(userId);

        if (!isEnrolled) {
            courseData.courseContent.forEach(chapter => {
                chapter.chapterContent.forEach(lecture => {
                    if (!lecture.isPreviewFree) {
                        lecture.lectureUrl = "";
                    }
                });
            });
        }

        res.json({ success: true, course: courseData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};