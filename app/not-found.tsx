import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex h-[100dvh] flex-col items-center justify-center gap-4 p-8 text-center">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-muted-foreground max-w-sm">
                This page doesn&apos;t exist.
            </p>
            <Link
                href="/"
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
                Go home
            </Link>
        </div>
    );
}
