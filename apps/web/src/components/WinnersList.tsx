import { memo } from 'react';
import { Winner } from '../types/market';

interface WinnersListProps {
  winners: Winner[];
  className?: string;
  currentPrice?: number;
}

export const WinnersList = memo(
  ({ winners = [], className = '', currentPrice = 0 }: WinnersListProps) => {
    const formatAddress = (address: string | undefined) => {
      if (!address) return 'Unknown';
      return `${address.slice(0, 6)}...${address.slice(-6)}`;
    };

    const formatTokenAmount = (amount: number) => {
      return new Intl.NumberFormat('en-US').format(amount);
    };

    const formatUsdValue = (tokenAmount: number, price: number) => {
      const value = tokenAmount * price;
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    const getSolscanUrl = (address: string) => `https://solscan.io/account/${address}`;

    return (
      <div className={`rounded-lg bg-gray-800 p-6 shadow-lg ${className}`}>
        <h2 className='text-xl font-bold text-white mb-4'>Winners</h2>
        {winners.length === 0 ? (
          <p className='text-gray-400'>No winners yet</p>
        ) : (
          <div className='space-y-4 max-h-[400px] overflow-y-auto pr-2'>
            {winners.map((winner) => (
              <div
                key={`${winner.walletAddress}-${winner.position}`}
                className='flex items-center justify-between p-3 bg-gray-700 rounded-lg'>
                <div className='flex flex-col'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm text-gray-400'>#{winner.position}</span>
                    {winner.walletAddress ? (
                      <a
                        href={getSolscanUrl(winner.walletAddress)}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-white font-mono hover:text-blue-400 transition-colors'>
                        {formatAddress(winner.walletAddress)}
                      </a>
                    ) : (
                      <span className='text-gray-400 font-mono'>Unknown Address</span>
                    )}
                  </div>
                </div>
                <div className='flex flex-col items-end'>
                  <div className='text-green-400 font-semibold'>{winner.rewardPercentage}%</div>
                  <div className='text-sm text-gray-400'>
                    {formatTokenAmount(winner.tokenAmount)} tokens
                  </div>
                  <div className='text-xs text-gray-500'>
                    ≈ {formatUsdValue(winner.tokenAmount, currentPrice)}
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
