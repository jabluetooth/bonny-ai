import { AdminAboutForm } from "@/components/admin/forms/about";
import { AdminProjectsForm } from "@/components/admin/forms/projects-form";
import { AdminSkillsForm } from "@/components/admin/forms/skills-form";
import { AdminExperiencesForm } from "@/components/admin/forms/experiences-form";
import { ChatManager } from "@/components/admin/chat-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { DashboardOverview } from "@/components/admin/dashboard-overview";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { SettingsView } from "@/components/admin/settings-view";

export default function AdminDashboardPage({
    searchParams,
}: {
    searchParams: { view?: string };
}) {
    const view = searchParams.view || "dashboard";

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-6">
            {view === "dashboard" && <DashboardOverview />}
            {view === "about" && <AdminAboutForm />}
            {view === "projects" && <AdminProjectsForm />}
            {view === "skills" && <AdminSkillsForm />}
            {view === "experiences" && <AdminExperiencesForm />}
            {view === "chats" && <ChatManager />}
            {view === "analytics" && <AnalyticsView />}
            {view === "settings" && <SettingsView />}
        </div>
    );
}

function PlaceholderView({ title }: { title: string }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
            <h3 className="text-lg font-bold">{title} Manager</h3>
            <p className="text-sm text-muted-foreground">This section is coming soon.</p>
        </div>
    )
}
