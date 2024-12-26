import { memo, useCallback, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useMarket } from '../hooks/useMarket';
import { useToast } from '../hooks/useToast';
import { useWallet } from '../hooks/useWallet';

interface CodeSubmissionFormProps {
  className?: string;
}

export const CodeSubmissionForm = memo(({ className = '' }: CodeSubmissionFormProps) => {
  const [code, setCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isConnected, connect, publicKey } = useWallet();
  const { submitCode, revealedCharacters } = useMarket();
  const toast = useToast();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        // Validate wallet connection
        if (!isConnected || !publicKey) {
          try {
            await connect();
          } catch (err) {
            toast.error('Please connect your wallet to submit code');
            return;
          }
        }

        // Validate code length
        if (!code) {
          toast.error('Please enter a code');
          return;
        }

        if (code.length !== 100) {
          toast.error('Code must be exactly 100 characters long');
          return;
        }

        // Validate captcha
        if (!captchaToken) {
          toast.error('Please complete the CAPTCHA');
          return;
        }

        // Check if all characters are revealed
        const hiddenCharCount = (revealedCharacters?.match(/\s/g) || []).length;
        if (hiddenCharCount > 0) {
          toast.error('Not all characters have been revealed yet');
          return;
        }

        setIsSubmitting(true);
        const response = await submitCode(code.trim(), captchaToken);

        if (response.success) {
          toast.success(
            response.position
              ? `Congratulations! You won position ${response.position}!`
              : 'Code submitted successfully!',
          );
          setCode('');
          resetCaptcha();
        } else {
          toast.error(response.message || 'Incorrect code. Try again!');
          resetCaptcha();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : err && typeof err === 'object' && 'message' in err
              ? String(err.message)
              : 'Failed to submit code';

        if (errorMessage.includes('Wallet has already won')) {
          toast.error('This wallet has already won and cannot submit again');
        } else if (errorMessage.includes('Maximum attempts exceeded')) {
          toast.error('You have reached the maximum number of attempts for this wallet');
        } else if (errorMessage.includes('Rate limit exceeded')) {
          toast.error('Please wait a moment before trying again');
        } else if (errorMessage.includes('Maximum winners reached')) {
          toast.error('The competition has ended - maximum number of winners reached');
        } else if (errorMessage.includes('Invalid CAPTCHA')) {
          toast.error('CAPTCHA verification failed. Please try again');
        } else {
          toast.error(errorMessage);
        }
        resetCaptcha();
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      code,
      captchaToken,
      isConnected,
      connect,
      publicKey,
      submitCode,
      revealedCharacters,
      toast,
      resetCaptcha,
    ],
  );

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= 100) {
        setCode(value);
      } else {
        toast.error('Code cannot be longer than 100 characters');
      }
    },
    [toast],
  );

  const handleCaptchaChange = useCallback(
    (token: string | null) => {
      setCaptchaToken(token);
      if (!token) {
        toast.error('CAPTCHA verification failed or expired. Please try again.');
      }
    },
    [toast],
  );

  const handleCaptchaExpired = useCallback(() => {
    setCaptchaToken(null);
    toast.error('CAPTCHA has expired. Please verify again.');
  }, [toast]);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    toast.error('Error loading CAPTCHA. Please refresh the page and try again.');
  }, [toast]);

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      <div>
        <div>
          <textarea
            id='code'
            value={code}
            onChange={handleCodeChange}
            maxLength={100}
            rows={3}
            className='block w-full rounded-lg border-0 bg-gray-50 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 resize-none font-mono text-base'
            placeholder='Enter your 100-character code here...'
            disabled={isSubmitting}
          />
        </div>
        <div className='mt-2 flex justify-between text-sm text-gray-500'>
          <span>{code.length}/100 characters</span>
          {code.length > 0 && (
            <button
              type='button'
              onClick={() => setCode('')}
              className='text-gray-400 hover:text-gray-500'>
              Clear
            </button>
          )}
        </div>
      </div>

      {code.length > 0 && (
        <div className='flex justify-center'>
          <div className='overflow-hidden rounded-lg shadow-sm'>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
              onChange={handleCaptchaChange}
              onExpired={handleCaptchaExpired}
              onError={handleCaptchaError}
              theme='light'
              size='normal'
            />
          </div>
        </div>
      )}

      <button
        type='submit'
        disabled={isSubmitting || !captchaToken || !isConnected}
        className={`
          w-full rounded-lg px-4 py-3 text-base font-semibold text-white shadow-sm
          ${
            isSubmitting || !captchaToken || !isConnected
              ? 'bg-gray-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
          }
        `}>
        {!isConnected ? 'Connect Wallet to Submit' : isSubmitting ? 'Submitting...' : 'Submit Code'}
      </button>
    </form>
  );
});
