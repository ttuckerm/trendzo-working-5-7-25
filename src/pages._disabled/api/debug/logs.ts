// src/pages/api/debug/logs.ts (only accessible in development)
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security check - only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const logDir = path.join(process.cwd(), 'logs');
  
  try {
    // List available logs
    if (req.method === 'GET' && !req.query.file) {
      const logs = fs.readdirSync(logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          size: fs.statSync(path.join(logDir, file)).size,
          modified: fs.statSync(path.join(logDir, file)).mtime
        }))
        .sort((a, b) => b.modified.getTime() - a.modified.getTime());
        
      return res.status(200).json({ logs });
    }
    
    // Get specific log content
    if (req.method === 'GET' && req.query.file) {
      const fileName = String(req.query.file);
      const filePath = path.join(logDir, fileName);
      
      // Security check - make sure it's actually a log file
      if (!fileName.endsWith('.log') || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Log file not found' });
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(Boolean).map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { raw: line };
        }
      });
      
      return res.status(200).json({ 
        fileName,
        lines,
        count: lines.length
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error accessing logs:', error);
    res.status(500).json({ error: 'Failed to access logs' });
  }
}