'use client';

import { useState } from 'react';
import { Save, Settings, Globe, Database, Mail, Shield } from 'lucide-react';

interface MVPSettings {
  landingPages: {
    enabled: boolean;
    domains: string[];
    defaultTemplate: string;
  };
  exitIntent: {
    enabled: boolean;
    delay: number;
    showOnMobile: boolean;
  };
  emailCapture: {
    provider: 'beehiiv' | 'mailchimp' | 'custom';
    apiKey: string;
    listId: string;
  };
  analytics: {
    enabled: boolean;
    trackingId: string;
    customEvents: boolean;
  };
}

export default function MVPSettings() {
  const [settings, setSettings] = useState<MVPSettings>({
    landingPages: {
      enabled: true,
      domains: ['app.trendzo.com', 'trendzo.ai'],
      defaultTemplate: 'viral-template-1'
    },
    exitIntent: {
      enabled: true,
      delay: 3000,
      showOnMobile: true
    },
    emailCapture: {
      provider: 'beehiiv',
      apiKey: '',
      listId: ''
    },
    analytics: {
      enabled: true,
      trackingId: '',
      customEvents: true
    }
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In real implementation, this would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (section: keyof MVPSettings, updates: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...updates
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">MVP Settings</h1>
        <p className="text-gray-600">Configure your MVP funnel settings and integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Landing Pages */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Landing Pages</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable Dynamic Landing Pages</label>
              <input
                type="checkbox"
                checked={settings.landingPages.enabled}
                onChange={(e) => updateSettings('landingPages', { enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Domains</label>
              <textarea
                value={settings.landingPages.domains.join('\n')}
                onChange={(e) => updateSettings('landingPages', { domains: e.target.value.split('\n').filter(d => d.trim()) })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter one domain per line"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Template</label>
              <select
                value={settings.landingPages.defaultTemplate}
                onChange={(e) => updateSettings('landingPages', { defaultTemplate: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="viral-template-1">Viral Template 1</option>
                <option value="viral-template-2">Viral Template 2</option>
                <option value="conversion-optimized">Conversion Optimized</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exit Intent */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Exit Intent</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable Exit Intent</label>
              <input
                type="checkbox"
                checked={settings.exitIntent.enabled}
                onChange={(e) => updateSettings('exitIntent', { enabled: e.target.checked })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trigger Delay (ms)
              </label>
              <input
                type="number"
                value={settings.exitIntent.delay}
                onChange={(e) => updateSettings('exitIntent', { delay: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                min="0"
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum time before exit intent can trigger</p>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Show on Mobile</label>
              <input
                type="checkbox"
                checked={settings.exitIntent.showOnMobile}
                onChange={(e) => updateSettings('exitIntent', { showOnMobile: e.target.checked })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Email Capture */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Email Capture</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
              <select
                value={settings.emailCapture.provider}
                onChange={(e) => updateSettings('emailCapture', { provider: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="beehiiv">Beehiiv</option>
                <option value="mailchimp">Mailchimp</option>
                <option value="custom">Custom API</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input
                type="password"
                value={settings.emailCapture.apiKey}
                onChange={(e) => updateSettings('emailCapture', { apiKey: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your API key"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">List/Audience ID</label>
              <input
                type="text"
                value={settings.emailCapture.listId}
                onChange={(e) => updateSettings('emailCapture', { listId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Enter list or audience ID"
              />
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable Analytics Tracking</label>
              <input
                type="checkbox"
                checked={settings.analytics.enabled}
                onChange={(e) => updateSettings('analytics', { enabled: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics ID</label>
              <input
                type="text"
                value={settings.analytics.trackingId}
                onChange={(e) => updateSettings('analytics', { trackingId: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="GA-XXXXXXXXXX"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Track Custom Events</label>
              <input
                type="checkbox"
                checked={settings.analytics.customEvents}
                onChange={(e) => updateSettings('analytics', { customEvents: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-600 text-white'
              : saving
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}