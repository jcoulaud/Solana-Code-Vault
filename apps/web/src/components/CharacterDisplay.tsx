import { memo, useCallback, useEffect, useState } from 'react';

interface CharacterDisplayProps {
  revealedCharacters: string;
  className?: string;
  onRevealComplete?: (isComplete: boolean) => void;
}

export const CharacterDisplay = memo(
  ({ revealedCharacters, className = '', onRevealComplete }: CharacterDisplayProps) => {
    const TOTAL_CHARACTERS = 100;
    const revealedCount = revealedCharacters.split('').filter((char) => char).length;
    const [lastRevealedIndex, setLastRevealedIndex] = useState<number | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleCopy = useCallback(() => {
      if (revealedCharacters) {
        navigator.clipboard.writeText(revealedCharacters).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        });
      }
    }, [revealedCharacters]);

    useEffect(() => {
      onRevealComplete?.(revealedCount === TOTAL_CHARACTERS);
    }, [revealedCount, onRevealComplete]);

    useEffect(() => {
      const chars = revealedCharacters.split('');
      const newRevealedIndex = chars.findIndex((char, index) => {
        const prevChars = chars.slice(0, index);
        return char && prevChars.filter(Boolean).length === revealedCount - 1;
      });
      if (newRevealedIndex !== -1) {
        setLastRevealedIndex(newRevealedIndex);
        const timer = setTimeout(() => setLastRevealedIndex(null), 500);
        return () => clearTimeout(timer);
      }
    }, [revealedCharacters, revealedCount]);

    return (
      <div className={`rounded-lg bg-gray-800 p-6 shadow-lg ${className}`}>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-white'>Characters</h2>
          {revealedCount > 0 && (
            <button
              onClick={handleCopy}
              className='px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors'>
              {copySuccess ? 'Copied!' : 'Copy Code'}
            </button>
          )}
        </div>
        <div className='grid grid-cols-10 gap-2.5 gap-y-4 select-none' aria-label='Character grid'>
          {Array.from({ length: TOTAL_CHARACTERS }).map((_, index) => {
            const char = revealedCharacters[index] || '';
            const isNewlyRevealed = index === lastRevealedIndex;
            return (
              <div key={`char-${index}`} className='relative'>
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-md text-white font-mono text-lg
                    transition-all duration-500 relative
                    ${char ? 'bg-green-500' : 'bg-gray-600'}
                    ${isNewlyRevealed ? 'scale-105 bg-green-300 rotate-3' : ''}`}>
                  <span
                    className={`transition-all duration-500 ${isNewlyRevealed ? 'scale-110' : ''}`}>
                    {char || '?'}
                  </span>
                  <span className='absolute top-0.5 left-0.5 text-[9px] opacity-50 select-none leading-none'>
                    {index + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className='mt-4 text-sm text-gray-400'>
          {revealedCount}/{TOTAL_CHARACTERS} revealed
        </div>
      </div>
    );
  },
);
