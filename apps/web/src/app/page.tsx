'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';
import { CharacterDisplay } from '../components/CharacterDisplay';
import { CodeSubmissionForm } from '../components/CodeSubmissionForm';
import { MarketCapDisplay } from '../components/MarketCapDisplay';
import { WinnersList } from '../components/WinnersList';
import { useMarket } from '../hooks/useMarket';

// Dynamically import wallet provider to avoid SSR issues
const WalletProvider = dynamic(() => import('../providers/WalletProvider'), { ssr: false });

export default function Home() {
  const { marketCap, revealedCharacters, winners, lastUpdate, isLoading, error } = useMarket();

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4'>
        <div className='w-16 h-16 mb-4 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin' />
        <div className='text-lg text-gray-400 animate-pulse'>Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4'>
        <div className='text-3xl text-red-500 mb-2'>⚠️</div>
        <div className='text-lg text-red-500 text-center max-w-md'>{error}</div>
      </div>
    );
  }

  return (
    <WalletProvider>
      <main className='min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
          <div className='flex justify-end mb-6'>
            <WalletMultiButton className='!bg-blue-600 hover:!bg-blue-700' />
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='space-y-6'>
              <MarketCapDisplay marketCap={marketCap} lastUpdate={lastUpdate} />
              <CharacterDisplay revealedCharacters={revealedCharacters} />
            </div>

            <div className='space-y-6'>
              <CodeSubmissionForm className='bg-gray-800 rounded-lg p-6 shadow-lg' />
              <WinnersList
                winners={winners}
                currentPrice={marketCap / (winners.reduce((sum, w) => sum + w.tokenAmount, 0) || 1)}
              />
            </div>
          </div>
        </div>
      </main>
    </WalletProvider>
  );
}
