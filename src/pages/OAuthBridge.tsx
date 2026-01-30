import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Bridge route for custom domains.
 * `@lovable.dev/cloud-auth-js` defaults to redirecting to `/~oauth/*` on the current origin.
 * On SPA hosting, this path is handled by React Router and can fall into the 404 route.
 *
 * We forward the user to the hosted OAuth broker instead.
 */
export default function OAuthBridge() {
  const location = useLocation();

  useEffect(() => {
    // Keep pathname/query intact and forward to the broker host.
    const target = `https://oauth.lovable.app${location.pathname}${location.search}`;
    window.location.replace(target);
  }, [location.pathname, location.search]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Redirection sécurisée…</p>
    </main>
  );
}
