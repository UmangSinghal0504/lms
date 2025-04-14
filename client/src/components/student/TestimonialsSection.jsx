import React from 'react';
import { assets } from '../../assets/assets';
import Rating from './Rating';

const testimonials = [
  {
    name: 'Alex Johnson',
    role: 'Software Developer',
    image: assets.profile_img,
    rating: 5,
    feedback: 'The courses transformed my career. The practical approach helped me land my dream job at Google.',
  },
  {
    name: 'Sarah Williams',
    role: 'UX Designer',
    image: assets.profile_img,
    rating: 4,
    feedback: 'Excellent content and instructors. I was able to immediately apply what I learned to my projects.',
  },
  {
    name: 'Michael Chen',
    role: 'Data Scientist',
    image: assets.profile_img,
    rating: 5,
    feedback: 'The depth of material and quality of instruction exceeded my expectations. Worth every penny!',
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Learners Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Hear from our community of learners about their experiences and success stories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <div className="mb-4">
                <Rating initialRating={testimonial.rating} readOnly size="sm" />
              </div>
              <p className="text-gray-700 mb-4">"{testimonial.feedback}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;