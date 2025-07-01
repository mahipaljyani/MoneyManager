
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { initializeLucia } from "~/lib/auth";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const auth = initializeLucia(context.cloudflare.env.DB);
  const authRequest = auth.handleRequest(request);
  const session = await authRequest.validate();

  if (!session) {
    throw redirect("/login");
  }

  // Fetch recent transactions
  const { results: recentTransactions } = await context.cloudflare.env.DB.prepare(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5"
  ).bind(session.userId).all();

  // Fetch outstanding loans
  const { results: outstandingLoans } = await context.cloudflare.env.DB.prepare(
    "SELECT * FROM loans WHERE user_id = ? AND is_repaid = 0 ORDER BY due_date ASC"
  ).bind(session.userId).all();

  return json({ userId: session.userId, recentTransactions, outstandingLoans });
}

export default function Dashboard() {
  const { userId, recentTransactions, outstandingLoans } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Dashboard</h1>
      <p>Welcome, User ID: {userId}</p>

      <h2>Recent Transactions</h2>
      {recentTransactions.length === 0 ? (
        <p>No recent transactions.</p>
      ) : (
        <ul>
          {recentTransactions.map((tx: any) => (
            <li key={tx.id}>
              {tx.type === 'expense' ? '-' : '+'}${tx.amount} - {tx.description} ({tx.created_at})
            </li>
          ))}
        </ul>
      )}

      <h2>Outstanding Loans</h2>
      {outstandingLoans.length === 0 ? (
        <p>No outstanding loans.</p>
      ) : (
        <ul>
          {outstandingLoans.map((loan: any) => (
            <li key={loan.id}>
              ${loan.amount} - {loan.description} (Due: {loan.due_date})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
