'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Calendar,
  Clock,
  User,
  Code,
  ExternalLink,
  CheckCircle2,
  X,
  MessageSquare
} from 'lucide-react';

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'critical' | 'error' | 'warning' | 'info';
  module: string;
  category: string;
  message: string;
  details: string;
  stackTrace?: string;
  userId?: string;
  requestId?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
  count: number;
  firstOccurred: string;
  lastOccurred: string;
}

export default function ErrorLogsPage() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterResolved, setFilterResolved] = useState<string>('all');
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Fetch real error logs from API
  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLevel !== 'all') params.set('level', filterLevel);
      if (filterModule !== 'all') params.set('module', filterModule);
      if (filterResolved !== 'all') params.set('resolved', filterResolved === 'resolved' ? 'true' : 'false');
      
      const response = await fetch(`/api/error-logs?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        // Map API response to component interface
        const logs = result.data.map((log: any) => ({
          id: log.id,
          timestamp: log.timestamp,
          level: log.level,
          module: log.module,
          category: log.category,
          message: log.message,
          details: log.details,
          stackTrace: log.stack_trace,
          userId: log.user_id,
          requestId: log.request_id,
          resolved: log.resolved,
          resolvedBy: log.resolved_by,
          resolvedAt: log.resolved_at,
          notes: log.notes,
          count: log.count,
          firstOccurred: log.first_occurred,
          lastOccurred: log.last_occurred
        }));
        setErrorLogs(logs);
      } else {
        console.error('Failed to fetch error logs:', result.error);
        setErrorLogs([]);
      }
    } catch (error) {
      console.error('Error fetching error logs:', error);
      setErrorLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrorLogs();
  }, [filterLevel, filterModule, filterResolved]);

  // Real-time updates - poll for new errors
  useEffect(() => {
    if (!realTimeEnabled) return;

    const interval = setInterval(() => {
      fetchErrorLogs();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [realTimeEnabled, filterLevel, filterModule, filterResolved]);

  const filteredErrors = errorLogs.filter(error => {
    const matchesSearch = error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         error.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         error.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || error.level === filterLevel;
    const matchesModule = filterModule === 'all' || error.module === filterModule;
    const matchesResolved = filterResolved === 'all' || 
                           (filterResolved === 'resolved' && error.resolved) ||
                           (filterResolved === 'unresolved' && !error.resolved);
    
    return matchesSearch && matchesLevel && matchesModule && matchesResolved;
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'error': return 'bg-red-50 text-red-600 border-red-200';
      case 'warning': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'info': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const resolveError = async (errorId: string) => {
    try {
      const response = await fetch('/api/error-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: errorId,
          resolved: true,
          resolved_by: 'admin',
          notes: resolutionNote || 'Marked as resolved'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setErrorLogs(prev => prev.map(error => 
          error.id === errorId 
            ? { 
                ...error, 
                resolved: true, 
                resolvedBy: 'admin',
                resolvedAt: new Date().toISOString(),
                notes: resolutionNote || 'Marked as resolved'
              }
            : error
        ));
      } else {
        console.error('Failed to resolve error:', result.error);
      }
    } catch (error) {
      console.error('Error resolving error:', error);
    }
    
    setSelectedError(null);
    setResolutionNote('');
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const uniqueModules = Array.from(new Set(errorLogs.map(e => e.module)));

  const errorStats = {
    total: filteredErrors.length,
    critical: filteredErrors.filter(e => e.level === 'critical').length,
    error: filteredErrors.filter(e => e.level === 'error').length,
    warning: filteredErrors.filter(e => e.level === 'warning').length,
    unresolved: filteredErrors.filter(e => !e.resolved).length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
                🚨 Error Logs
              </h1>
              <p className="text-gray-600 mt-1">Monitor and resolve system errors across all modules</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant={realTimeEnabled ? 'default' : 'outline'}
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                size="sm"
              >
                {realTimeEnabled ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                    Live
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Paused
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{errorStats.total}</div>
              <div className="text-sm text-gray-500">Total Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorStats.critical}</div>
              <div className="text-sm text-gray-500">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{errorStats.error}</div>
              <div className="text-sm text-gray-500">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{errorStats.warning}</div>
              <div className="text-sm text-gray-500">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{errorStats.unresolved}</div>
              <div className="text-sm text-gray-500">Unresolved</div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search errors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>

            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Modules</option>
              {uniqueModules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>

            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="resolved">Resolved</option>
              <option value="unresolved">Unresolved</option>
            </select>

            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Error List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredErrors.map((error) => (
              <Card key={error.id} className={`hover:shadow-md transition-shadow ${error.resolved ? 'opacity-75' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getLevelIcon(error.level)}
                        <Badge className={getLevelColor(error.level)}>{error.level}</Badge>
                        <Badge variant="outline">{error.module}</Badge>
                        <Badge variant="outline">{error.category}</Badge>
                        {error.resolved && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        )}
                        {error.count > 1 && (
                          <Badge variant="secondary">{error.count}x</Badge>
                        )}
                      </div>
                      
                      <h3 className="font-medium text-gray-900 mb-2">{error.message}</h3>
                      <p className="text-sm text-gray-600 mb-3">{error.details}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(error.timestamp)}
                        </div>
                        {error.userId && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {error.userId}
                          </div>
                        )}
                        {error.requestId && (
                          <div className="flex items-center gap-1">
                            <Code className="h-3 w-3" />
                            {error.requestId}
                          </div>
                        )}
                        {error.count > 1 && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            First: {formatTimestamp(error.firstOccurred)}
                          </div>
                        )}
                      </div>

                      {error.resolved && error.notes && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-700">Resolution Notes:</span>
                          </div>
                          <p className="text-green-700">{error.notes}</p>
                          <p className="text-xs text-green-600 mt-1">
                            Resolved by {error.resolvedBy} at {formatTimestamp(error.resolvedAt!)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedError(error)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      {!error.resolved && (
                        <Button
                          size="sm"
                          onClick={() => setSelectedError(error)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredErrors.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No errors found</h3>
            <p className="text-gray-500">All systems are running smoothly or adjust your filters</p>
          </div>
        )}

        {/* Error Detail Modal */}
        {selectedError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Error Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedError(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                      <Badge className={getLevelColor(selectedError.level)}>{selectedError.level}</Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                      <Badge variant="outline">{selectedError.module}</Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <Badge variant="outline">{selectedError.category}</Badge>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                      <p className="text-sm">{formatTimestamp(selectedError.timestamp)}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedError.message}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                    <p className="text-sm bg-gray-50 p-3 rounded">{selectedError.details}</p>
                  </div>

                  {selectedError.stackTrace && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stack Trace</label>
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">{selectedError.stackTrace}</pre>
                    </div>
                  )}

                  {!selectedError.resolved && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
                      <Textarea
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Add notes about how this error was resolved..."
                        rows={3}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          onClick={() => resolveError(selectedError.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark as Resolved
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedError(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}