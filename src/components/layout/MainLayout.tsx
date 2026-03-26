import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useCalendarSync } from '../../hooks/useCalendarSync';
import { PushPermissionBanner } from '../notifications/PushPermissionBanner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  useCalendarSync();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="hidden md:grid md:grid-cols-[240px_1fr] h-screen">
        {/* Sidebar */}
        <aside className="bg-[#1A1A1A] border-r border-[#2A2A2A] overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main content */}
        <div className="flex flex-col overflow-hidden">
          <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] p-4">
            <TopBar />
          </header>
          <PushPermissionBanner />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col h-screen md:hidden">
        <header className="bg-[#1A1A1A] border-b border-[#2A2A2A] p-4">
          <TopBar />
        </header>
        <PushPermissionBanner />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
        <nav className="bg-[#1A1A1A] border-t border-[#2A2A2A] p-3">
          <Sidebar mobile />
        </nav>
      </div>

      <Footer />
    </div>
  );
};