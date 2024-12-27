'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';
import { CharacterDisplay } from '../components/CharacterDisplay';
import { CodeSubmissionForm } from '../components/CodeSubmissionForm';
import GameExplanation from '../components/GameExplanation';
import { MarketCapDisplay } from '../components/MarketCapDisplay';
import { WinnersList } from '../components/WinnersList';
import { useMarket } from '../hooks/useMarket';

const WalletProvider = dynamic(() => import('../providers/WalletProvider'), { ssr: false });

const TOTAL_SUPPLY = 1_000_000_000; // 1B total supply

export default function Home() {
  const { marketCap, revealedCharacters, winners, lastUpdate, isLoading, error } = useMarket();

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
        <div className='w-16 h-16 mb-4 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin' />
        <div className='text-base text-gray-600 animate-pulse'>Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
        <div className='text-3xl mb-2'>⚠️</div>
        <div className='text-base text-red-500 text-center max-w-md font-medium'>{error}</div>
      </div>
    );
  }

  // Calculate current price per token
  const currentPrice = marketCap / TOTAL_SUPPLY;

  return (
    <WalletProvider>
      <div className='min-h-screen bg-gray-50'>
        {/* Top Navigation */}
        <div className='fixed top-0 left-0 right-0 z-50 bg-gray-50'>
          <div className='mx-auto max-w-7xl px-6 py-4'>
            <div className='flex justify-between items-center'>
              <div className='text-2xl font-bold tracking-wide text-gray-900'>Code Vault</div>
              <WalletMultiButton className='!bg-purple-600 hover:!bg-purple-500 !text-white !rounded-xl !transition-all !text-sm !font-medium !px-5 !py-2.5 !h-auto !border-0' />
            </div>
          </div>
        </div>

        <main className='pt-24 pb-20 sm:py-28'>
          <div className='mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8'>
            <p className='mx-auto max-w-3xl text-center text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl lg:px-12'>
              $10M Prize Pool
            </p>
            <p className='mx-auto mt-4 max-w-2xl text-pretty text-center text-lg text-gray-600 sm:text-xl/8'>
              Each $1M market cap milestone reveals one character of the code. First 100 to submit
              the complete code at $100M win up to $1M.
            </p>

            {/* First Bento Box */}
            <div className='mt-10 grid gap-6 sm:mt-16 lg:grid-cols-3'>
              <div className='space-y-6'>
                {/* Market Cap */}
                <div className='relative'>
                  <div className='absolute inset-px rounded-lg bg-white lg:rounded-tl-[2rem]'></div>
                  <div className='relative flex flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-tl-[calc(2rem+1px)]'>
                    <div className='p-8'>
                      <h2 className='text-lg font-medium tracking-tight text-gray-950 mb-6'>
                        Market Cap
                      </h2>
                      <MarketCapDisplay marketCap={marketCap} lastUpdate={lastUpdate} />
                    </div>
                  </div>
                  <div className='pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-tl-[2rem]'></div>
                </div>

                {/* Submit Code */}
                <div className='relative'>
                  <div className='absolute inset-px rounded-lg bg-white lg:rounded-bl-[2rem]'></div>
                  <div className='relative flex flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-bl-[calc(2rem+1px)]'>
                    <div className='p-4 sm:p-8'>
                      <CodeSubmissionForm />
                    </div>
                  </div>
                  <div className='pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-bl-[2rem]'></div>
                </div>
              </div>

              {/* Character Display */}
              <div className='relative lg:col-span-2'>
                <div className='absolute inset-px rounded-lg bg-white lg:rounded-r-[2rem]'></div>
                <div className='relative flex flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-r-[calc(2rem+1px)]'>
                  <div className='p-4 sm:p-8'>
                    <CharacterDisplay revealedCharacters={revealedCharacters} className='h-full' />
                  </div>
                </div>
                <div className='pointer-events-none absolute inset-px rounded-lg shadow ring-1 ring-black/5 lg:rounded-r-[2rem]'></div>
              </div>
            </div>

            {/* Second Bento Box */}
            <div className='mt-12 relative'>
              <div className='absolute inset-px rounded-lg sm:rounded-[2rem] bg-white'></div>
              <div className='relative flex flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] sm:rounded-[calc(2rem+1px)]'>
                <div className='p-4 sm:p-8'>
                  <p className='text-lg font-medium tracking-tight text-gray-950 mb-4'>Winners</p>
                  <WinnersList winners={winners} currentPrice={currentPrice} />
                </div>
              </div>
              <div className='pointer-events-none absolute inset-px rounded-lg sm:rounded-[2rem] shadow ring-1 ring-black/5'></div>
            </div>

            {/* FAQ Section */}
            <div className='mt-0'>
              <GameExplanation />
            </div>
          </div>
        </main>
      </div>
    </WalletProvider>
  );
}
