import { cn } from "@/lib/utils";

/**
 * Building blocks shared by the standalone portfolio pages (Services, Case
 * Studies, About, Skills, Experience) so they read as one consistent site.
 */

export function PageHeader({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children?: React.ReactNode;
}) {
    return (
        <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl md:text-5xl">{title}</h1>
            {description && (
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">{description}</p>
            )}
            {children}
        </header>
    );
}

/** A row of small headline numbers under a page header. */
export function StatRow({ stats }: { stats: { value: string | number; label: string }[] }) {
    return (
        <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-3">
            {stats.map((s) => (
                <div key={s.label} className="flex flex-col">
                    <dt className="order-2 text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="order-1 text-2xl font-bold tabular-nums">{s.value}</dd>
                </div>
            ))}
        </dl>
    );
}

/** In-page jump links, e.g. to each service or category. */
export function JumpNav({ label, items }: { label: string; items: { id: string; label: string }[] }) {
    if (items.length < 2) return null;
    return (
        <nav aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {items.map((item) => (
                <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="shrink-0 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                >
                    {item.label}
                </a>
            ))}
        </nav>
    );
}

/** Quiet, readable technology chips. */
export function TagList({ tags, label, max, className }: { tags: string[]; label: string; max?: number; className?: string }) {
    if (tags.length === 0) return null;
    const shown = max ? tags.slice(0, max) : tags;
    const hidden = tags.length - shown.length;
    return (
        <ul aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
            {shown.map((t) => (
                <li key={t} className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-medium text-foreground/80">
                    {t}
                </li>
            ))}
            {hidden > 0 && (
                <li className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground">+{hidden} more</li>
            )}
        </ul>
    );
}

export function SectionHeading({ id, title, count }: { id?: string; title: string; count?: number }) {
    return (
        <h2 id={id} className="flex scroll-mt-24 items-baseline gap-3 text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
            {typeof count === "number" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">{count}</span>
            )}
        </h2>
    );
}

/** A title as a valid HTML id. */
export function slug(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
