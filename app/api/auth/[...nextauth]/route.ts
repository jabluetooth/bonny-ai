import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user }: { user: any }) {
            const allowedEmails = [process.env.ADMIN_EMAIL];
            return allowedEmails.includes(user.email || "");
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
