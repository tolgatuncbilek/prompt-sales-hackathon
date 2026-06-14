export default {
  async fetch(request): Promise<Response> {
    const url = new URL(request.url);
    url.hostname = "hmd-secure-crm.wittypond-f1da5c80.swedencentral.azurecontainerapps.io";
    return Response.redirect(url.toString(), 308);
  },
};
