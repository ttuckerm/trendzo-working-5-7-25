import React, { useState } from 'react';
import { 
  diagnoseSupabaseConnection, 
  SupabaseDiagnosticReport,
  DiagnosticResult
} from '../lib/supabaseConnectionDiagnostics';

export default function SupabaseDiagnosticTool() {
  const [loading, setLoading] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<SupabaseDiagnosticReport | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [diagnosticMode, setDiagnosticMode] = useState<'client' | 'server'>('client');
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    setLogs([]);
    
    addLog(`Starting ${diagnosticMode}-side diagnostics...`);
    
    try {
      let report: SupabaseDiagnosticReport;
      
      if (diagnosticMode === 'client') {
        // Run diagnostics directly in the browser
        addLog("Running client-side diagnostics...");
        report = await diagnoseSupabaseConnection();
        addLog("Client-side diagnostics completed");
      } else {
        // Call the server-side API for diagnostics
        addLog("Calling server-side diagnostics API...");
        const response = await fetch('/api/diagnostics/supabase');
        
        if (!response.ok) {
          throw new Error(`Server diagnostics failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Unknown server diagnostic error');
        }
        
        report = data.data;
        addLog("Server-side diagnostics completed");
      }
      
      setDiagnosticReport(report);
      
      // Automatically expand failed sections
      const newExpandedSections: Record<string, boolean> = {};
      Object.entries(report).forEach(([key, value]) => {
        if (typeof value === 'object' && 'isValid' in value && !value.isValid) {
          newExpandedSections[key] = true;
        }
      });
      setExpandedSections(newExpandedSections);
      
      addLog(`Diagnostics completed with status: ${report.overallStatus}`);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during diagnostics');
      addLog(`ERROR: ${err.message}`);
      console.error('Diagnostic error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getStatusColor = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'text-green-600' : 'text-red-600';
    }
    
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const renderDiagnosticSection = (title: string, result: DiagnosticResult) => {
    const isExpanded = expandedSections[title] || false;
    
    return (
      <div className="border border-gray-200 rounded-md mb-3">
        <div 
          className={`flex justify-between items-center p-3 cursor-pointer ${
            result.isValid ? 'bg-green-50' : 'bg-red-50'
          }`}
          onClick={() => toggleSection(title)}
        >
          <div className="flex items-center">
            <div className={`mr-2 font-bold ${getStatusColor(result.isValid)}`}>
              {result.isValid ? '✓' : '✗'}
            </div>
            <h3 className="font-medium">{title.replace(/([A-Z])/g, ' $1').trim()}</h3>
          </div>
          <div className="text-sm text-gray-500">
            {isExpanded ? '▼' : '►'}
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-3 border-t border-gray-200 bg-white">
            <p className="mb-2 text-gray-800">{result.details || 'No details available'}</p>
            <div className="text-xs text-gray-500">
              Checked at: {new Date(result.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Supabase Connection Diagnostics</h2>
        <p className="text-gray-600 mb-4">
          This tool diagnoses Supabase connectivity issues to help identify potential problems.
        </p>
        
        <div className="flex gap-4 mb-4">
          <div className="flex items-center">
            <input
              type="radio"
              id="client-mode"
              name="diagnostic-mode"
              value="client"
              checked={diagnosticMode === 'client'}
              onChange={() => setDiagnosticMode('client')}
              className="mr-2"
            />
            <label htmlFor="client-mode">Client-side diagnostics</label>
          </div>
          
          <div className="flex items-center">
            <input
              type="radio"
              id="server-mode"
              name="diagnostic-mode"
              value="server"
              checked={diagnosticMode === 'server'}
              onChange={() => setDiagnosticMode('server')}
              className="mr-2"
            />
            <label htmlFor="server-mode">Server-side diagnostics</label>
          </div>
        </div>
        
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-white font-medium ${
            loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <h3 className="font-bold mb-1">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {diagnosticReport && (
        <div className="mb-6">
          <div className={`p-4 mb-4 rounded-md ${
            getStatusColor(diagnosticReport.overallStatus) === 'text-green-600'
              ? 'bg-green-50 border border-green-200'
              : getStatusColor(diagnosticReport.overallStatus) === 'text-yellow-600'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className="font-bold mb-2">Diagnostic Summary</h3>
            <p className={`mb-2 ${getStatusColor(diagnosticReport.overallStatus)}`}>
              {diagnosticReport.summary}
            </p>
            
            {diagnosticReport.recommendedActions.length > 0 && (
              <div>
                <h4 className="font-semibold mt-3 mb-2">Recommended Actions:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {diagnosticReport.recommendedActions.map((action, i) => (
                    <li key={i} className="text-gray-700">{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <h3 className="font-bold mb-3">Detailed Results</h3>
          
          {renderDiagnosticSection('environmentVariables', diagnosticReport.environmentVariables)}
          {renderDiagnosticSection('networkConnectivity', diagnosticReport.networkConnectivity)}
          {renderDiagnosticSection('corsConfiguration', diagnosticReport.corsConfiguration)}
          {renderDiagnosticSection('dnsResolution', diagnosticReport.dnsResolution)}
          {renderDiagnosticSection('firewallConfiguration', diagnosticReport.firewallConfiguration)}
          {renderDiagnosticSection('authEndpoints', diagnosticReport.authEndpoints)}
          {renderDiagnosticSection('clientLibrary', diagnosticReport.clientLibrary)}
        </div>
      )}
      
      {logs.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-2">Diagnostic Logs</h3>
          <div className="bg-gray-900 text-gray-100 p-3 rounded-md h-64 overflow-y-auto font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 