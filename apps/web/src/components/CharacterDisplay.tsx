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
      <div className={className}>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-lg font-medium tracking-tight text-gray-950'>Characters</h2>
          <div className='flex items-center gap-4'>
            <div className='text-xs text-gray-500'>
              {revealedCount}/{TOTAL_CHARACTERS} revealed
            </div>
            <button
              onClick={handleCopy}
              className={`
                px-3 py-1 text-sm rounded-md transition-colors
                ${
                  copySuccess
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}>
              {copySuccess ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>
        <div className='grid grid-cols-15 gap-2' aria-label='Character grid'>
          {Array.from({ length: TOTAL_CHARACTERS }).map((_, index) => {
            const char = revealedCharacters[index] || '';
            const isNewlyRevealed = index === lastRevealedIndex;
            return (
              <div key={`char-${index}`} className='relative aspect-square'>
                <div
                  className={`
                    w-full h-full flex items-center justify-center rounded-md text-base font-mono
                    transition-all duration-500 relative
                    ${char ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}
                    ${isNewlyRevealed ? 'scale-105 bg-green-400 rotate-3' : ''}
                  `}>
                  <span
                    className={`transition-all duration-500 ${isNewlyRevealed ? 'scale-110' : ''}`}>
                    {char || '?'}
                  </span>
                  <span className='absolute top-1 left-1 text-[8px] opacity-50 select-none leading-none text-gray-300'>
                    {index + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
