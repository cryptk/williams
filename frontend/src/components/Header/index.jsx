import { Link } from "preact-router/match";

export function Header({ user, onLogout }) {
  const isAdmin = user.roles && user.roles.includes("admin");
  // variable to store timeout ID for hiding the dropdown
  let hideTimeout;
  let dropdownHideAbortController;

  const revealDropdown = () => {
    // Clear any existing timeout to prevent premature hiding
    // If there's an ongoing hide operation, abort it
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    dropdownHideAbortController?.abort();

    // Re-add the dropdown to the DOM if it was removed
    let element = document.getElementById("usermenu_dropdown");
    element.classList.remove("hidden");

    // Use requestAnimationFrame to ensure the hidden class is removed before changing opacity
    // otherwise, the transition won't trigger and the fade-in effect won't work
    requestAnimationFrame(() => {
      element.classList.add("opacity-100");
      element.classList.remove("opacity-0");
    });
  };

  const hideDropdown = () => {
    // Delay hiding the menu by 0.5 seconds to allow for smoother UX
    hideTimeout = setTimeout(() => {
      // If there's an ongoing hide operation, abort it
      dropdownHideAbortController?.abort();

      // Fade out the dropdown
      let element = document.getElementById("usermenu_dropdown");
      element.classList.remove("opacity-100");
      element.classList.add("opacity-0");

      // After the fade-out transition ends, add the hidden class to remove it from the DOM flow
      dropdownHideAbortController = new AbortController();
      element.addEventListener(
        "transitionend",
        () => {
          console.log("hide transition ended");
          element.classList.add("hidden");
          console.log("hidden class added");
        },
        { once: true, signal: dropdownHideAbortController.signal }
      );
    }, 500);
  };

  return (
    <header class="sticky top-0 z-50 h-16 bg-card-bg shadow">
      <div class="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
        <h1 class="text-2xl font-bold text-primary">
          Williams{" "}
          <span class="text-sm text-muted">{typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev"}</span>
        </h1>

        {/* Center navigation */}
        <nav class="flex h-auto transform items-center gap-8">
          <Link
            activeClassName="text-primary"
            class="font-medium no-underline transition-colors hover:text-primary"
            href="/"
          >
            Dashboard
          </Link>
          <Link
            activeClassName="text-primary"
            class="font-medium no-underline transition-colors hover:text-primary"
            href="/bills"
          >
            Bills
          </Link>
          <Link
            activeClassName="text-primary"
            class="font-medium no-underline transition-colors hover:text-primary"
            href="/categories"
          >
            Categories
          </Link>
        </nav>

        {/* Right side user menu */}
        <div
          class="relative flex h-full items-center"
          onMouseEnter={() => revealDropdown()}
          onMouseLeave={() => hideDropdown()}
        >
          <button class="cursor-pointer border-none bg-transparent font-medium text-gray transition-colors hover:text-primary">
            {user.username}
          </button>

          <div
            id="usermenu_dropdown"
            class="absolute right-0 z-50 mt-2 hidden translate-y-18 rounded-md border border-secondary bg-card-bg opacity-0 shadow-lg transition-all duration-1000"
          >
            <Link
              href="/settings"
              class="block px-8 py-2 text-sm text-gray no-underline transition-colors duration-200 hover:bg-primary hover:text-white"
            >
              Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                class="block px-8 py-2 text-sm text-gray no-underline transition-colors duration-200 hover:bg-primary hover:text-white"
              >
                Admin
              </Link>
            )}
            <div class="mx-2 border-t border-secondary" />
            <button
              onClick={onLogout}
              class="block w-full cursor-pointer border-none bg-transparent px-8 py-2 text-left text-sm text-gray transition-colors duration-200 hover:bg-primary hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
