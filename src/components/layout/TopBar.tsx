export const TopBar = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xl font-bold">Agenda</div>
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 rounded-lg bg-[#6366F1] hover:bg-[#4F46E5] transition-colors">
          Vista Mese
        </button>
        <div className="w-8 h-8 rounded-full bg-[#6366F1]"></div>
      </div>
    </div>
  );
};