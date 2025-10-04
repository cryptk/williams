import { Link } from "preact-router/match";

export function NotFound() {
  return (
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 class="text-4xl font-bold text-text-primary mb-4">
        404 - Page Not Found
      </h2>
      <p class="text-lg text-text-secondary mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link href="/" class="btn btn-primary">
        Go Home
      </Link>
    </div>
  );
}
