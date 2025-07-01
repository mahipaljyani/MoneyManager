
import { lucia } from "lucia";
import { d1 } from "@lucia-auth/adapter-sqlite";
import { web } from "lucia/middleware";

import type { D1Database } from "@cloudflare/workers-types";

export const initializeLucia = (db: D1Database) => {
    const auth = lucia({
        adapter: d1(db, {
            user: "users",
            key: "user_key",
            session: "sessions"
        }),
        middleware: web(),
        env: "DEV", // "PROD" in production
        sessionCookie: {
            expires: false
        },

        getUserAttributes: (databaseUser) => {
            return {
                username: databaseUser.username
            };
        }
    });
    return auth;
};

export type Auth = ReturnType<typeof initializeLucia>;
