import { requestInit } from ".";

const nextPattern = /(?<=<)([\S]*)(?=>; rel="Next")/i;

export default async function* paginate(fetchCall: Promise<Response>) {
  let next: Promise<Response> | null = fetchCall;

  while (next) {
    const response: Response = await next;
    const nextUrl = response.headers.get("link")?.match(nextPattern)?.[0];
    yield response;

    if (!nextUrl) {
      return;
    }

    const url = new URL(response.url);

    url.searchParams.set(
      "after",
      new URLSearchParams(nextUrl).get("after") ?? "",
    );

    next = fetch(url, requestInit);
  }
}
