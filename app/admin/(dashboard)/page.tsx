import { AdminAboutForm } from "@/components/admin/forms/about";
import { AdminProjectsForm } from "@/components/admin/forms/projects-form";
import { AdminSkillsForm } from "@/components/admin/forms/skills-form";
import { AdminExperiencesForm } from "@/components/admin/forms/experiences-form";
import { ChatManager } from "@/components/admin/chat-manager";

import { DashboardOverview } from "@/components/admin/dashboard-overview";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { SettingsView } from "@/components/admin/settings-view";

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string }>;
}) {
    const params = await searchParams;
    const view = params.view || "dashboard";

    return (
        <div className="flex flex-1 flex-col gap-4">
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
