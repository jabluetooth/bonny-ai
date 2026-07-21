import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // Force Session Cookie: Remove 'maxAge' and 'expires' so cookie dies on browser close
                        const sessionOptions = { ...options };
                        delete sessionOptions.maxAge;
                        delete sessionOptions.expires;

                        response.cookies.set(name, value, sessionOptions)
                    });
                },
            },
        }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const { data: { user } } = await supabase.auth.getUser();

    // 🔒 SECURITY: Protect Admin Routes
    if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
        if (!user) {
            // No session? Kick to login
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // Optional: Check email match here too for Edge security
        // Note: Middleware Env vars might behave differently on some platforms, 
        // but this works in standard Next.js deployments.
        const allowedEmail = process.env.MY_EMAIL;
        if (!allowedEmail || user.email !== allowedEmail) {
            return NextResponse.redirect(new URL('/admin/login?error=unauthorized', request.url));
        }
    }

    // 🚀 CACHING: Prevent caching for authenticated/dynamic routes
    if (request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/admin')) {
        response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*', '/api/:path*'],
};
