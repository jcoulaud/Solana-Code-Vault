import { memo } from 'react';
import { Winner } from '../types/market';

interface WinnersListProps {
  winners: Winner[];
  className?: string;
  currentPrice: number;
}

export const WinnersList = memo(
  ({ winners = [], className = '', currentPrice = 0 }: WinnersListProps) => {
    const formatAddress = (address: string | undefined) => {
      if (!address) return 'Unknown';
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
      <div className={className}>
        {winners.length === 0 ? (
          <p className='text-gray-500'>No winners yet</p>
        ) : (
          <div className='space-y-2'>
            {winners.map((winner) => (
              <div
                key={`${winner.walletAddress}-${winner.position}`}
                className='bg-gray-50 rounded-xl p-4 flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-medium text-gray-300'>#{winner.position}</span>
                  {winner.walletAddress ? (
                    <a
                      href={getSolscanUrl(winner.walletAddress)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='font-mono text-gray-900 hover:text-blue-600 transition-colors'>
                      {formatAddress(winner.walletAddress)}
                    </a>
                  ) : (
                    <span className='font-mono text-gray-400'>Unknown Address</span>
                  )}
                </div>
                <div className='text-right'>
                  <div className='text-green-500 font-semibold'>{winner.rewardPercentage}%</div>
                  <div className='text-sm text-gray-400'>
                    {formatTokenAmount(winner.tokenAmount)} tokens
                  </div>
                  <div className='text-xs text-gray-300'>
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
