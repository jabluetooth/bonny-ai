import { AdminAboutForm } from "@/components/admin/forms/about";
import { AdminProjectsForm } from "@/components/admin/forms/projects-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage({
    searchParams,
}: {
    searchParams: { view?: string };
}) {
    const view = searchParams.view || "dashboard";

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {view === "dashboard" && <DashboardOverview />}
            {view === "about" && <AdminAboutForm />}
            {view === "projects" && <AdminProjectsForm />}
            {view === "skills" && <PlaceholderView title="Skills" />}
            {view === "experiences" && <PlaceholderView title="Experiences" />}
            {view === "chats" && <PlaceholderView title="Chats" />}
            {view === "analytics" && <PlaceholderView title="Analytics" />}
            {view === "settings" && <PlaceholderView title="Settings" />}
        </div>
    );
}

function DashboardOverview() {
    return (
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12,345</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">+573</div>
                    <p className="text-xs text-muted-foreground">+201 since last hour</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">Normal</div>
                    <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
            </Card>
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min md:col-span-3 p-6 flex items-center justify-center text-muted-foreground">
                <p>Welcome to the dashboard. Select an item from the sidebar to manage content.</p>
            </div>
        </div>
    )
}

function PlaceholderView({ title }: { title: string }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
            <h3 className="text-lg font-bold">{title} Manager</h3>
            <p className="text-sm text-muted-foreground">This section is coming soon.</p>
        </div>
    )
}
