import { useState } from 'react';

const COLOR_SWATCHES = [
  '#4285F4', // blue
  '#0F9D58', // green
  '#F4B400', // yellow
  '#DB4437', // red
  '#6366F1', // indigo (accent)
  '#EC4899', // pink
  '#8B5CF6', // purple
  '#14B8A6', // teal
];

interface ColorPickerProps {
  selectedColor?: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ selectedColor = COLOR_SWATCHES[0], onChange }: ColorPickerProps) => {
  return (
    <div className="flex gap-3">
      {COLOR_SWATCHES.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className="rounded-full w-5 h-5 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1A1A1A] focus:ring-[#6366F1] transition-all"
          style={{
            backgroundColor: color,
            border: selectedColor === color ? '2px solid #FFFFFF' : '2px solid transparent',
            boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : 'none',
          }}
          aria-label={`Select color ${color}`}
        />
      ))}
    </div>
  );
};