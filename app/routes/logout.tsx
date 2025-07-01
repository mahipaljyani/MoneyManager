import type { ActionFunctionArgs } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";
import { initializeLucia } from "~/lib/auth";

export async function action({ context, request }: ActionFunctionArgs) {
    const auth = initializeLucia(context.cloudflare.env.DB);
    const authRequest = auth.handleRequest(request);
    const session = await authRequest.validate();

    if (session) {
        await auth.invalidateSession(session.sessionId);
        const sessionCookie = auth.createBlankSessionCookie();
        return redirect("/login", {
            headers: {
                "Set-Cookie": sessionCookie.serialize()
            }
        });
    }

    return redirect("/login");
}