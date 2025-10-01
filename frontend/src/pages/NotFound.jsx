import { Link } from 'preact-router/match';

export function NotFound() {
  return (
    <div class="not-found">
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/" class="btn btn-primary">Go Home</Link>
    </div>
  );
}
