'use client';
import { useState } from 'react';
import { Menu, X, Home, Package, CreditCard, Settings, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { name: 'Dashboard', href: '/admin/Dashboard', icon: Home },
  { name: 'COD Settings', href: '/admin/adminCodeSettings', icon: Package },
  { name: 'Payment Settings', href: '/admin/adminPaymentMethod', icon: CreditCard },
  { name: 'Shipping', href: '/admin/adminShipping', icon: Settings },
];

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const handleMobileClose = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fixed at top */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <div className="text-sm opacity-90">Welcome back,</div>
              <div className="font-semibold">Administrator</div>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-semibold">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Container with flex layout */}
      <div className="flex pt-[73px]">
        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed md:sticky top-[73px] left-0 h-[calc(100vh-73px)] bg-white shadow-xl w-64 transition-transform duration-300 ease-in-out z-40 overflow-y-auto`}
        >
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleMobileClose}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {isActive && <ChevronRight size={18} />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden top-[73px]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content - Scrollable */}
        <main className={`flex-1 p-6 md:p-8 transition-all duration-300 ${
          isSidebarOpen ? 'md:ml-0' : ''
        }`}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}