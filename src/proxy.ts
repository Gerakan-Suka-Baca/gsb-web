import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/about(.*)",
  "/programs(.*)",
  "/volunteer(.*)",
  "/learning-path(.*)",
  "/universitas(.*)",
  "/program-studi(.*)",
  "/legal(.*)",
  "/blog(.*)",
  "/admin(.*)",
  "/mentor-dashboard(.*)",
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const callbackUrl = `${pathname}${search}`;
    const unauthenticatedUrl = new URL(
      `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      request.url
    ).toString();
    await auth.protect({
      unauthenticatedUrl,
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
