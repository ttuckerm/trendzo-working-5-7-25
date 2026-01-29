'use client';

import React, { useState } from 'react';
import { UnifiedShellButton } from './UnifiedShellButton';
import { UnifiedShellModal } from './UnifiedShellModal';

/**
 * Main Unified Shell component
 * Combines the floating button and modal for easy integration
 * Can be added to any existing page without modification
 */
export const UnifiedShell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleShell = () => {
    setIsOpen(!isOpen);
  };

  const closeShell = () => {
    setIsOpen(false);
  };

  return (
    <>
      <UnifiedShellButton onToggle={toggleShell} isOpen={isOpen} />
      <UnifiedShellModal isOpen={isOpen} onClose={closeShell} />
    </>
  );
};