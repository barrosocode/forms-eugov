import { authorizedUpstream, clearSession } from "@/server/upstream";

export async function POST() {
  const envelope = await authorizedUpstream("/auth/logout", { method: "POST" });
  await clearSession();
  if (envelope.status >= 200 && envelope.status < 300) {
    return Response.json(envelope, { status: envelope.status });
  }
  return Response.json(
    {
      status: 200,
      message: "Sessão encerrada.",
      errors: {},
      auth: { logged_out: true },
      error_code: null,
    },
    { status: 200 },
  );
}
