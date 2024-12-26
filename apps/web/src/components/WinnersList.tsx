import { formatDistance } from 'date-fns';
import { memo } from 'react';
import { Winner } from '../types/market';

interface WinnersListProps {
  winners: Winner[];
  className?: string;
  totalTokens?: number;
}

export const WinnersList = memo(
  ({ winners = [], className = '', totalTokens = 0 }: WinnersListProps) => {
    const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-6)}`;

    const formatPrize = (prize: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(prize);

    const formatTokens = (tokens: number) =>
      new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2,
      }).format(tokens);

    const calculatePercentage = (tokens: number) => {
      if (!totalTokens) return 0;
      return (tokens / totalTokens) * 100;
    };

    const getSolscanUrl = (address: string) => `https://solscan.io/account/${address}`;

    const safeWinners = winners || [];

    return (
      <div className={`rounded-lg bg-gray-800 p-6 shadow-lg ${className}`}>
        <h2 className='text-xl font-bold text-white mb-4'>Winners</h2>
        {safeWinners.length === 0 ? (
          <p className='text-gray-400'>No winners yet</p>
        ) : (
          <div className='space-y-4 max-h-[400px] overflow-y-auto pr-2'>
            {safeWinners.map((winner, index) => (
              <div
                key={`${winner.address}-${winner.timestamp}`}
                className='flex items-center justify-between p-3 bg-gray-700 rounded-lg'>
                <div className='flex flex-col'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-400'>#{index + 1}</span>
                    <a
                      href={getSolscanUrl(winner.address)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-white font-mono hover:text-blue-400 transition-colors'>
                      {formatAddress(winner.address)}
                    </a>
                  </div>
                  <span className='text-sm text-gray-400'>
                    {formatDistance(new Date(winner.timestamp), new Date(), { addSuffix: true })}
                  </span>
                </div>
                <div className='flex flex-col items-end'>
                  <div className='text-green-400 font-semibold'>{formatPrize(winner.prize)}</div>
                  <div className='text-sm text-gray-400'>
                    {formatTokens(winner.tokens)} tokens (
                    {calculatePercentage(winner.tokens).toFixed(2)}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);
