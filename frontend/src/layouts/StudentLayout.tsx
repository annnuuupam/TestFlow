import { Outlet } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-500">
      <Navbar />
      
      {/* Main page content area */}
      <main className="flex-1 pt-24 pb-20 animate-in fade-in duration-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}
