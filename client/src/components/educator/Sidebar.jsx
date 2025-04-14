import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AddContext';
import { NavLink } from 'react-router-dom';

const menuItems = [
  { name: 'Dashboard', path: '/educator', icon: assets.home_icon },
  { name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
  { name: 'My Courses', path: '/educator/my-courses', icon: assets.my_course_icon },
  { name: 'Students Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon },
];

const Sidebar = () => {
  const { isEducator } = useContext(AppContext);

  if (!isEducator) return null;

  return (
    <aside className='w-64 border-r min-h-screen border-gray-200 bg-white fixed left-0 top-0 pt-16'>
      <div className='flex flex-col py-4'>
        {menuItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.name}
            end={item.path === '/educator'}
            className={({ isActive }) => 
              `flex items-center px-6 py-3 mx-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-600 font-medium border-r-4 border-indigo-500' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <img src={item.icon} alt='' className='w-5 h-5 mr-3' />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;