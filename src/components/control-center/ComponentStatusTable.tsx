'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, Zap, Target } from 'lucide-react';
import { ComponentHealth } from '@/lib/control-center/types';
import { CATEGORY_CONFIG } from '@/lib/control-center/constants';
import { StatusDot, StatusBadge } from './StatusDot';

interface ComponentStatusRowProps {
  component: ComponentHealth;
  onClick?: () => void;
}

export function ComponentStatusRow({ component, onClick }: ComponentStatusRowProps) {
  const categoryConfig = CATEGORY_CONFIG[component.category] || CATEGORY_CONFIG.utility;
  
  return (
    <tr 
      onClick={onClick}
      className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <StatusDot status={component.status} />
          <div>
            <div className="font-medium text-white">{component.name}</div>
            <div className="text-xs text-gray-500">{component.description}</div>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryConfig.bgColor} ${categoryConfig.color}`}>
          {categoryConfig.label}
        </span>
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={component.status} />
      </td>
      <td className="py-3 px-4 text-sm text-gray-400">
        {component.latency ? (
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {component.latency < 1000 
              ? `${component.latency}ms` 
              : `${(component.latency / 1000).toFixed(1)}s`}
          </div>
        ) : '-'}
      </td>
      <td className="py-3 px-4 text-sm text-gray-400">
        {component.lastRun}
      </td>
      <td className="py-3 px-4 text-sm">
        {component.accuracy !== undefined ? (
          <div className="flex items-center gap-1 text-green-400">
            <Target size={12} />
            {component.accuracy}%
          </div>
        ) : '-'}
      </td>
      <td className="py-3 px-4">
        <ChevronRight size={16} className="text-gray-500" />
      </td>
    </tr>
  );
}

interface ComponentStatusTableProps {
  components: ComponentHealth[];
  onComponentClick?: (component: ComponentHealth) => void;
  filterCategory?: string;
  filterStatus?: string;
}

export function ComponentStatusTable({ 
  components, 
  onComponentClick,
  filterCategory,
  filterStatus 
}: ComponentStatusTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'status' | 'latency'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Filter components
  let filteredComponents = [...components];
  
  if (filterCategory && filterCategory !== 'all') {
    filteredComponents = filteredComponents.filter(c => c.category === filterCategory);
  }
  
  if (filterStatus && filterStatus !== 'all') {
    filteredComponents = filteredComponents.filter(c => c.status === filterStatus);
  }

  // Sort components
  filteredComponents.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'status':
        const statusOrder = { error: 0, warning: 1, running: 2, healthy: 3, inactive: 4 };
        comparison = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
        break;
      case 'latency':
        comparison = (a.latency || 0) - (b.latency || 0);
        break;
    }
    return sortDir === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const SortHeader = ({ column, children }: { column: typeof sortBy; children: React.ReactNode }) => (
    <th 
      onClick={() => handleSort(column)}
      className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <ChevronDown 
            size={12} 
            className={`transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} 
          />
        )}
      </div>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-900/50">
          <tr>
            <SortHeader column="name">Component</SortHeader>
            <SortHeader column="category">Category</SortHeader>
            <SortHeader column="status">Status</SortHeader>
            <SortHeader column="latency">Latency</SortHeader>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Last Run
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Accuracy
            </th>
            <th className="py-3 px-4 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {filteredComponents.map(component => (
            <ComponentStatusRow 
              key={component.id}
              component={component}
              onClick={() => onComponentClick?.(component)}
            />
          ))}
        </tbody>
      </table>
      
      {filteredComponents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No components match the current filters
        </div>
      )}
    </div>
  );
}

export default ComponentStatusTable;
































































































