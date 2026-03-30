'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings, 
  Database, 
  Key, 
  Bell, 
  Shield, 
  Activity, 
  Cpu, 
  Cloud,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

interface SystemConfig {
  api: {
    openaiKey: string;
    anthropicKey: string;
    apifyKey: string;
    supabaseUrl: string;
    supabaseKey: string;
  };
  pipeline: {
    apifyScraperInterval: number;
    maxConcurrentJobs: number;
    retryAttempts: number;
    timeoutMinutes: number;
    batchSize: number;
  };
  ml: {
    viralThreshold: number;
    geneExtractionModel: string;
    predictionAccuracyTarget: number;
    retrainingInterval: number;
    confidenceThreshold: number;
  };
  notifications: {
    emailEnabled: boolean;
    webhookUrl: string;
    slackWebhook: string;
    alertThresholds: {
      errorRate: number;
      responseTime: number;
      queueSize: number;
    };
  };
  performance: {
    cacheEnabled: boolean;
    cacheTtlMinutes: number;
    rateLimitPerMinute: number;
    maxMemoryUsage: number;
  };
  security: {
    requireAuth: boolean;
    sessionTimeoutMinutes: number;
    maxFailedAttempts: number;
    ipWhitelist: string[];
  };
  monitoring: {
    logLevel: string;
    metricsEnabled: boolean;
    performanceTracking: boolean;
    errorTracking: boolean;
  };
}

