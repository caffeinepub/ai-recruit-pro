import React from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/useQueries';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Candidates from './pages/Candidates';
import Pipeline from './pages/Pipeline';
import Interviews from './pages/Interviews';
import Analytics from './pages/Analytics';
import Templates from './pages/Templates';
import Offers from './pages/Offers';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, User } from 'lucide-react';
import { toast } from 'sonner';

// ── Auth Gate ─────────────────────────────────────────────────────────────

function LoginScreen() {
  const { login, loginStatus, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal/20 to-amber/20 border border-teal/30 mb-4">
            <Sparkles className="w-8 h-8 text-teal" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">HireIQ</h1>
          <p className="text-muted-foreground">AI-Powered Recruitment Platform</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <h2 className="text-xl font-display font-semibold text-foreground mb-2">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to access your recruitment dashboard
          </p>

          <Button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-11 bg-teal hover:bg-teal-dark text-white font-medium"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <User className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>

          {loginStatus === 'loginError' && (
            <p className="text-sm text-destructive mt-3 text-center">
              Login failed. Please try again.
            </p>
          )}

          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-teal flex-shrink-0" />
              <span>Secured by Internet Identity — no passwords required</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'hireiq-app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

function ProfileSetupModal() {
  const { actor } = { actor: null } as { actor: null };
  void actor;
  const saveProfile = useSaveCallerUserProfile();
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState('Recruiter');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim(), email: email.trim(), role });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal/20 border border-teal/30 mb-3">
            <User className="w-6 h-6 text-teal" />
          </div>
          <h2 className="text-xl font-display font-semibold text-foreground">Set Up Your Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Tell us a bit about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pname">Full Name *</Label>
            <Input
              id="pname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pemail">Email</Label>
            <Input
              id="pemail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prole">Role</Label>
            <Input
              id="prole"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Recruiter, HR Manager"
            />
          </div>
          <Button
            type="submit"
            disabled={saveProfile.isPending}
            className="w-full bg-teal hover:bg-teal-dark text-white"
          >
            {saveProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Profile
          </Button>
        </form>
      </div>
    </div>
  );
}

function AppShell() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-teal animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading HireIQ...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      {showProfileSetup && <ProfileSetupModal />}
      <Layout>
        <Outlet />
      </Layout>
    </>
  );
}

// ── Router Setup ──────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: AppShell,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const jobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/jobs',
  component: Jobs,
});

const candidatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/candidates',
  component: Candidates,
});

const pipelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pipeline',
  component: Pipeline,
});

const interviewsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/interviews',
  component: Interviews,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: Analytics,
});

const templatesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/templates',
  component: Templates,
});

const offersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/offers',
  component: Offers,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  jobsRoute,
  candidatesRoute,
  pipelineRoute,
  interviewsRoute,
  analyticsRoute,
  templatesRoute,
  offersRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}
