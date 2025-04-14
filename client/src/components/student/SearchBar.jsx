import React, { useState } from 'react';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ initialValue = '' }) => {
  const [input, setInput] = useState(initialValue);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      navigate(`/course-list/${encodeURIComponent(input.trim())}`);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-2xl w-full mx-auto"
    >
      <div className="relative flex items-center">
        <div className="absolute left-3 text-gray-400">
          <img 
            src={assets.search_icon} 
            alt="Search" 
            className="w-5 h-5" 
          />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for courses, instructors, or topics..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        />
        <button
          type="submit"
          className="absolute right-2 bg-blue-600 text-white px-4 py-1.5 rounded-md hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;