import React from 'react';
import Link from 'next/link';

interface AttractionProps {
  title: string;
  description: string;
  imageUrl: string;
}

export const AttractionCard = ({ title, description, imageUrl }: AttractionProps) => {
  return (
    // Component Rule #4: Use 'card' class
    <div className="card h-full flex flex-col">
      {/* Component Rule #11: rounded-lg, w-full, object-cover */}
      <img 
        src={imageUrl} 
        alt={title} 
        className="rounded-lg w-full h-64 object-cover" 
      />
      
      <div className="flex flex-col flex-grow mt-4">
        {/* Component Rule #9: Typography rules */}
        <h3 className="text-xl font-bold text-primary">
          {title}
        </h3>
        
        <p className="text-muted mt-2 flex-grow">
          {description}
        </p>

        {/* Component Rule #5: btn-accent for booking only */}
        <Link href="/booking" className="mt-4">
          <button className="btn-accent w-full">
            Book Now
          </button>
        </Link>
      </div>
    </div>
  );
};