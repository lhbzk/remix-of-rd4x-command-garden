import {
  createFileRoute,
  Outlet,
} from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { requireDashboardAccess } from "@/lib/dashboard-auth.functions";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: async () => {
    await requireDashboardAccess();
  },

  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="bg-app min-w-0">
        <Topbar />

        <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
