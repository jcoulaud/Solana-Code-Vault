'use client';

import { motion } from 'framer-motion';
import { FC, memo } from 'react';

interface FAQ {
  question: string;
  answer: string | string[];
}

const GameExplanation: FC = () => {
  const faqs: FAQ[] = [
    {
      question: 'How does the game work?',
      answer: [
        'Every time the token reaches a 1M milestone, one character of a redemption code is revealed. The complete code will be revealed when we reach 100M tokens. The first 100 people to submit the correct code win a share of the prize pool. The entire process is automated through smart contracts - no human intervention.',
      ],
    },
    {
      question: 'What is the prize distribution?',
      answer: [
        'From the total supply of 1B tokens:\n\n' +
          '• 88% (880M) goes to Trading and Liquidity\n' +
          '• 10% (100M) forms the Prize Pool:\n' +
          '  - 1st Place: 10M tokens (10%)\n' +
          '  - 2nd Place: 7M tokens (7%)\n' +
          '  - 3rd Place: 5M tokens (5%)\n' +
          '  - 4th-10th: 2M each (14% total)\n' +
          '  - 11th-30th: 1M each (20% total)\n' +
          '  - 31st-100th: 630K each (44% total)\n' +
          '• 2% (20M) allocated for Development',
      ],
    },
    {
      question: 'How is the game secured?',
      answer: [
        'The game is built with security as a top priority. The smart contract is non-upgradeable after deployment, and there are no special privileges or owner controls. The redemption code is protected with only its hash stored on-chain. The distribution mechanism is fully automated, and every transaction and action can be verified on-chain.',
      ],
    },
    {
      question: 'When can I claim my prize?',
      answer: [
        'You can claim your prize immediately after submitting the correct code, as long as you are among the first 100 winners. The distribution is automatic and instant through the smart contract.',
      ],
    },
  ];

  return (
    <div className='mx-auto max-w-7xl py-24 sm:pt-32'>
      <div className='lg:grid lg:grid-cols-12 lg:gap-8'>
        <div className='lg:col-span-5'>
          <h2 className='text-pretty text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl'>
            Frequently asked questions
          </h2>
          <p className='mt-4 text-pretty text-base/7 text-gray-600'>
            Learn about the game mechanics, prize distribution, and security features that make this
            game unique and fair for everyone.
          </p>
        </div>
        <div className='mt-10 lg:col-span-7 lg:mt-0'>
          <dl className='space-y-10'>
            {faqs.map((faq) => (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}>
                <dt className='text-base/7 font-semibold text-gray-900'>{faq.question}</dt>
                <dd className='mt-2 text-base/7 text-gray-600 whitespace-pre-line'>
                  {Array.isArray(faq.answer) ? faq.answer.join('\n') : faq.answer}
                </dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default memo(GameExplanation);
