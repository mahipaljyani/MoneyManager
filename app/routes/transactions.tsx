
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { initializeLucia } from "~/lib/auth";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const auth = initializeLucia(context.cloudflare.env.DB);
  const authRequest = auth.handleRequest(request);
  const session = await authRequest.validate();

  if (!session) {
    throw redirect("/login");
  }

  const { results: transactions } = await context.cloudflare.env.DB.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC").bind(session.userId).all();

  return json({ userId: session.userId, transactions });
}

export async function action({ context, request }: ActionFunctionArgs) {
  const auth = initializeLucia(context.cloudflare.env.DB);
  const authRequest = auth.handleRequest(request);
  const session = await authRequest.validate();

  if (!session) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const amount = formData.get("amount");
  const description = formData.get("description");
  const type = formData.get("type"); // 'income' or 'expense'
  const categoryId = formData.get("categoryId");

  // Basic validation
  if (typeof amount !== "string" || isNaN(Number(amount)) || Number(amount) <= 0) {
    return json({ error: "Invalid amount" }, { status: 400 });
  }
  if (typeof description !== "string" || description.length < 1) {
    return json({ error: "Description cannot be empty" }, { status: 400 });
  }
  if (type !== "income" && type !== "expense") {
    return json({ error: "Invalid type" }, { status: 400 });
  }
  // categoryId validation would be more complex, checking against existing categories

  try {
    await context.cloudflare.env.DB.prepare(
      "INSERT INTO transactions (user_id, amount, description, type, category_id) VALUES (?, ?, ?, ?, ?)"
    ).bind(session.userId, Number(amount), description, type, categoryId).run();

    return redirect("/transactions");
  } catch (e) {
    console.error("Error adding transaction:", e);
    return json({ error: "Failed to add transaction" }, { status: 500 });
  }
}

export default function Transactions() {
  const { userId, transactions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Transactions</h1>
      <p>User ID: {userId}</p>

      <h2>Add New Transaction</h2>
      <Form method="post">
        <label htmlFor="amount">Amount:</label>
        <input type="number" id="amount" name="amount" step="0.01" required />
        <br />

        <label htmlFor="description">Description:</label>
        <input type="text" id="description" name="description" required />
        <br />

        <label htmlFor="type">Type:</label>
        <select id="type" name="type" required>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <br />

        {/* Category selection would be dynamic, fetched from D1 */}
        <label htmlFor="categoryId">Category (placeholder):</label>
        <input type="text" id="categoryId" name="categoryId" value="1" readOnly />
        <br />

        <button type="submit">Add Transaction</button>
      </Form>

      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}

      <h2>Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <ul>
          {transactions.map((tx: any) => (
            <li key={tx.id}>
              {tx.type === 'expense' ? '-' : '+'}${tx.amount} - {tx.description} ({tx.created_at})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
