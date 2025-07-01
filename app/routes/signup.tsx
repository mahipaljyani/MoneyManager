
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { Form, useActionData } from "@remix-run/react";
import { initializeLucia } from "~/lib/auth";
import { Argon2id } from "oslo/password";

export async function action({ context, request }: ActionFunctionArgs) {
    const auth = initializeLucia(context.cloudflare.env.DB);
    const formData = await request.formData();
    const username = formData.get("username");
    const password = formData.get("password");

    if (typeof username !== "string" || username.length < 3) {
        return json({ error: "Username must be at least 3 characters long" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
        return json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }

    const hashedPassword = await new Argon2id().hash(password);

    try {
        const user = await auth.createUser({
            key: {
                providerId: "username",
                providerUserId: username.toLowerCase(),
                password: hashedPassword
            },
            attributes: {
                username
            }
        });
        const session = await auth.createSession({
            userId: user.userId,
            attributes: {}
        });
        const sessionCookie = auth.createSessionCookie(session);
        return redirect("/", {
            headers: {
                "Set-Cookie": sessionCookie.serialize()
            }
        });
    } catch (e) {
        // db error, email taken
        return json({ error: "Username already taken" }, { status: 400 });
    }
}

export default function Signup() {
    const actionData = useActionData<typeof action>();

    return (
        <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
            <h1>Create an account</h1>
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
