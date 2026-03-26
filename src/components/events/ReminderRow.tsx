import { ChangeEvent } from 'react';

const MINUTE_OPTIONS = [
  { value: 5, label: '5 minuti prima' },
  { value: 15, label: '15 minuti prima' },
  { value: 30, label: '30 minuti prima' },
  { value: 60, label: '1 ora prima' },
  { value: 1440, label: '1 giorno prima' },
];

interface ReminderRowProps {
  value: number;
  onChange: (minutes: number) => void;
  onRemove: () => void;
}

export const ReminderRow = ({ value, onChange, onRemove }: ReminderRowProps) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={handleChange}
        className="flex-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-[#F8F8F8] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
      >
        {MINUTE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onRemove}
        className="w-7 h-7 flex items-center justify-center bg-[#2A2A2A] hover:bg-[#3A3A3A] rounded-lg text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
        aria-label="Rimuovi promemoria"
      >
        ×
      </button>
    </div>
  );
};