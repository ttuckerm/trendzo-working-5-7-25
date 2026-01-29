'use client';

import React, { useState } from 'react';
import { 
  Book, 
  Shield, 
  Target, 
  BarChart3, 
  Settings, 
  ExternalLink,
  ChevronRight,
  Database,
  Cpu,
  Network
} from 'lucide-react';

/**
 * Deep Dive Mode - Complete system access
 * Provides links and previews of all major system components
 */
export const DeepDiveMode: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const systemSections = [
    {
      id: 'recipe-book',
      title: 'Recipe Book',
      description: 'Templates, optimization & A/B testing',
      icon: Book,
      color: 'from-blue-500 to-cyan-500',
      url: '/admin/recipe-book',
      stats: { templates: 45, active: 12, success: '89%' },
      features: [
        'Viral content templates',
        'A/B testing framework',
        'Performance optimization',
        'Custom template builder'
      ]
    },
    {
      id: 'armory',
      title: 'Armory',
      description: 'Frameworks & weapons vault',
      icon: Shield,
      color: 'from-red-500 to-orange-500',
      url: '/admin/studio',
      stats: { frameworks: 23, active: 8, ready: '95%' },
      features: [
        'Content creation frameworks',
        'Marketing weapons vault',
        'Strategy deployment tools',
        'Campaign orchestration'
      ]
    },
    {
      id: 'proving-grounds',
      title: 'Proving Grounds',
      description: 'Analytics & performance data',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      url: '/admin/operations-center',
      stats: { experiments: 156, success: '73%', active: 24 },
      features: [
        'Real-time analytics',
        'Performance testing',
        'Experiment tracking',
        'Data visualization'
      ]
    }
  ];

  const advancedTools = [
    {
      title: 'System Configuration',
      description: 'Core system settings & preferences',
      icon: Settings,
      action: () => console.log('System Config'),
      status: 'active'
    },
    {
      title: 'Database Management',
      description: 'Data management & optimization',
      icon: Database,
      action: () => console.log('Database'),
      status: 'monitoring'
    },
    {
      title: 'Performance Monitor',
      description: 'System performance & health',
      icon: Cpu,
      action: () => console.log('Performance'),
      status: 'healthy'
    },
    {
      title: 'Network Analysis',
      description: 'Connection & API monitoring',
      icon: Network,
      action: () => console.log('Network'),
      status: 'active'
    }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const openInterface = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Deep Dive Mode</h2>
          <p className="text-gray-400">Complete system access & advanced features</p>
        </div>

        {/* Main System Sections */}
        <div className="space-y-4">
          {systemSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSection === section.id;
            
            return (
              <div
                key={section.id}
                className="bg-gray-800/50 rounded-xl border border-gray-700/30 overflow-hidden"
              >
                {/* Section Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color}`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                        <p className="text-gray-400">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => openInterface(section.url)}
                        className={`
                          px-4 py-2 rounded-lg bg-gradient-to-r ${section.color}
                          text-white font-medium hover:scale-105 transition-transform
                          flex items-center space-x-2
                        `}
                      >
                        <span>Open</span>
                        <ExternalLink size={16} />
                      </button>
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                      >
                        <ChevronRight 
                          size={20} 
                          className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 flex space-x-6">
                    {Object.entries(section.stats).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-bold text-white">{value}</div>
                        <div className="text-xs text-gray-400 capitalize">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-700/30">
                    <div className="pt-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Key Features</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {section.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Advanced Tools */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 size={20} className="mr-2 text-orange-400" />
            Advanced Tools
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advancedTools.map((tool, index) => {
              const Icon = tool.icon;
              const statusColors = {
                active: 'bg-green-500',
                monitoring: 'bg-yellow-500',
                healthy: 'bg-blue-500'
              };
              
              return (
                <button
                  key={index}
                  onClick={tool.action}
                  className="group p-4 bg-gray-800/30 rounded-xl border border-gray-700/30 hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon size={20} className="text-gray-300 group-hover:text-white" />
                    <div className={`w-2 h-2 rounded-full ${statusColors[tool.status as keyof typeof statusColors]}`} />
                  </div>
                  <h4 className="font-medium text-white mb-1">{tool.title}</h4>
                  <p className="text-sm text-gray-400">{tool.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-700/30">
          <h3 className="text-lg font-semibold text-white mb-4">System Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">98.5%</div>
              <div className="text-sm text-gray-400">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">1,247</div>
              <div className="text-sm text-gray-400">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">89ms</div>
              <div className="text-sm text-gray-400">Response Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};