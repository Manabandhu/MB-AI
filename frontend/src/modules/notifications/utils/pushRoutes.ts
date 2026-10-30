/** Opens the related screen when the member taps a push (route from the payload, else the notification itself). */
export function routeForPushData(data: Record<string, unknown> | undefined): string | null {
  const route =
    typeof data?.route === 'string' && data.route.startsWith('/') && !data.route.startsWith('//')
      ? data.route
      : null;
  if (route) return route;
  const id = typeof data?.notificationId === 'string' ? data.notificationId : null;
  return id ? `/notifications/${id}` : null;
}
