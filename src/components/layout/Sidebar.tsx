interface SidebarProps {
  mobile?: boolean;
}

export const Sidebar = ({ mobile }: SidebarProps) => {
  if (mobile) {
    return (
      <div className="flex items-center justify-around">
        <button className="flex flex-col items-center text-sm">
          <div className="w-6 h-6 bg-[#6366F1] rounded mb-1"></div>
          <span>Calendari</span>
        </button>
        <button className="flex flex-col items-center text-sm">
          <div className="w-6 h-6 bg-[#6366F1] rounded mb-1"></div>
          <span>Mini-Cal</span>
        </button>
        <button className="flex flex-col items-center text-sm">
          <div className="w-6 h-6 bg-[#6366F1] rounded mb-1"></div>
          <span>Impostazioni</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="font-bold text-lg mb-4">Calendari</h2>
      <ul className="space-y-2 mb-8">
        {['Personale', 'Lavoro', 'Famiglia'].map((name, idx) => (
          <li key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-[#2A2A2A]">
            <div className="w-4 h-4 rounded-full bg-[#6366F1]"></div>
            <span>{name}</span>
          </li>
        ))}
      </ul>

      <h2 className="font-bold text-lg mb-4">Mini-Calendario</h2>
      <div className="bg-[#2A2A2A] rounded-lg p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="p-1">{day}</div>
          ))}
          {Array.from({ length: 31 }).map((_, i) => (
            <div key={i} className={`p-1 ${i + 1 === 26 ? 'bg-[#6366F1] rounded' : ''}`}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};