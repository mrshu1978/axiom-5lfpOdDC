import React, { useState } from 'react';
import { useLongPress } from '../../hooks/useLongPress';
import { FireworksOverlay } from '../FireworksOverlay';

interface FooterProps {
  className?: string;
}

export const Footer = ({ className = '' }: FooterProps) => {
  const [showFireworks, setShowFireworks] = useState(false);
  const longPressHandlers = useLongPress(() => {
    setShowFireworks(true);
  }, { duration: 1500 });

  const handleCloseFireworks = () => {
    setShowFireworks(false);
  };

  return (
    <>
      <footer
        className={`fixed bottom-0 left-0 right-0 bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] px-4 py-3 z-10 ${className}`}
        style={{
          // Ensure safe area inset on mobile
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-center items-center">
            <p
              className="text-[12px] text-[var(--color-text-muted)] whitespace-nowrap overflow-hidden text-ellipsis text-center"
              style={{
                // Ensure single line with ellipsis on narrow screens
                maxWidth: '100%',
              }}
            >
              <span
                {...longPressHandlers}
                className="cursor-pointer select-none"
              >
                Created by axiom.core
              </span>
            </p>
          </div>
        </div>
      </footer>
      {showFireworks && <FireworksOverlay onClose={handleCloseFireworks} />}
    </>
  );
};