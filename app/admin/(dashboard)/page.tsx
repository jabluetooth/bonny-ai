export default function AdminDashboard() {
    return (
        <div className="flex flex-col gap-8 p-4">
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Status</h3>
                    </div>
                    <div className="text-2xl font-bold text-green-500">Secure</div>
                    <p className="text-xs text-muted-foreground">You have full access.</p>
                </div>
            </div>

            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                <h2 className="font-bold text-xl mb-4">Welcome back, Admin!</h2>
                <p>This area is protected. Only you can see this.</p>
            </div>
        </div>
    )
}
