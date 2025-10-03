import { Link } from "preact-router/match";

export function Header({ user, onLogout }) {
  return (
    <header class="header">
      <div class="container">
        <h1 class="logo">
          Williams{" "}
          <span style={{ fontSize: "0.7em", color: "#888" }}>
            {typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev"}
          </span>
        </h1>
        <nav class="nav">
          <Link activeClassName="active" href="/">
            Dashboard
          </Link>
          <Link activeClassName="active" href="/bills">
            Bills
          </Link>
          <Link activeClassName="active" href="/categories">
            Categories
          </Link>
          <div class="user-menu">
            <span class="username">{user.username}</span>
            <button class="btn-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
