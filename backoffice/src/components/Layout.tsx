'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  HomeIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Asignación Aulas', href: '/asignacion-aulas', icon: AcademicCapIcon },
  { name: 'Facultades', href: '/facultades', icon: BuildingOfficeIcon },
  { name: 'Mapeos Sectores', href: '/mapeos-sectores', icon: ArrowPathIcon },
  { name: 'Mapeos Carreras', href: '/mapeos-carreras', icon: DocumentTextIcon },
  { name: 'Estadísticas', href: '/estadisticas', icon: ChartBarIcon },
  { name: 'Datos TOTEM', href: '/datos-totem', icon: DocumentTextIcon },
  { name: 'Config. Visual', href: '/configuracion-visual', icon: Cog6ToothIcon },
  { name: 'Configuración', href: '/configuracion', icon: Cog6ToothIcon },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 flex z-40 lg:hidden',
        sidebarOpen ? '' : 'pointer-events-none'
      )}>
        <div
          className={clsx(
            'fixed inset-0 bg-gray-600 bg-opacity-75',
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div className={clsx(
          'relative flex-1 flex flex-col max-w-xs w-full bg-white',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <Sidebar />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 shadow-sm">
            <button
              className="h-6 w-6 text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">TOTEM Backoffice</h1>
            <div className="w-6" />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );

  function Sidebar() {
    return (
      <div className="flex flex-col h-0 flex-1 bg-white shadow">
        {/* Logo */}
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-blue-600">
          <h1 className="text-lg font-bold text-white">TOTEM Backoffice</h1>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={clsx(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500">
            Universidad Católica de Salta
          </div>
        </div>
      </div>
    );
  }
} 