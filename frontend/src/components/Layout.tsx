import React, { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  GitBranch,
  Calendar,
  BarChart3,
  FileText,
  Gift,
  Bell,
  Menu,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import ChatbotWidget from './ChatbotWidget';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/jobs', label: 'Jobs', icon: Briefcase },
  { path: '/candidates', label: 'Candidates', icon: Users },
  { path: '/pipeline', label: 'Pipeline', icon: GitBranch },
  { path: '/interviews', label: 'Interviews', icon: Calendar },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/templates', label: 'Templates', icon: FileText },
  { path: '/offers', label: 'Offers', icon: Gift },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile } = useGetCallerUserProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const userInitials = userProfile?.name
    ? userProfile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const currentLabel = navItems.find((n) => isActive(n.path))?.label || 'Dashboard';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <img
          src="/assets/generated/hireiq-logo.dim_200x60.png"
          alt="HireIQ"
          className="h-8 w-auto object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('span');
              fallback.className = 'text-lg font-display font-bold text-teal';
              fallback.textContent = 'HireIQ';
              parent.appendChild(fallback);
            }
          }}
        />
        <div className="flex items-center gap-1 ml-auto">
          <Sparkles className="w-3.5 h-3.5 text-teal" />
          <span className="text-[10px] text-teal font-medium">AI</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
              isActive(path)
                ? 'bg-teal/15 text-teal border border-teal/20'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground border border-transparent'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 flex-shrink-0',
                isActive(path)
                  ? 'text-teal'
                  : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
              )}
            />
            <span>{label}</span>
            {isActive(path) && <ChevronRight className="w-3 h-3 ml-auto text-teal" />}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className="bg-teal/20 text-teal text-xs font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userProfile?.name || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/50 truncate">
              {userProfile?.role || 'Recruiter'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="w-7 h-7 flex-shrink-0 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-sidebar border-r border-sidebar-border z-10 animate-slide-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 lg:px-6 h-14 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden lg:block">
              <h1 className="text-sm font-semibold text-foreground">{currentLabel}</h1>
            </div>
            {/* Mobile logo */}
            <span className="lg:hidden text-base font-display font-bold text-teal">HireIQ</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden sm:flex items-center gap-1 text-xs border-teal/30 text-teal bg-teal/5"
            >
              <Sparkles className="w-3 h-3" />
              AI Active
            </Badge>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-teal rounded-full" />
            </Button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Avatar className="w-7 h-7">
                <AvatarFallback className="bg-teal/20 text-teal text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {userProfile?.name || 'User'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
}
