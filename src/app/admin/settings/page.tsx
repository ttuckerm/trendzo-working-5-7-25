'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  return (
    <div className="space-y-6">
      {toastVisible && (
        <div className="fixed top-4 right-4 bg-green-50 p-4 rounded-md shadow-lg z-50 animate-fadeIn">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Settings updated successfully</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setToastVisible(false)}
                  className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pb-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Settings</h3>
        <p className="mt-2 max-w-4xl text-sm text-gray-500">
          Manage application settings and configurations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="space-y-1">
            {[
              { id: 'general', name: 'General' },
              { id: 'security', name: 'Security & Privacy' },
              { id: 'notifications', name: 'Notifications' },
              { id: 'integrations', name: 'Integrations' },
              { id: 'appearance', name: 'Appearance' },
              { id: 'billing', name: 'Billing' },
              { id: 'advanced', name: 'Advanced' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`${
                  activeTab === item.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">General Settings</h3>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company-name"
                    id="company-name"
                    defaultValue="Trendzo"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="site-url" className="block text-sm font-medium text-gray-700">
                    Site URL
                  </label>
                  <input
                    type="url"
                    name="site-url"
                    id="site-url"
                    defaultValue="https://trendzo.io"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    name="contact-email"
                    id="contact-email"
                    defaultValue="hello@trendzo.io"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    defaultValue="America/Los_Angeles"
                  >
                    <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                    <option value="America/Denver">Mountain Time (US & Canada)</option>
                    <option value="America/Chicago">Central Time (US & Canada)</option>
                    <option value="America/New_York">Eastern Time (US & Canada)</option>
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="date-format" className="block text-sm font-medium text-gray-700">
                    Date Format
                  </label>
                  <select
                    id="date-format"
                    name="date-format"
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                    defaultValue="MM/DD/YYYY"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={showToast}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Security & Privacy</h3>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                  <div className="mt-2 flex justify-between items-center">
                    <p className="text-sm text-gray-500">Require 2FA for all admin users</p>
                    <button
                      type="button"
                      className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      role="switch"
                      aria-checked="true"
                    >
                      <span className="translate-x-5 pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out">
                        <span className="absolute inset-0 flex h-full w-full items-center justify-center transition-opacity opacity-0 duration-100 ease-out" aria-hidden="true">
                          <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                            <path d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="absolute inset-0 flex h-full w-full items-center justify-center transition-opacity opacity-100 duration-200 ease-in" aria-hidden="true">
                          <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                          </svg>
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">Session Management</h4>
                  <div className="mt-2">
                    <label htmlFor="session-timeout" className="block text-sm text-gray-500">
                      Admin session timeout (minutes)
                    </label>
                    <input
                      type="number"
                      name="session-timeout"
                      id="session-timeout"
                      defaultValue="60"
                      min="5"
                      max="1440"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900">Password Policy</h4>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-center">
                      <input
                        id="require-uppercase"
                        name="require-uppercase"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="require-uppercase" className="ml-2 block text-sm text-gray-900">
                        Require at least one uppercase letter
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="require-lowercase"
                        name="require-lowercase"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="require-lowercase" className="ml-2 block text-sm text-gray-900">
                        Require at least one lowercase letter
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="require-number"
                        name="require-number"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="require-number" className="ml-2 block text-sm text-gray-900">
                        Require at least one number
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="require-special"
                        name="require-special"
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="require-special" className="ml-2 block text-sm text-gray-900">
                        Require at least one special character
                      </label>
                    </div>
                    <div className="flex items-center">
                      <label htmlFor="min-length" className="block text-sm text-gray-900 mr-4 min-w-32">
                        Minimum password length:
                      </label>
                      <input
                        type="number"
                        name="min-length"
                        id="min-length"
                        defaultValue="8"
                        min="6"
                        max="32"
                        className="block w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={showToast}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Notification Settings</h3>
              </div>
              <div className="p-4 space-y-6">
                <fieldset>
                  <legend className="text-sm font-medium text-gray-900">Email Notifications</legend>
                  <div className="mt-2 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="new-templates"
                          name="new-templates"
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="new-templates" className="font-medium text-gray-700">New Templates Added</label>
                        <p className="text-gray-500">Get notified when new templates are added to the system.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="user-signup"
                          name="user-signup"
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="user-signup" className="font-medium text-gray-700">New User Signups</label>
                        <p className="text-gray-500">Get notified when new users register on the platform.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="system-alerts"
                          name="system-alerts"
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="system-alerts" className="font-medium text-gray-700">System Alerts</label>
                        <p className="text-gray-500">Get notified about important system events and potential issues.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="security-alerts"
                          name="security-alerts"
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="security-alerts" className="font-medium text-gray-700">Security Alerts</label>
                        <p className="text-gray-500">Get notified about security-related events.</p>
                      </div>
                    </div>
                  </div>
                </fieldset>

                <fieldset className="pt-5 border-t border-gray-200">
                  <legend className="text-sm font-medium text-gray-900">Notification Preferences</legend>
                  <div className="mt-2 space-y-4">
                    <div>
                      <label htmlFor="digest-frequency" className="block text-sm font-medium text-gray-700">
                        Email Digest Frequency
                      </label>
                      <select
                        id="digest-frequency"
                        name="digest-frequency"
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        defaultValue="daily"
                      >
                        <option value="realtime">Real-time</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={showToast}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Integrations</h3>
              </div>
              <div className="p-4 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { id: 'tiktok', name: 'TikTok', logo: '📱', status: 'connected', description: 'Connect to TikTok API for template data' },
                    { id: 'google', name: 'Google Analytics', logo: '📊', status: 'connected', description: 'Track website analytics and user engagement' },
                    { id: 'slack', name: 'Slack', logo: '💬', status: 'disconnected', description: 'Receive notifications in your Slack workspace' },
                    { id: 'stripe', name: 'Stripe', logo: '💳', status: 'connected', description: 'Process payments and manage subscriptions' },
                    { id: 'zapier', name: 'Zapier', logo: '⚡', status: 'disconnected', description: 'Connect with 3000+ apps and automate workflows' },
                    { id: 'mailchimp', name: 'Mailchimp', logo: '📧', status: 'disconnected', description: 'Manage email marketing campaigns' },
                  ].map((integration) => (
                    <div key={integration.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                          {integration.logo}
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">{integration.name}</h4>
                          <p className="text-sm text-gray-500">{integration.description}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          integration.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {integration.status === 'connected' ? 'Connected' : 'Not connected'}
                        </span>
                        <button
                          type="button"
                          className={`inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md ${
                            integration.status === 'connected'
                              ? 'text-red-700 bg-red-100 hover:bg-red-200'
                              : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                          }`}
                        >
                          {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={showToast}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'appearance' || activeTab === 'billing' || activeTab === 'advanced') && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {activeTab === 'appearance' ? 'Appearance Settings' : activeTab === 'billing' ? 'Billing Settings' : 'Advanced Settings'}
                </h3>
              </div>
              <div className="p-4">
                {activeTab === 'advanced' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-900">System Controls</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a href="/admin/settings/analyzer" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-md">
                              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <h5 className="text-sm font-medium text-gray-900">Template Analyzer Settings</h5>
                              <p className="text-sm text-gray-500">Configure prediction parameters and weights</p>
                            </div>
                          </div>
                        </a>
                        
                        {/* Placeholder for future settings modules */}
                        <div className="block p-4 border border-gray-200 rounded-lg opacity-50">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <h5 className="text-sm font-medium text-gray-400">Additional Settings</h5>
                              <p className="text-sm text-gray-400">Coming soon</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900">System Maintenance</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        These actions affect the entire system. Proceed with caution.
                      </p>
                      <div className="mt-4 space-y-3">
                        {/* Placeholder for future system maintenance actions */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 