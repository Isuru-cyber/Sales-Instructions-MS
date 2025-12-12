import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Send, 
  FileText, 
  Settings, 
  Activity, 
  LogOut, 
  Menu, 
  ChevronLeft,
  User as UserIcon,
  X
} from 'lucide-react';
import { useAuth } from '../App';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: [Role.Admin, Role.Commercial, Role.Sales] },
    { label: 'Submit Instructions', icon: Send, path: '/submit', roles: [Role.Admin, Role.Sales] },
    { label: 'Review Instructions', icon: FileText, path: '/instructions', roles: [Role.Admin, Role.Commercial, Role.Sales] },
    { label: 'Activity Logs', icon: Activity, path: '/logs', roles: [Role.Admin] },
    { label: 'Settings', icon: Settings, path: '/settings', roles: [Role.Admin, Role.Commercial, Role.Sales] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="h-screen w-full bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40 bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-20 md:translate-x-0'}
        `}
      >
        <div className="h-16 flex-none flex items-center justify-center border-b border-gray-100 relative">
             {isSidebarOpen ? (
                 <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">DF</div>
                    <span>DeliveryFlow</span>
                 </div>
             ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">DF</div>
             )}
             
             {/* Mobile Close Button */}
             <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 md:hidden text-gray-400"
             >
               <X size={20} />
             </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setIsSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                ${isActive ? 'bg-indigo-50 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
              title={!isSidebarOpen && !isMobile ? item.label : ''}
            >
              <item.icon className="flex-shrink-0" size={24} />
              {isSidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 flex-none">
           <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
              {isSidebarOpen && (
                  <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">
                          {user.shortName}
                      </div>
                      <div className="truncate">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                  </div>
              )}
               <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                   <LogOut size={20} />
               </button>
           </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="h-16 flex-none bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between z-20">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 focus:outline-none"
                >
                    {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
                </button>
                <h1 className="text-xl font-semibold text-gray-800 truncate">
                    {menuItems.find(m => m.path === location.pathname)?.label || 'Dashboard'}
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden md:block text-sm text-gray-500">
                    {new Date().toLocaleDateString()}
                </div>
                <div className="hidden md:block w-px h-6 bg-gray-200"></div>
                <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-primary">
                    <UserIcon size={18} />
                    <span className="hidden sm:inline">Profile</span>
                </button>
            </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 relative overflow-hidden bg-gray-50/50">
             {/* This inner div ensures absolute positioning works for full height, padding handles spacing */}
            <div className="absolute inset-0 p-4 md:p-6 flex flex-col w-full h-full">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};