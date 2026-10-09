import { handleApiRequest } from "../server/index.mjs";

export default function handleAuthRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const route = url.searchParams.get("route");
  if (route) {
    url.searchParams.delete("route");
    url.pathname = `/api/auth/${route.replace(/^\/+/, "")}`;
    request.url = `${url.pathname}${url.search}`;
  }
  return handleApiRequest(request, response);
}
