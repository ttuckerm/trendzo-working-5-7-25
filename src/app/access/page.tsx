"use client"

import Link from 'next/link'
import { useState } from 'react'

export default function DirectAccessDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">Trendzo</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                DIRECT ACCESS MODE
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your Trendzo dashboard</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-8">
            {['dashboard', 'templates', 'analytics', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {['Templates Created', 'Total Views', 'Active Trends', 'Performance'].map((stat, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">{stat}</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {i === 0 ? '12' : i === 1 ? '8.5K' : i === 2 ? '24' : '85%'}
                </dd>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Templates */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Templates
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                'Product Showcase',
                'Dance Challenge',
                'Tutorial Format',
                'Trend Reaction',
                'Story Time',
                'Review Template'
              ].map((template, i) => (
                <div key={i} className="border border-gray-200 rounded-md p-4 hover:border-blue-500">
                  <div className="h-32 bg-gray-100 flex items-center justify-center mb-4">
                    <span className="text-gray-400">Template Preview</span>
                  </div>
                  <h4 className="font-medium text-gray-900">{template}</h4>
                  <p className="text-sm text-gray-500 mt-1">Created 3 days ago</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Actions
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                'Create New Template',
                'Explore Trends',
                'View Analytics',
                'Settings'
              ].map((action, i) => (
                <button
                  key={i}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 