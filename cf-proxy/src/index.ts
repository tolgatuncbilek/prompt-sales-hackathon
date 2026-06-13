export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    url.hostname = "hmd-secure-crm.wittypond-f1da5c80.swedencentral.azurecontainerapps.io";
    
    // Clone headers and set host header correctly
    const headers = new Headers(request.headers);
    headers.set("host", url.hostname);

    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "manual"
    });

    try {
      const response = await fetch(newRequest);
      return response;
    } catch (e: any) {
      return new Response(`Proxy error: ${e.message}`, { status: 502 });
    }
  }
};
