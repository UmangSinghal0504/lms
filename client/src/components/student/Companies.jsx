import React from 'react';
import { assets } from '../../assets/assets';

const companies = [
  { name: 'Microsoft', logo: assets.microsoft_logo },
  { name: 'Walmart', logo: assets.walmart_logo },
  { name: 'Accenture', logo: assets.accenture_logo },
  { name: 'Adobe', logo: assets.adobe_logo },
  { name: 'PayPal', logo: assets.paypal_logo },
];

export default function Companies() {
  return (
    <section className='bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        <p className='text-center text-gray-500 mb-8'>
          Trusted by professionals at leading companies worldwide
        </p>
        <div className='flex flex-wrap justify-center gap-8 md:gap-16'>
          {companies.map((company) => (
            <div key={company.name} className='flex items-center'>
              <img 
                src={company.logo} 
                alt={company.name} 
                className='h-8 object-contain opacity-70 hover:opacity-100 transition-opacity'
                loading='lazy'
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}