import { createContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from 'axios';
import { toast } from 'react-toastify';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const currency = import.meta.env.VITE_CURRENCY || '$';
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { user } = useUser();

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchAllCourses = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${backendUrl}/api/course/all`);
            if (data?.success) {
                setAllCourses(data.courses || []);
            } else {
                toast.error(data?.message || 'Failed to fetch courses');
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error(error.response?.data?.message || error.message || 'Error loading courses');
        } finally {
            setLoading(false);
        }
    }, [backendUrl]);

    const fetchUserEnrolledCourses = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;
            
            const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data?.success) {
                setEnrolledCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
        }
    }, [backendUrl, getToken]);

    const checkEducatorStatus = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;
            
            const { data } = await axios.get(`${backendUrl}/api/educator/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsEducator(data?.isEducator || false);
        } catch (error) {
            console.error('Error checking educator status:', error);
        }
    }, [backendUrl, getToken]);

    const calculateCourseDuration = useCallback((course) => {
        if (!course?.courseContent?.length) return '0m';
        const time = course.courseContent.reduce((sum, chapter) => {
            return sum + (chapter?.chapterContent?.reduce((chapSum, lecture) => 
                chapSum + (lecture?.lectureDuration || 0), 0) || 0);
        }, 0);
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    }, []);

    const calculateRating = useCallback((course) => {
        if (!course?.courseRatings?.length) return 0;
        const totalRating = course.courseRatings.reduce((sum, rating) => sum + (rating?.rating || 0), 0);
        return totalRating / course.courseRatings.length; // return number
    }, []);
    

    const calculateChapterTime = useCallback((chapter) => {
        if (!chapter?.chapterContent?.length) return '0m';
        const time = chapter.chapterContent.reduce((sum, lecture) => sum + (lecture?.lectureDuration || 0), 0);
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    }, []);

    useEffect(() => {
        if (user) {
            checkEducatorStatus();
            fetchAllCourses();
            fetchUserEnrolledCourses();
        }
    }, [user, checkEducatorStatus, fetchAllCourses, fetchUserEnrolledCourses]);

    const value = {
        currency,
        allCourses,
        loading,
        navigate,
        calculateRating,
        isEducator, 
        setIsEducator,
        enrolledCourses,
        backendUrl,
        userData,
        setUserData,
        getToken,
        fetchAllCourses,
        fetchUserEnrolledCourses,
        calculateCourseDuration,
        calculateChapterTime,
        calculateNoOfLectures: (course) => {
            if (!course?.courseContent) return 0;
            return course.courseContent.reduce((sum, chapter) => {
                return sum + (Array.isArray(chapter?.chapterContent) ? chapter.chapterContent.length : 0);
            }, 0);
        },
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};