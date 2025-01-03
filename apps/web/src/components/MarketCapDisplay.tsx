import { format, formatDistance } from 'date-fns';
import { memo, useEffect, useState } from 'react';

interface MarketCapDisplayProps {
  marketCap: number;
  lastUpdate: string;
  className?: string;
}

export const MarketCapDisplay = memo(
  ({ marketCap, lastUpdate, className = '' }: MarketCapDisplayProps) => {
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 500);
      return () => clearTimeout(timer);
    }, [marketCap, lastUpdate]);

    const formattedMarketCap = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(marketCap);

    const timeAgo = formatDistance(new Date(lastUpdate), new Date(), { addSuffix: true });
    const exactTime = format(new Date(lastUpdate), 'MMM d, yyyy HH:mm:ss');

    return (
      <div className={className}>
        <div
          className={`text-3xl font-bold text-green-600 transition-all duration-500 ${
            isUpdating ? 'scale-105 text-green-500' : ''
          }`}>
          {formattedMarketCap}
        </div>
        <div className='mt-2'>
          <div className='text-sm text-gray-600'>Last updated: {timeAgo}</div>
          <div className='text-[10px] text-gray-500 font-light tracking-wide'>{exactTime}</div>
        </div>
      </div>
    );
  },
);
