import { ProfileTab } from "./profile-tab"

export function AdminAboutForm() {
    return (
        <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">About</h1>
                <p className="text-sm text-muted-foreground">Manage the landing headline, your bio, availability and profile images.</p>
            </div>
            <ProfileTab />
        </div>
    )
}
