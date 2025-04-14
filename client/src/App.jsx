import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/student/Home';
import CoursesList from './pages/student/CoursesList';
import CourseDetails from './pages/student/CourseDetails';
import MyEnrollments from './pages/student/MyEnrollments';
import Player from './pages/student/Player';
import Loading from './components/student/Loading';
import Educator from './pages/educator/Educator';
import Dashboard from './pages/educator/Dashboard';
import AddCourse from './pages/educator/AddCourse';
import MyCourses from './pages/educator/MyCourses';
import StudentsEnrolled from './pages/educator/StudentsEnrolled';
import Navbar from './components/student/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  const location = useLocation();
  const isEducatorRoute = location.pathname.startsWith('/educator');

  return (
    <div className="text-default min-h-screen bg-white">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Conditionally render Navbar */}
      {!isEducatorRoute && <Navbar />}
      
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/course-list" element={<CoursesList />} />
          <Route path="/course-list/:input" element={<CoursesList />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/loading/:path" element={<Loading />} />

          {/* Protected Student Routes */}
          <Route
            path="/my-enrollments"
            element={
              <>
                <SignedIn>
                  <MyEnrollments />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />
          <Route
            path="/player/:courseId"
            element={
              <>
                <SignedIn>
                  <Player />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Protected Educator Routes */}
          <Route
            path="/educator"
            element={
              <>
                <SignedIn>
                  <Educator />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="add-course" element={<AddCourse />} />
            <Route path="my-courses" element={<MyCourses />} />
            <Route path="student-enrolled" element={<StudentsEnrolled />} />
          </Route>

          {/* Auth Routes */}
          <Route
            path="/sign-in/*"
            element={
              <div className="flex justify-center items-center h-screen">
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
                <SignedIn>
                  <Home />
                </SignedIn>
              </div>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<div className="text-center py-20">404 - Page Not Found</div>} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}