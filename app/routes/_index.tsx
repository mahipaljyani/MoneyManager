import { redirect, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { initializeLucia } from "~/lib/auth";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const auth = initializeLucia(context.cloudflare.env.DB);
  const authRequest = auth.handleRequest(request);
  const session = await authRequest.validate();

  if (session) {
    return redirect("/dashboard");
  } else {
    return redirect("/login");
  }
}