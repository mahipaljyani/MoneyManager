
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

  // Fetch existing loans
  const { results: loans } = await context.cloudflare.env.DB.prepare("SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC").bind(session.userId).all();

  return json({ userId: session.userId, loans });
}

export async function action({ context, request }: ActionFunctionArgs) {
  const auth = initializeLucia(context.cloudflare.env.DB);
  const authRequest = auth.handleRequest(request);
  const session = await authRequest.validate();

  if (!session) {
    return redirect("/login");
  }

  const formData = await request.formData();
  const intent = formData.get("_intent");

  if (intent === "addLoan") {
    const amount = formData.get("amount");
    const description = formData.get("description");
    const dueDate = formData.get("dueDate");

    // Basic validation
    if (typeof amount !== "string" || isNaN(Number(amount)) || Number(amount) <= 0) {
      return json({ error: "Invalid amount" }, { status: 400 });
    }
    if (typeof description !== "string" || description.length < 1) {
      return json({ error: "Description cannot be empty" }, { status: 400 });
    }
    if (typeof dueDate !== "string" || !/\d{4}-\d{2}-\d{2}/.test(dueDate)) {
      return json({ error: "Invalid due date format (YYYY-MM-DD)" }, { status: 400 });
    }

    try {
      await context.cloudflare.env.DB.prepare(
        "INSERT INTO loans (user_id, amount, description, due_date, is_repaid) VALUES (?, ?, ?, ?, 0)"
      ).bind(session.userId, Number(amount), description, dueDate).run();

      return redirect("/loans");
    } catch (e) {
      console.error("Error adding loan:", e);
      return json({ error: "Failed to add loan" }, { status: 500 });
    }
  } else if (intent === "markRepaid") {
    const loanId = formData.get("loanId");

    if (typeof loanId !== "string" || isNaN(Number(loanId))) {
      return json({ error: "Invalid loan ID" }, { status: 400 });
    }

    try {
      await context.cloudflare.env.DB.prepare(
        "UPDATE loans SET is_repaid = 1 WHERE id = ? AND user_id = ?"
      ).bind(Number(loanId), session.userId).run();

      return redirect("/loans");
    } catch (e) {
      console.error("Error marking loan as repaid:", e);
      return json({ error: "Failed to mark loan as repaid" }, { status: 500 });
    }
  }

  return json({ error: "Invalid action intent" }, { status: 400 });
}

export default function Loans() {
  const { userId, loans } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      <h1>Loans</h1>
      <p>User ID: {userId}</p>

      <h2>Log New Loan</h2>
      <Form method="post">
        <input type="hidden" name="_intent" value="addLoan" />
        <label htmlFor="amount">Amount:</label>
        <input type="number" id="amount" name="amount" step="0.01" required />
        <br />

        <label htmlFor="description">Description:</label>
        <input type="text" id="description" name="description" required />
        <br />

        <label htmlFor="dueDate">Due Date (YYYY-MM-DD):</label>
        <input type="date" id="dueDate" name="dueDate" required />
        <br />

        <button type="submit">Add Loan</button>
      </Form>

      {actionData?.error && <p style={{ color: "red" }}>{actionData.error}</p>}

      <h2>Outstanding Loans</h2>
      {loans.length === 0 ? (
        <p>No loans logged yet.</p>
      ) : (
        <ul>
          {loans.map((loan: any) => (
            <li key={loan.id} style={{ textDecoration: loan.is_repaid ? "line-through" : "none" }}>
              ${loan.amount} - {loan.description} (Due: {loan.due_date}) - {loan.is_repaid ? "Repaid" : "Outstanding"}
              {!loan.is_repaid && (
                <Form method="post" style={{ display: "inline-block", marginLeft: "10px" }}>
                  <input type="hidden" name="_intent" value="markRepaid" />
                  <input type="hidden" name="loanId" value={loan.id} />
                  <button type="submit">Mark as Repaid</button>
                </Form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
