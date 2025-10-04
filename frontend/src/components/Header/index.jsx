import { Link } from "preact-router/match";

export function Header({ user, onLogout }) {
  return (
    <header class="bg-bg-card shadow sticky top-0 z-50 py-4">
      <div class="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <h1 class="text-2xl font-bold text-primary">
          Williams{" "}
          <span class="text-sm text-text-muted">
            {typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev"}
          </span>
        </h1>
        <nav class="flex gap-8 items-center">
          <Link 
            activeClassName="!text-primary" 
            class="no-underline text-text-primary font-medium transition-colors hover:text-primary"
            href="/"
          >
            Dashboard
          </Link>
          <Link 
            activeClassName="!text-primary"
            class="no-underline text-text-primary font-medium transition-colors hover:text-primary"
            href="/bills"
          >
            Bills
          </Link>
          <Link 
            activeClassName="!text-primary"
            class="no-underline text-text-primary font-medium transition-colors hover:text-primary"
            href="/categories"
          >
            Categories
          </Link>
          <div class="flex items-center gap-4 ml-8">
            <span class="font-medium text-text-primary">{user.username}</span>
            <button 
              class="px-4 py-2 bg-transparent border-2 border-primary rounded-md text-primary font-medium transition-all hover:bg-primary hover:text-white"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
