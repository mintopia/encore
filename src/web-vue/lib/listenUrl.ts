export function listenUrl(origin: string): string {
  return `${origin}/listen`;
}

export function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "[::1]" || /^127\./.test(hostname);
}
