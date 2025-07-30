"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React from 'react';
import { signout } from '@/app/login/actions';

// --- Iconos ---
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>;
const PackageIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>;
const ShoppingCartIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.841a.75.75 0 0 0-.542-.924l-11.42-2.855a.75.75 0 0 0-.924.542l-1.823 6.841a.75.75 0 0 0 .542.924M7.5 14.25 6.106 5.165m0 0a.75.75 0 0 1 .542-.924l11.42-2.855a.75.75 0 0 1 .924.542l1.823 6.841a.75.75 0 0 1-.542.924l-11.42 2.855a.75.75 0 0 1-.924-.542Z" /></svg>;
const MenuIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const TagIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>;
const LogoutIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0-3-3m0 0 3-3m-3 3H9" /></svg>;
const BarcodeIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 0 1 4.5 3.75h15a.75.75 0 0 1 .75.75v15a.75.75 0 0 1-.75.75h-15a.75.75 0 0 1-.75-.75v-15Zm3.75 3a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Zm3.75 0a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Zm3.75 0a.75.75 0 0 0-1.5 0v9a.75.75 0 0 0 1.5 0v-9Z" /></svg>;
const PosIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V6.375m0 0A1.125 1.125 0 013.375 5.25h17.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375M17.25 9.75h.008v.008h-.008V9.75z" /></svg>;
const PresentationChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h-1.5m1.5 0h1.5m0 0h1.5m-1.5 0h-1.5m-6-12l3-3m0 0l3 3m-3-3v12.75" /></svg>;
const AcademicCapIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>;


const navLinks = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { name: 'Punto de Venta', href: '/admin/pos', icon: PosIcon },
  { name: 'Órdenes', href: '/admin/orders', icon: ShoppingCartIcon },
  { name: 'Reportes', href: '/admin/reports', icon: PresentationChartBarIcon },
  { name: 'Productos', href: '/admin/products', icon: PackageIcon },
  { name: 'Escuelas', href: '/admin/schools', icon: AcademicCapIcon },
  { name: 'Consulta', href: '/admin/consulta', icon: BarcodeIcon },
  { name: 'Filtro Inventario', href: '/admin/filtro', icon: TagIcon },
  { name: 'Catálogo', href: '/admin/catalog', icon: TagIcon },
];

interface SidebarProps { isCollapsed: boolean; toggleSidebar: () => void; }

export function Sidebar({ isCollapsed, toggleSidebar }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <div className="p-4">
        <div className="flex items-center justify-center mb-4">
          <div className={`flex items-center gap-3 transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-start w-full'}`}>
             <Image src="/logo.jpg" alt="Levist Uniforms Logo" width={32} height={32} className="rounded-md flex-shrink-0" />
             <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <h1 className="text-xl font-bold whitespace-nowrap">Levist</h1>
             </div>
          </div>
        </div>
        
        <button
          onClick={toggleSidebar}
          className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 h-9 mb-4 transition-all text-gray-400 hover:bg-gray-700 hover:text-white ${isCollapsed ? 'justify-center px-0' : ''}`}
          title={isCollapsed ? 'Acoplar' : 'Acoplar'}
        >
          <MenuIcon className="h-5 w-5 flex-shrink-0" />
          <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            Acoplar
          </span>
        </button>
        
        <ul className="space-y-1 flex-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link href={link.href} title={isCollapsed ? link.name : ''} className={`flex items-center gap-3 rounded-lg px-3 py-2 h-9 transition-all hover:bg-gray-700 ${isActive ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-white'} ${isCollapsed ? 'justify-center px-0' : ''}`}>
                  <link.icon className="h-5 w-5 flex-shrink-0" />
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto p-4 border-t border-gray-700">
        <form action={signout}>
            <button
                type="submit"
                className={`flex items-center gap-3 w-full rounded-lg px-3 py-2 h-9 transition-all text-gray-400 hover:bg-red-900/50 hover:text-white ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? 'Cerrar Sesión' : ''}
            >
                <LogoutIcon className="h-5 w-5 flex-shrink-0" />
                <span className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                    Cerrar Sesión
                </span>
            </button>
        </form>
      </div>
    </div>
  );
}
