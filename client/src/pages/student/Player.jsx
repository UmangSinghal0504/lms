import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AddContext';
import { useParams } from 'react-router-dom';
import { assets } from '../../assets/assets';
import Footer from '../../components/student/Footer';
import Rating from '../../components/student/Rating';
import { toast } from 'react-toastify';
import axios from 'axios';
import Loading from '../../components/student/Loading';
import ReactPlayer from 'react-player';

const Player = () => {
  const {
    enrolledCourses,
    calculateChapterTime,
    backendUrl,
    getToken,
    userData,
    fetchUserEnrolledCourses
  } = useContext(AppContext);

  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [playerData, setPlayerData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const getCourseData = () => {
    const course = enrolledCourses.find(c => c._id === courseId);
    if (course) {
      setCourseData(course);
      const userRating = course.courseRatings?.find(r => r.userId === userData?._id);
      if (userRating) {
        setInitialRating(userRating.rating);
      }
      setLoading(false);
    }
  };

  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const markLectureAsCompleted = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/update-course-progress`,
        { courseId, lectureId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        getCourseProgress();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const getCourseProgress = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        setProgressData(data.progressData);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleRate = async (newRating) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/add-rating`,
        { courseId, rating: newRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        fetchUserEnrolledCourses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    if (enrolledCourses.length > 0) {
      getCourseData();
    }
  }, [enrolledCourses, courseId]);

  useEffect(() => {
    if (userData) {
      getCourseProgress();
    }
  }, [userData]);

  if (loading) return <Loading />;
  if (!courseData) return <div className="text-center py-12">Course not found</div>;

  return (
    <>
      <div className="container mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        {/* Course Content */}
        <div className="md:col-span-2">
          {playerData ? (
            <div className="mb-8">
              <div className="relative aspect-video bg-black mb-4 rounded-lg overflow-hidden">
                {userData?.purchasedCourses?.includes(courseId) || playerData?.isPreviewFree ? (
                  <ReactPlayer
                    url={playerData.lectureUrl}
                    width="100%"
                    height="100%"
                    controls={true}
                    config={{
                      file: {
                        attributes: {
                          controlsList: 'nodownload',
                        },
                      },
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src={courseData.courseThumbnail || assets.default_course_image}
                      alt="Course thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = assets.default_course_image;
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <button
                        onClick={() => toast.info("Please enroll to watch this lecture.")}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg font-medium"
                      >
                        Enroll to Watch
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}
                </h3>
                <button
                  onClick={() => markLectureAsCompleted(playerData.lectureId)}
                  className={`px-3 py-1 rounded ${progressData?.lectureCompleted.includes(playerData.lectureId)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'}`}
                >
                  {progressData?.lectureCompleted.includes(playerData.lectureId)
                    ? 'Completed'
                    : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <div className="aspect-w-16 aspect-h-9 mb-8 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={courseData.courseThumbnail || assets.default_course_image}
                alt="Course thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Course Content</h2>
            {courseData.courseContent.map((chapter, index) => (
              <div key={index} className="mb-4 border rounded-lg overflow-hidden">
                <div
                  className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                  onClick={() => toggleSection(index)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={assets.down_arrow_icon}
                      alt="Toggle"
                      className={`transition-transform ${openSections[index] ? 'rotate-180' : ''}`}
                    />
                    <h3 className="font-medium">{chapter.chapterTitle}</h3>
                  </div>
                  <span className="text-sm text-gray-500">
                    {chapter.chapterContent.length} lectures • {calculateChapterTime(chapter)}
                  </span>
                </div>

                {openSections[index] && (
                  <ul className="divide-y">
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                progressData?.lectureCompleted.includes(lecture.lectureId)
                                  ? assets.blue_tick_icon
                                  : assets.play_icon
                              }
                              alt="Status"
                              className="w-4 h-4"
                            />
                            <span>{lecture.lectureTitle}</span>
                          </div>
                          <div className="flex gap-4 items-center">
                            <span className="text-sm text-gray-500">
                              {Math.floor(lecture.lectureDuration / 60)}h {lecture.lectureDuration % 60}m
                            </span>
                            {lecture.lectureUrl && (
                              <button
                                onClick={() =>
                                  setPlayerData({
                                    ...lecture,
                                    chapter: index + 1,
                                    lecture: i + 1
                                  })
                                }
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Watch
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="mt-8 flex items-center gap-4">
              <h3 className="text-lg font-medium">Rate this course:</h3>
              <Rating initialRating={initialRating} onRate={handleRate} />
            </div>
          </div>
        </div>

        {/* Course Info Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-8">
            <h2 className="text-xl font-bold mb-4">{courseData.courseTitle}</h2>
            <p className="text-gray-600 mb-6">{courseData.courseDescription?.substring(0, 150)}...</p>

            <div className="flex items-center gap-2 mb-4">
              <Rating initialRating={initialRating} readOnly size="sm" />
              <span className="text-gray-500 text-sm">
                ({courseData.courseRatings?.length || 0} ratings)
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2">
                <img src={assets.time_clock_icon} alt="Duration" className="w-5 h-5" />
                <span>Total duration: {calculateChapterTime({ chapterContent: courseData.courseContent.flatMap(c => c.chapterContent) })}</span>
              </div>
              <div className="flex items-center gap-2">
                <img src={assets.lesson_icon} alt="Lessons" className="w-5 h-5" />
                <span>{courseData.courseContent.reduce((sum, c) => sum + c.chapterContent.length, 0)} lessons</span>
              </div>
            </div>

            <button
              onClick={() => window.scrollTo(0, 0)}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Back to Top
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Player;