export default function SystemSettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({
    api: {
      openaiKey: '••••••••••••••••••••••••••••••••',
      anthropicKey: '••••••••••••••••••••••••••••••••',
      apifyKey: '••••••••••••••••••••••••••••••••',
      supabaseUrl: 'https://your-project.supabase.co',
      supabaseKey: '••••••••••••••••••••••••••••••••'
    },
    pipeline: {
      apifyScraperInterval: 3600,
      maxConcurrentJobs: 5,
      retryAttempts: 3,
      timeoutMinutes: 30,
      batchSize: 100
    },
    ml: {
      viralThreshold: 0.75,
      geneExtractionModel: 'gpt-4-turbo',
      predictionAccuracyTarget: 0.85,
      retrainingInterval: 7,
      confidenceThreshold: 0.8
    },
    notifications: {
      emailEnabled: true,
      webhookUrl: 'https://hooks.slack.com/services/...',
      slackWebhook: 'https://hooks.slack.com/services/...',
      alertThresholds: {
        errorRate: 5.0,
        responseTime: 5000,
        queueSize: 1000
      }
    },
    performance: {
      cacheEnabled: true,
      cacheTtlMinutes: 5,
      rateLimitPerMinute: 1000,
      maxMemoryUsage: 85
    },
    security: {
      requireAuth: true,
      sessionTimeoutMinutes: 60,
      maxFailedAttempts: 5,
      ipWhitelist: ['127.0.0.1', '10.0.0.0/8']
    },
    monitoring: {
      logLevel: 'info',
      metricsEnabled: true,
      performanceTracking: true,
      errorTracking: true
    }
  });

  const [activeTab, setActiveTab] = useState('api');
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{[key: string]: boolean}>({});

  const tabs = [
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'pipeline', label: 'Pipeline', icon: Activity },
    { id: 'ml', label: 'ML Models', icon: Cpu },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'performance', label: 'Performance', icon: Cloud },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'monitoring', label: 'Monitoring', icon: Activity }
  ];

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      console.log('Settings saved:', config);
    }, 2000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    
    // Simulate connection test
    setTimeout(() => {
      setTestingConnection(false);
      console.log('Connection test completed');
    }, 3000);
  };

  const toggleSecretVisibility = (field: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateNestedConfig = (section: keyof SystemConfig, subsection: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...(prev[section] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="h-8 w-8 text-gray-600" />
                ⚙️ System Settings
              </h1>
              <p className="text-gray-600 mt-1">Configure your viral prediction system parameters</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Test Connections
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="p-6">
            
            {/* API Keys Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OpenAI API Key
                      </label>
                      <div className="relative">
                        <Input
                          type={showSecrets.openai ? 'text' : 'password'}
                          value={config.api.openaiKey}
                          onChange={(e) => updateConfig('api', 'openaiKey', e.target.value)}
                          placeholder="sk-..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility('openai')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Anthropic API Key
                      </label>
                      <div className="relative">
                        <Input
                          type={showSecrets.anthropic ? 'text' : 'password'}
                          value={config.api.anthropicKey}
                          onChange={(e) => updateConfig('api', 'anthropicKey', e.target.value)}
                          placeholder="sk-ant-..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility('anthropic')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets.anthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apify API Key
                      </label>
                      <div className="relative">
                        <Input
                          type={showSecrets.apify ? 'text' : 'password'}
                          value={config.api.apifyKey}
                          onChange={(e) => updateConfig('api', 'apifyKey', e.target.value)}
                          placeholder="apify_api_..."
                        />
                        <button
                          type="button"
                          onClick={() => toggleSecretVisibility('apify')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets.apify ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supabase URL
                      </label>
                      <Input
                        value={config.api.supabaseUrl}
                        onChange={(e) => updateConfig('api', 'supabaseUrl', e.target.value)}
                        placeholder="https://your-project.supabase.co"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pipeline Tab */}
            {activeTab === 'pipeline' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pipeline Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Scraper Interval (seconds)
                      </label>
                      <Input
                        type="number"
                        value={config.pipeline.apifyScraperInterval}
                        onChange={(e) => updateConfig('pipeline', 'apifyScraperInterval', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Concurrent Jobs
                      </label>
                      <Input
                        type="number"
                        value={config.pipeline.maxConcurrentJobs}
                        onChange={(e) => updateConfig('pipeline', 'maxConcurrentJobs', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Retry Attempts
                      </label>
                      <Input
                        type="number"
                        value={config.pipeline.retryAttempts}
                        onChange={(e) => updateConfig('pipeline', 'retryAttempts', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout (minutes)
                      </label>
                      <Input
                        type="number"
                        value={config.pipeline.timeoutMinutes}
                        onChange={(e) => updateConfig('pipeline', 'timeoutMinutes', parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Batch Size
                      </label>
                      <Input
                        type="number"
                        value={config.pipeline.batchSize}
                        onChange={(e) => updateConfig('pipeline', 'batchSize', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ML Models Tab */}
            {activeTab === 'ml' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Machine Learning Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Viral Threshold (0-1)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={config.ml.viralThreshold}
                        onChange={(e) => updateConfig('ml', 'viralThreshold', parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gene Extraction Model
                      </label>
                      <select
                        value={config.ml.geneExtractionModel}
                        onChange={(e) => updateConfig('ml', 'geneExtractionModel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-4">GPT-4</option>
                        <option value="claude-3-opus">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prediction Accuracy Target (0-1)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={config.ml.predictionAccuracyTarget}
                        onChange={(e) => updateConfig('ml', 'predictionAccuracyTarget', parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Retraining Interval (days)
                      </label>
                      <Input
                        type="number"
                        value={config.ml.retrainingInterval}
                        onChange={(e) => updateConfig('ml', 'retrainingInterval', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                        <p className="text-sm text-gray-500">Receive email alerts for system events</p>
                      </div>
                      <Switch
                        checked={config.notifications.emailEnabled}
                        onCheckedChange={(checked) => updateConfig('notifications', 'emailEnabled', checked)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook URL
                      </label>
                      <Input
                        value={config.notifications.webhookUrl}
                        onChange={(e) => updateConfig('notifications', 'webhookUrl', e.target.value)}
                        placeholder="https://your-webhook-url.com/endpoint"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slack Webhook
                      </label>
                      <Input
                        value={config.notifications.slackWebhook}
                        onChange={(e) => updateConfig('notifications', 'slackWebhook', e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Alert Thresholds</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Error Rate (%)
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            value={config.notifications.alertThresholds.errorRate}
                            onChange={(e) => updateNestedConfig('notifications', 'alertThresholds', 'errorRate', parseFloat(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Response Time (ms)
                          </label>
                          <Input
                            type="number"
                            value={config.notifications.alertThresholds.responseTime}
                            onChange={(e) => updateNestedConfig('notifications', 'alertThresholds', 'responseTime', parseInt(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Queue Size
                          </label>
                          <Input
                            type="number"
                            value={config.notifications.alertThresholds.queueSize}
                            onChange={(e) => updateNestedConfig('notifications', 'alertThresholds', 'queueSize', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Performance Settings</h3>
                  <div className="space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Enable Caching</label>
                        <p className="text-sm text-gray-500">Cache responses to improve performance</p>
                      </div>
                      <Switch
                        checked={config.performance.cacheEnabled}
                        onCheckedChange={(checked) => updateConfig('performance', 'cacheEnabled', checked)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cache TTL (minutes)
                        </label>
                        <Input
                          type="number"
                          value={config.performance.cacheTtlMinutes}
                          onChange={(e) => updateConfig('performance', 'cacheTtlMinutes', parseInt(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rate Limit (per minute)
                        </label>
                        <Input
                          type="number"
                          value={config.performance.rateLimitPerMinute}
                          onChange={(e) => updateConfig('performance', 'rateLimitPerMinute', parseInt(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Memory Usage (%)
                        </label>
                        <Input
                          type="number"
                          value={config.performance.maxMemoryUsage}
                          onChange={(e) => updateConfig('performance', 'maxMemoryUsage', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Security Configuration</h3>
                  <div className="space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Require Authentication</label>
                        <p className="text-sm text-gray-500">Force users to authenticate before access</p>
                      </div>
                      <Switch
                        checked={config.security.requireAuth}
                        onCheckedChange={(checked) => updateConfig('security', 'requireAuth', checked)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <Input
                          type="number"
                          value={config.security.sessionTimeoutMinutes}
                          onChange={(e) => updateConfig('security', 'sessionTimeoutMinutes', parseInt(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Failed Attempts
                        </label>
                        <Input
                          type="number"
                          value={config.security.maxFailedAttempts}
                          onChange={(e) => updateConfig('security', 'maxFailedAttempts', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IP Whitelist
                      </label>
                      <Textarea
                        value={config.security.ipWhitelist.join('\n')}
                        onChange={(e) => updateConfig('security', 'ipWhitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                        placeholder="127.0.0.1&#10;10.0.0.0/8&#10;192.168.1.0/24"
                        rows={4}
                      />
                      <p className="text-sm text-gray-500 mt-1">One IP address or CIDR block per line</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monitoring Tab */}
            {activeTab === 'monitoring' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Monitoring Configuration</h3>
                  <div className="space-y-4">
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Log Level
                      </label>
                      <select
                        value={config.monitoring.logLevel}
                        onChange={(e) => updateConfig('monitoring', 'logLevel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="debug">Debug</option>
                        <option value="info">Info</option>
                        <option value="warn">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Metrics Collection</label>
                          <p className="text-sm text-gray-500">Collect system metrics</p>
                        </div>
                        <Switch
                          checked={config.monitoring.metricsEnabled}
                          onCheckedChange={(checked) => updateConfig('monitoring', 'metricsEnabled', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Performance Tracking</label>
                          <p className="text-sm text-gray-500">Track response times</p>
                        </div>
                        <Switch
                          checked={config.monitoring.performanceTracking}
                          onCheckedChange={(checked) => updateConfig('monitoring', 'performanceTracking', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Error Tracking</label>
                          <p className="text-sm text-gray-500">Track and report errors</p>
                        </div>
                        <Switch
                          checked={config.monitoring.errorTracking}
                          onCheckedChange={(checked) => updateConfig('monitoring', 'errorTracking', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium">Database Connection</div>
                  <div className="text-sm text-gray-500">Connected to Supabase</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <div className="font-medium">API Services</div>
                  <div className="text-sm text-gray-500">All APIs responding</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-orange-500" />
                <div>
                  <div className="font-medium">Pipeline Status</div>
                  <div className="text-sm text-gray-500">2 modules processing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}