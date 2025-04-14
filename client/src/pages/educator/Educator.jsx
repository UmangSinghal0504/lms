import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/educator/Sidebar';
import EducatorNavbar from '../../components/educator/Navbar';
import EducatorFooter from '../../components/educator/Footer';

const Educator = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navbar */}
      <EducatorNavbar />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <Sidebar />
        </div>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <EducatorFooter />
    </div>
  );
};

export default Educator;
