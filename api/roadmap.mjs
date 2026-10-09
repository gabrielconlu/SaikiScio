import { handleApiRequest } from "../server/index.mjs";

export default function handleRoadmapRequest(request, response) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const route = url.searchParams.get("route");
  if (route) {
    url.searchParams.delete("route");
    url.pathname = `/api/roadmap/${route.replace(/^\/+/, "")}`;
    request.url = `${url.pathname}${url.search}`;
  }
  return handleApiRequest(request, response);
}
