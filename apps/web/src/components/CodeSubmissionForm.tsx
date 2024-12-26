import { memo, useCallback, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useWallet } from '../hooks/useWallet';

interface CodeSubmissionFormProps {
  onSubmit: (code: string, captchaToken: string) => Promise<void>;
  className?: string;
}

export const CodeSubmissionForm = memo(({ onSubmit, className = '' }: CodeSubmissionFormProps) => {
  const [code, setCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, connect } = useWallet();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isConnected) {
        try {
          await connect();
        } catch (err) {
          setError('Please connect your wallet to submit code');
          return;
        }
      }

      if (!captchaToken) {
        setError('Please complete the CAPTCHA');
        return;
      }

      if (!code.trim()) {
        setError('Please enter a code');
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);
        await onSubmit(code.trim(), captchaToken);
        setCode('');
        setCaptchaToken(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit code');
      } finally {
        setIsSubmitting(false);
      }
    },
    [code, captchaToken, isConnected, connect, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label htmlFor='code' className='block text-sm font-medium text-gray-200 mb-2'>
          Enter Code
        </label>
        <textarea
          id='code'
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
          placeholder='Enter your code here...'
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      <div className='flex justify-center'>
        <ReCAPTCHA
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
          onChange={(token) => setCaptchaToken(token)}
          theme='dark'
        />
      </div>

      {error && <div className='text-red-500 text-sm'>{error}</div>}

      <button
        type='submit'
        disabled={isSubmitting || !captchaToken}
        className={`
          w-full px-4 py-2 text-white font-semibold rounded-md
          ${
            isSubmitting
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800'
          }
        `}>
        {isSubmitting ? 'Submitting...' : 'Submit Code'}
      </button>
    </form>
  );
});
