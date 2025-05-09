'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { AdjustmentImpactDetails } from '@/lib/types/expertDashboard';

interface TopImpactfulAdjustmentsTableProps {
  adjustments: AdjustmentImpactDetails[];
  showAll?: boolean;
}

export default function TopImpactfulAdjustmentsTable({ 
  adjustments,
  showAll = false
}: TopImpactfulAdjustmentsTableProps) {
  const [sortField, setSortField] = useState<keyof AdjustmentImpactDetails>('improvementPercent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  if (!adjustments || adjustments.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No impactful adjustments found.</p>
      </div>
    );
  }
  
  // Handle sorting
  const handleSort = (field: keyof AdjustmentImpactDetails) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sort the adjustments
  const sortedAdjustments = [...adjustments].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
    if (bValue === undefined) return sortDirection === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc' 
        ? aValue.getTime() - bValue.getTime() 
        : bValue.getTime() - aValue.getTime();
    }
    
    const aStr = String(aValue);
    const bStr = String(bValue);
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
  
  // Paginate the data
  const totalPages = Math.ceil(sortedAdjustments.length / itemsPerPage);
  const paginatedAdjustments = showAll 
    ? sortedAdjustments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : sortedAdjustments;
  
  // Get sort icon based on current sort state
  const getSortIcon = (field: keyof AdjustmentImpactDetails) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };
  
  // Format percentage values
  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };
  
  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8 -ml-4">
                      Category <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSort('category')}>
                      Sort {getSortIcon('category')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="w-[100px]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8 -ml-4">
                      Date <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSort('timestamp')}>
                      Sort {getSortIcon('timestamp')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="w-[80px] text-right">Original</TableHead>
              <TableHead className="w-[80px] text-right">Adjusted</TableHead>
              <TableHead className="w-[80px] text-right">Actual</TableHead>
              <TableHead className="w-[100px] text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1 h-8 -ml-4">
                      Improvement <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleSort('improvementPercent')}>
                      Sort {getSortIcon('improvementPercent')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="w-[100px]">Expert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAdjustments.map((adjustment) => (
              <TableRow key={adjustment.adjustmentId}>
                <TableCell className="font-medium">{adjustment.category}</TableCell>
                <TableCell>{format(adjustment.timestamp, 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">{adjustment.originalValue.toFixed(2)}</TableCell>
                <TableCell className="text-right">{adjustment.adjustedValue.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  {adjustment.actualValue !== undefined ? adjustment.actualValue.toFixed(2) : 'N/A'}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  adjustment.improvementPercent && adjustment.improvementPercent > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {adjustment.improvementPercent !== undefined 
                    ? formatPercent(adjustment.improvementPercent)
                    : 'N/A'
                  }
                </TableCell>
                <TableCell>{adjustment.expertId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {showAll && totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageNum = currentPage;
              if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              // Ensure page number is within valid range
              if (pageNum < 1 || pageNum > totalPages) return null;
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(pageNum);
                    }}
                    isActive={pageNum === currentPage}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
} 