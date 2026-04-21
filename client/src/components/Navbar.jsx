import { useLocation } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, BellIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';

const routeTitles = {
  '/': 'Dashboard',
  '/org-structure': 'Org Structure',
  '/positions': 'Positions',
  '/employees': 'Employees',
  '/risk-assessments': 'Risk Assessments',
  '/succession-plans': 'Succession Plans',
  '/talent-pools': 'Talent Pools',
  '/workflows': 'Workflows',
  '/reports': 'Reports',
  '/users': 'User Management',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'Dashboard';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400 mt-0.5">GlobalCorp Succession Planning System</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100">
          <BellIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
