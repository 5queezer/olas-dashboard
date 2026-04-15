import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  Navigate,
} from "@tanstack/react-router";
import { NavHeader } from "@/components/nav-header";
import { LoginPage } from "@/pages/login";
import { DashboardPage } from "@/pages/dashboard";
import { ServiceDetailPage } from "@/pages/service-detail";
import { WalletPage } from "@/pages/wallet";
import { SettingsPage } from "@/pages/settings";
import { useAuth } from "@/hooks/use-auth";

function AuthLayout() {
  const { authenticated } = useAuth();

  if (!authenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: Outlet,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const authenticatedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  component: AuthLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: "/",
  component: DashboardPage,
});

const serviceRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: "/service/$id",
  component: ServiceDetailPage,
});

const walletRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: "/wallet",
  component: WalletPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => authenticatedLayout,
  path: "/service/$id/settings",
  component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedLayout.addChildren([dashboardRoute, serviceRoute, settingsRoute, walletRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
