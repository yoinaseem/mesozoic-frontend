import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

type AttractionsCardProps = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  href?: string;
  isBookingAction?: boolean; 
};

const AttractionsCard: React.FC<AttractionsCardProps> = ({
  title,
  description,
  imageSrc,
  imageAlt,
  href = "#",
  isBookingAction = false,
}) => {
  return (
    <div className="card flex flex-col h-full overflow-hidden">
      {/* Image Container - Using Next.js Image for optimization */}
      <div className="relative w-full h-56">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover rounded-t-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-primary">{title}</h3>
        <p className="text-muted mt-2 flex-grow text-base">
          {description}
        </p>
        
        <div className="mt-6">
          <Link 
            href={href} 
            className={isBookingAction ? "btn-accent inline-block" : "btn-primary inline-block"}
          >
            {isBookingAction ? "Book Experience" : "Learn More"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AttractionsCard;