'use client';

import React from 'react';
import { icons, LucideProps, FileText } from 'lucide-react';

interface DynamicLucideIconProps extends LucideProps {
  name: string;
}

const DynamicLucideIcon: React.FC<DynamicLucideIconProps> = ({ name, ...props }) => {
  // Try to find the icon in the Lucide icons
  const IconComponent = icons[name as keyof typeof icons];

  if (!IconComponent) {
    // Fallback icon if the specified name is not found
    return <FileText {...props} />;
  }

  return <IconComponent {...props} />;
};

export default DynamicLucideIcon; 