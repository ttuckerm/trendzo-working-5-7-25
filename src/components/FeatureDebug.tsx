import { useFeatures } from '@/lib/contexts/FeatureContext';
import { auth, db } from '@/lib/firebase/firebase';

export default function FeatureDebug() {
  const { features, subscription } = useFeatures();
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg max-w-md z-50 opacity-80 hover:opacity-100 transition-opacity text-xs">
      <h3 className="font-bold mb-2 text-sm">Feature Debug Panel</h3>
      <div className="grid grid-cols-2 gap-1">
        <div className="col-span-2 mb-1">
          <span className="font-semibold">Firebase Status:</span>{' '}
          <span className={auth ? 'text-green-400' : 'text-red-400'}>
            Auth: {auth ? 'Initialized ✓' : 'Not initialized ✗'}
          </span>{' | '}
          <span className={db ? 'text-green-400' : 'text-red-400'}>
            DB: {db ? 'Initialized ✓' : 'Not initialized ✗'}
          </span>
        </div>
        <div className="col-span-2 mb-1">
          <span className="font-semibold">Subscription:</span>{' '}
          <span className="text-yellow-300">{subscription || 'none'}</span>
        </div>
        <div className="col-span-2 font-semibold">Features:</div>
        {Object.entries(features).map(([feature, enabled]) => (
          <div key={feature} className="flex justify-between border-b border-gray-700 py-1">
            <span>{feature}</span>
            <span className={enabled ? 'text-green-400' : 'text-red-400'}>
              {enabled ? 'Enabled ✓' : 'Disabled ✗'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
} 