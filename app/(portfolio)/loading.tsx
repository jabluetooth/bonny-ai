import { Skeleton } from "@/components/ui/skeleton";

// Shown only while a page's data is fetched for the first time (pages are
// static and revalidated, so this is rare). A quiet skeleton in the content
// column keeps the layout steady instead of covering the screen.
export default function Loading() {
    return (
        <div role="status" aria-label="Loading" className="w-full max-w-4xl mx-auto px-4 md:px-8 py-28 md:py-32 flex flex-col gap-6">
            <Skeleton className="h-10 w-2/3 max-w-md" />
            <Skeleton className="h-4 w-full max-w-2xl" />
            <Skeleton className="h-4 w-5/6 max-w-xl" />
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <Skeleton className="h-36 rounded-xl" />
                <Skeleton className="h-36 rounded-xl" />
            </div>
        </div>
    );
}
