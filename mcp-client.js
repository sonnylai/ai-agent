import fetch from "node-fetch";

export async function getCustomerByIdMCP(mcpServerUrl, id) {
  const resp = await fetch(`${mcpServerUrl}/customer/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });
  if (!resp.ok) throw new Error("MCP server error");
  return resp.json();
}
