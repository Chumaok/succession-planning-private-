import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOffice2Icon,
  BriefcaseIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  UserCogIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: HomeIcon, exact: true },
  { to: '/org-structure', label: 'Org Structure', icon: BuildingOffice2Icon },
  { to: '/positions', label: 'Positions', icon: BriefcaseIcon },
  { to: '/employees', label: 'Employees', icon: UsersIcon },
  { to: '/risk-assessments', label: 'Risk Assessments', icon: ExclamationTriangleIcon },
  { to: '/succession-plans', label: 'Succession Plans', icon: ArrowPathIcon },
  { to: '/talent-pools', label: 'Talent Pools', icon: AcademicCapIcon },
  { to: '/workflows', label: 'Workflows', icon: ClipboardDocumentCheckIcon },
  { to: '/reports', label: 'Reports', icon: ChartBarIcon },
];

const roleColors = {
  ADMIN: 'bg-purple-100 text-purple-700',
  HR: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-green-100 text-green-700',
  EXECUTIVE_VIEWER: 'bg-orange-100 text-orange-700',
};

export default function Sidebar() {
  const { user, hasRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col bg-gray-900 text-white transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } min-h-screen flex-shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-white leading-tight">GlobalCorp</p>
            <p className="text-xs text-gray-400">Succession Planning</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded"
        >
          {collapsed ? (
            <ChevronDoubleRightIcon className="h-4 w-4" />
          ) : (
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ to, label, icon: Icon, exact }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
                title={collapsed ? label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            </li>
          ))}

          {hasRole('ADMIN') && (
            <li className="mt-2">
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
                title={collapsed ? 'User Management' : undefined}
              >
                <UserCogIcon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>User Management</span>}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>

      {/* User info */}
      {user && (
        <div className="px-3 py-4 border-t border-gray-700">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColors[user.role] || 'bg-gray-700 text-gray-300'}`}>
                  {user.role}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
