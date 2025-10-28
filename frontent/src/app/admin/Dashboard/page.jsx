'use client'
import { useState } from 'react';
import { Menu, X, Home, Package, CreditCard, Settings, ChevronRight, TrendingUp, Users, ShoppingCart, DollarSign, Activity, Clock } from 'lucide-react';

// const navigationItems = [
//   { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
//   { name: 'COD Settings', href: '/admin/adminCodeSettings', icon: Package },
//   { name: 'Payment Settings', href: '/admin/adminPaymentMethod', icon: CreditCard },
//   { name: 'Advanced Settings', href: '/admin/advanced-settings', icon: Settings },
// ];

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('/admin/dashboard');

  const stats = [
    { label: 'Total Revenue', value: '$45,231', change: '+12.5%', icon: DollarSign, color: 'bg-green-500' },
    { label: 'Total Orders', value: '1,429', change: '+8.2%', icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Active Users', value: '3,847', change: '+23.1%', icon: Users, color: 'bg-purple-500' },
    { label: 'Conversion Rate', value: '3.24%', change: '+2.4%', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const recentOrders = [
    { id: '#ORD-001', customer: 'John Doe', amount: '$125.00', status: 'Completed', time: '2 mins ago' },
    { id: '#ORD-002', customer: 'Jane Smith', amount: '$89.50', status: 'Processing', time: '15 mins ago' },
    { id: '#ORD-003', customer: 'Mike Johnson', amount: '$245.00', status: 'Completed', time: '1 hour ago' },
    { id: '#ORD-004', customer: 'Sarah Williams', amount: '$67.25', status: 'Pending', time: '2 hours ago' },
    { id: '#ORD-005', customer: 'Tom Brown', amount: '$189.99', status: 'Completed', time: '3 hours ago' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      <div className="flex">
        {/* Sidebar */}
        {/* <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed md:sticky top-[73px] left-0 h-[calc(100vh-73px)] bg-white shadow-xl w-64 transition-transform duration-300 ease-in-out z-40 overflow-y-auto`}
        >
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => setActiveNav(item.href)}
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
                </button>
              );
            })}
          </nav>
        </aside> */}

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden top-[73px]"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
              <p className="text-gray-600">Heres whats happening with your store today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <span className="text-green-600 text-sm font-semibold">{stat.change}</span>
                    </div>
                    <h3 className="text-gray-600 text-sm mb-1">{stat.label}</h3>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold">
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order ID</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-gray-800">{order.id}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{order.customer}</td>
                          <td className="py-3 px-4 text-sm font-semibold text-gray-800">{order.amount}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500 flex items-center">
                            <Clock size={14} className="mr-1" />
                            {order.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center space-x-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
                    <Package size={20} />
                    <span className="font-medium">Add New Product</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors">
                    <Users size={20} />
                    <span className="font-medium">View Customers</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors">
                    <Activity size={20} />
                    <span className="font-medium">View Analytics</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors">
                    <Settings size={20} />
                    <span className="font-medium">Manage Settings</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}