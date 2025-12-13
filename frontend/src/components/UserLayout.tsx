import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  ClipboardList, 
  LogOut,
  Menu,
  X 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
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
    { path: '/user/home', icon: Home, label: 'Home' },
    { path: '/user/candidates', icon: Users, label: 'Candidates' },
    { path: '/user/requirements', icon: ClipboardList, label: 'Requirements' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background-light to-accent/20">
      {/* Header */}
      <header className="bg-primary-900 shadow-lg border-b border-primary-800/20 fixed w-full z-10">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-background">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden mr-2 p-2 rounded-xl hover:bg-primary-800 transition-all hover:shadow-md"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold tracking-tight">
              User Portal
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block bg-white/10 backdrop-blur-sm rounded-2xl p-2 shadow-md border border-white/20">
              <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || "User"}&fontWeight=900&backgroundColor=94B4C1`}
                alt="profile"
                className="w-8 h-8 rounded-xl"
              />
            </div>
            <div className="text-sm hidden sm:block">
              <p className="font-medium">{user?.name}</p>
              <p className="opacity-70 capitalize text-xs">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-primary-800 text-background transition-all hover:scale-110 hover:shadow-md"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-full w-64 bg-primary-900 border-r border-primary-800/40 shadow-xl transform transition-transform duration-300 ease-in-out z-20 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary-500 text-background shadow-md'
                  : 'text-accent hover:bg-primary-800 hover:text-background hover:translate-x-1 hover:shadow-sm'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-primary-900 bg-opacity-30 z-10 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default UserLayout;
