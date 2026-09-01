import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300 relative">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-32 w-[520px] h-[520px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-1 relative pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}