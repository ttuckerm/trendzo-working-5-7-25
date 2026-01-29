import { NextResponse } from 'next/server';
import { formatAudioTime } from '@/lib/utils/audioUtils';

export async function GET() {
  // Test cases
  const testCases = [
    { input: 75, expected: '01:15' },
    { input: 125, expected: '02:05' },
    { input: 3661, expected: '01:01:01', withHours: true },
    { input: -10, expected: '00:00' },
    { input: NaN, expected: '00:00' }
  ];

  const results = testCases.map(test => {
    const result = formatAudioTime(test.input, test.withHours);
    const passed = result === test.expected;
    return {
      input: test.input,
      withHours: test.withHours || false,
      expected: test.expected,
      actual: result,
      passed
    };
  });

  const allPassed = results.every(r => r.passed);

  return NextResponse.json({
    function: 'formatAudioTime',
    allTestsPassed: allPassed,
    results
  });
} 