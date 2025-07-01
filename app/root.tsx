import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/cloudflare";
import { initializeLucia } from "./lib/auth";

import "./tailwind.css";

export const links: LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
    },
];

export async function loader({ context, request }: LoaderFunctionArgs) {
    const auth = initializeLucia(context.cloudflare.env.DB);
    const authRequest = auth.handleRequest(request);
    const session = await authRequest.validate();
    if (!session && request.url.pathname !== "/login" && request.url.pathname !== "/signup") {
        return redirect("/login");
    }
    if (session && (request.url.pathname === "/login" || request.url.pathname === "/signup")) {
        return redirect("/");
    }
    return json({ session });
}

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    const { session } = useLoaderData<typeof loader>();
    return (
        <div>
            {session && (
                <nav style={{ marginBottom: "20px", padding: "10px", borderBottom: "1px solid #ccc" }}>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: "15px" }}>
                        <li><a href="/dashboard">Dashboard</a></li>
                        <li><a href="/transactions">Transactions</a></li>
                        <li><a href="/loans">Loans</a></li>
                        <li>
                            <form action="/logout" method="post" style={{ display: "inline" }}>
                                <button type="submit" style={{ background: "none", border: "none", color: "blue", cursor: "pointer", textDecoration: "underline", padding: 0, margin: 0, fontSize: "inherit" }}>Logout</button>
                            </form>
                        </li>
                    </ul>
                </nav>
            )}
            <Outlet />
        </div>
    );
}
