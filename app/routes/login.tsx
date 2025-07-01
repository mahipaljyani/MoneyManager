
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { initializeLucia } from "~/lib/auth";


export async function action({ context, request }: ActionFunctionArgs) {
    const auth = initializeLucia(context.cloudflare.env.DB);
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");

    if (typeof username !== "string" || username.length < 3) {
        return json({ error: "Invalid username or password" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
        return json({ error: "Invalid username or password" }, { status: 400 });
    }

    try {
        const key = await auth.useKey("username", username.toLowerCase(), password);
        const session = await auth.createSession({
            userId: key.userId,
            attributes: {}
        });
        const sessionCookie = auth.createSessionCookie(session);
        return redirect("/", {
            headers: {
                "Set-Cookie": sessionCookie.serialize()
            }
        });
    } catch (e) {
        // invalid username/password
        return json({ error: "Invalid username or password" }, { status: 400 });
    }
}

export default function Login() {
    const actionData = useActionData<typeof action>();

    return (
        <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
            <h1>Sign in</h1>
            <Form method="post">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" />
                <br />
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" />
                <br />
                <button type="submit">Continue</button>
            </Form>
            {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}
        </div>
    );
}
