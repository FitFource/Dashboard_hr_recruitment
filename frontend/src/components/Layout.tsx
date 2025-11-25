import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ClipboardList, 
  LogOut,
  Menu,
  X 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/candidates', icon: Users, label: 'Candidates' },
    { path: '/questions', icon: FileText, label: 'Questions' },
    { path: '/requirements', icon: ClipboardList, label: 'Requirements' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-mint-25 to-white text-black">
      {/* Header */}
      <header className="bg-gradient-to-r from-mint-300 to-mint-400 shadow-lg border-b border-mint-500/20 fixed w-full z-10">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-black">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden mr-2 p-2 rounded-xl hover:bg-mint-300/80 transition-all hover:shadow-md"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold tracking-tight">
              HR Recruitment Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block bg-white/40 backdrop-blur-sm rounded-2xl p-2 shadow-md border border-white/40">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "User"}&fontWeight=900&backgroundColor=B5D9C7`}
                alt="profile"
                className="w-8 h-8 rounded-xl"
              />
            </div>
            <div className="text-sm hidden sm:block">
              <p>{user?.name}</p>
              <p className="opacity-70 capitalize text-xs">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-peach-200 text-black transition-all hover:scale-110 hover:shadow-md"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-full w-64 bg-gradient-to-b from-mint-150 via-mint-100 to-white backdrop-blur-sm border-r border-mint-300/40 shadow-xl transform transition-transform duration-300 ease-in-out z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <nav className="p-4 space-y-2 text-black">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-mint-400 to-mint-300 shadow-md border border-mint-500/20 scale-[1.02] text-black'
                  : 'hover:bg-mint-200/70 hover:text-black hover:translate-x-1 hover:shadow-sm'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 min-h-screen text-black">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-10 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
