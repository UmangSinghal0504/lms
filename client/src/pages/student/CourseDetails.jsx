import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AddContext";
import Loading from "../../components/student/Loading";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";
import ErrorBoundary from "../../components/common/ErrorBoundary";
import axios from "axios";
import { useAuth } from '@clerk/clerk-react';
import { StarIcon, CheckCircleIcon, PlayIcon } from '@heroicons/react/24/solid';
import ReactPlayer from 'react-player';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded, userId } = useAuth();
  const { 
    backendUrl, 
    getToken, 
    calculateRating, 
    calculateNoOfLectures,
    calculateCourseDuration,
    calculateChapterTime,
    currency
  } = useContext(AppContext);

  const [state, setState] = useState({
    course: null,
    loading: true,
    error: null,
    isEnrolled: false,
    openSections: {},
    currentLecture: null,
    completedLectures: [],
    progress: 0
  });

  const [userRating, setUserRating] = useState(0);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isProcessingEnrollment, setIsProcessingEnrollment] = useState(false);

  const fetchCourse = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const { data } = await axios.get(`${backendUrl}/api/course/${id}`);
      
      if (data.success) {
        const isEnrolled = userId && data.course.enrolledStudents?.includes(userId);
        let completedLectures = [];
        let progress = 0;
        
        if (isEnrolled) {
          const progressData = await fetchCompletedLectures(data.course._id);
          completedLectures = progressData.lectureCompleted || [];
          progress = calculateProgress(data.course, completedLectures);
        }
        
        setState(prev => ({
          ...prev,
          course: data.course,
          isEnrolled,
          loading: false,
          completedLectures,
          progress
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || err.message || 'Error loading course',
        loading: false
      }));
    }
  };

  const fetchCompletedLectures = async (courseId) => {
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${backendUrl}/api/user/course-progress/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data.progress || { lectureCompleted: [] };
    } catch (error) {
      console.error("Error fetching progress:", error);
      return { lectureCompleted: [] };
    }
  };

  const calculateProgress = (course, completedLectures) => {
    try {
      const totalLectures = course.courseContent?.reduce((total, chapter) => 
        total + (chapter.chapterContent?.length || 0), 0) || 1;
      const completed = completedLectures.length;
      return Math.round((completed / totalLectures) * 100);
    } catch (error) {
      console.error("Error calculating progress:", error);
      return 0;
    }
  };

  const enrollCourse = async () => {
    try {
      setIsProcessingEnrollment(true);
      if (!isLoaded) {
        toast.info('Please wait while we verify your session');
        return;
      }

      if (!userId) {
        toast.warn('Please sign in to enroll');
        navigate('/sign-in');
        return;
      }

      if (state.isEnrolled) {
        toast.warn('You are already enrolled in this course');
        return;
      }

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/purchase`,
        { courseId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        // After successful purchase, refresh course data
        await fetchCourse();
        toast.success('Enrollment successful!');
        // Redirect to payment if needed
        if (data.session_url) {
          window.location.href = data.session_url;
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally {
      setIsProcessingEnrollment(false);
    }
  };
  const handleRatingSubmit = async () => {
    try {
      if (!userId) {
        toast.warn('Please sign in to rate this course');
        navigate('/sign-in');
        return;
      }

      if (userRating === 0) {
        toast.warn('Please select a rating');
        return;
      }

      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId: id, rating: userRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Rating submitted successfully!');
        setIsRatingSubmitted(true);
        fetchCourse();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const playLecture = async (lecture) => {
    try {
      if (!state.isEnrolled && !lecture.isPreviewFree) {
        toast.warn('Please enroll to access this lecture');
        return;
      }

      // Mark as completed if not already (only for enrolled users)
      if (state.isEnrolled && !state.completedLectures.includes(lecture.lectureId)) {
        await markLectureComplete(lecture.lectureId);
      }

      setState(prev => ({
        ...prev,
        currentLecture: lecture
      }));
      setShowVideoPlayer(true);
    } catch (error) {
      toast.error('Failed to play lecture');
      console.error("Error playing lecture:", error);
    }
  };

  const markLectureComplete = async (lectureId) => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/user/update-progress`,
        { courseId: id, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      const updatedCompleted = [...state.completedLectures, lectureId];
      const progress = calculateProgress(state.course, updatedCompleted);
      
      setState(prev => ({
        ...prev,
        completedLectures: updatedCompleted,
        progress
      }));
    } catch (error) {
      console.error("Error marking lecture complete:", error);
    }
  };

  const toggleVideoPlayer = () => {
    setShowVideoPlayer(!showVideoPlayer);
  };

  const toggleSection = (index) => {
    setState(prev => ({
      ...prev,
      openSections: {
        ...prev.openSections,
        [index]: !prev.openSections[index]
      }
    }));
  };

  useEffect(() => {
    if (isLoaded) {
      fetchCourse();
    }
  }, [id, isLoaded]);

  if (state.loading) return <Loading />;
  if (state.error) return <div className="text-red-500 p-4">{state.error}</div>;
  if (!state.course) return <div className="text-center py-20">Course not found</div>;

  const { course, isEnrolled, openSections, currentLecture, completedLectures } = state;
  const rating = calculateRating(course);
  const duration = calculateCourseDuration(course);
  const lectureCount = calculateNoOfLectures(course);

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="lg:w-2/3">
            {/* Video Player Section */}
            <div className="mb-8 bg-black rounded-lg overflow-hidden shadow-lg">
              {showVideoPlayer && currentLecture ? (
                <ReactPlayer
                  url={currentLecture.lectureUrl}
                  width="100%"
                  height="450px"
                  controls
                  playing
                  light={false}
                  config={{
                    file: {
                      attributes: {
                        controlsList: 'nodownload'
                      }
                    }
                  }}
                />
              ) : (
                <div 
                  className="relative cursor-pointer group"
                  onClick={toggleVideoPlayer}
                >
                  <img
                    src={course.courseThumbnail || assets.default_course_image}
                    alt="Course thumbnail"
                    className="w-full h-[450px] object-cover transition-opacity group-hover:opacity-90"
                    onError={(e) => {
                      e.target.src = assets.default_course_image;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all">
                    <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      <PlayIcon className="w-8 h-8 text-blue-600 ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-md">
                    Click to preview
                  </div>
                </div>
              )}
            </div>

            {/* Course Content Section */}
            <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-6">Course Content</h2>
              <div className="space-y-4">
                {course.courseContent?.map((chapter, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(index)}
                      className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-5 h-5 transform transition-transform ${openSections[index] ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        <span className="font-medium text-lg">{chapter.chapterTitle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {chapter.chapterContent?.length || 0} lectures
                        </span>
                        <span className="text-sm text-gray-600">
                          • {calculateChapterTime(chapter)}
                        </span>
                      </div>
                    </button>
                    
                    {openSections[index] && (
                      <div className="p-4 border-t">
                        <ul className="space-y-2">
                          {chapter.chapterContent?.map((lecture, i) => (
                            <li 
                              key={i} 
                              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
                                currentLecture?.lectureId === lecture.lectureId 
                                  ? 'bg-blue-50 border border-blue-100' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => playLecture(lecture)}
                            >
                              <div className="flex items-center gap-3">
                                {completedLectures.includes(lecture.lectureId) ? (
                                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <svg 
                                    className="w-5 h-5 text-gray-400 flex-shrink-0" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                                <div>
                                  <p className="font-medium">{lecture.lectureTitle}</p>
                                  {lecture.isPreviewFree && !isEnrolled && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded mt-1 inline-block">
                                      Free Preview
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                {Math.floor(lecture.lectureDuration / 60)}h {lecture.lectureDuration % 60}m
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Section */}
            {isEnrolled && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-2xl font-semibold mb-6">Rate this course</h2>
                {isRatingSubmitted ? (
                  <div className="text-green-600 flex items-center gap-2">
                    <CheckCircleIcon className="w-6 h-6" />
                    <span className="text-lg">Thank you for your rating!</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setUserRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                          aria-label={`Rate ${star} star`}
                        >
                          <StarIcon
                            className={`w-10 h-10 ${
                              userRating >= star ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleRatingSubmit}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={isRatingSubmitted || userRating === 0}
                    >
                      Submit Rating
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        {/* Right Column - Course Info */}
<div className="lg:w-1/3">
  <div className="sticky top-4 space-y-6">
    <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{course.courseTitle}</h1>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <span className="font-medium">
              {Number.isFinite(rating) ? rating.toFixed(1) : '0.0'}
            </span>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({course.courseRatings?.length || 0})
            </span>
          </div>
          <span className="text-sm text-gray-600">
            {course.enrolledStudents?.length || 0} students
          </span>
        </div>

                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-2xl font-bold">
                        {currency}{(course.coursePrice - (course.discount * course.coursePrice / 100)).toFixed(2)}
                      </span>
                      {course.discount > 0 && (
                        <span className="ml-2 text-sm text-gray-500 line-through">
                          {currency}{course.coursePrice}
                        </span>
                      )}
                    </div>
                    {course.discount > 0 && (
                      <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-1 rounded">
                        {course.discount}% OFF
                      </span>
                    )}
                  </div>

                  <button
                    onClick={enrollCourse}
                    disabled={isEnrolled}
                    className={`w-full py-3 rounded-md font-medium text-lg ${
                      isEnrolled 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } transition-colors`}
                  >
                    {isEnrolled ? 'Already Enrolled' : 'Enroll Now'}
                  </button>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{duration} total length</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{lectureCount} lectures</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Certificate of completion</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What You'll Learn Section */}
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                <h3 className="font-medium text-lg mb-3">What you'll learn</h3>
                <div 
                  className="prose prose-sm max-w-none" 
                  dangerouslySetInnerHTML={{ __html: course.courseDescription }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CourseDetails;