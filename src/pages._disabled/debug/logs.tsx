// src/pages/debug/logs.tsx (only for development)
import { useEffect, useState } from 'react';

export default function LogViewer() {
  const [logs, setLogs] = useState([]);
  const [currentLog, setCurrentLog] = useState(null);
  const [logContent, setLogContent] = useState([]);
  const [filter, setFilter] = useState('');
  
  useEffect(() => {
    // Fetch available logs
    fetch('/api/debug/logs')
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        if (data.logs && data.logs.length > 0) {
          setCurrentLog(data.logs[0].name);
        }
      });
  }, []);
  
  useEffect(() => {
    // Fetch selected log content
    if (currentLog) {
      fetch(`/api/debug/logs?file=${currentLog}`)
        .then(res => res.json())
        .then(data => {
          setLogContent(data.lines || []);
        });
    }
  }, [currentLog]);
  
  // Filter log entries
  const filteredContent = filter 
    ? logContent.filter(entry => 
        JSON.stringify(entry).toLowerCase().includes(filter.toLowerCase()))
    : logContent;
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Log Viewer</h1>
      
      <div className="mb-4">
        <select 
          value={currentLog || ''} 
          onChange={(e) => setCurrentLog(e.target.value)}
          className="mr-4 p-2 border rounded"
        >
          {logs.map(log => (
            <option key={log.name} value={log.name}>
              {log.name} ({new Date(log.modified).toLocaleString()})
            </option>
          ))}
        </select>
        
        <input
          type="text"
          placeholder="Filter logs..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      
      <div className="border rounded p-2 bg-gray-50 overflow-auto h-[70vh]">
        {filteredContent.map((entry, index) => (
          <div key={index} className="mb-2 p-2 border-b">
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(entry, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}