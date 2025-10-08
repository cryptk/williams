import { Link } from "preact-router/match";
import { useState } from "preact/hooks";

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
    <header class="bg-card-bg shadow sticky top-0 z-50 h-16">
      <div class="max-w-7xl mx-auto px-8 flex justify-between items-center h-full">
        <h1 class="text-2xl font-bold text-primary">
          Williams{" "}
          <span class="text-sm text-muted">{typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev"}</span>
        </h1>

        {/* Center navigation */}
        <nav class="transform flex gap-8 items-center h-auto">
          <Link
            activeClassName="text-primary"
            class="no-underline font-medium transition-colors hover:text-primary"
            href="/"
          >
            Dashboard
          </Link>
          <Link
            activeClassName="text-primary"
            class="no-underline font-medium transition-colors hover:text-primary"
            href="/bills"
          >
            Bills
          </Link>
          <Link
            activeClassName="text-primary"
            class="no-underline font-medium transition-colors hover:text-primary"
            href="/categories"
          >
            Categories
          </Link>
        </nav>

        {/* Right side user menu */}
        <div
          class="relative h-full items-center flex"
          onMouseEnter={() => revealDropdown()}
          onMouseLeave={() => hideDropdown()}
        >
          <button class="font-medium text-gray hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
            {user.username}
          </button>

          <div
            id="usermenu_dropdown"
            class="transition-all duration-1000 hidden opacity-0 translate-y-18 absolute right-0 mt-2 bg-card-bg shadow-lg rounded-md border border-secondary z-50"
          >
            <Link
              href="/settings"
              class="block px-8 py-2 text-sm text-gray hover:bg-primary hover:text-white no-underline transition-colors duration-200"
            >
              Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                class="block px-8 py-2 text-sm text-gray hover:bg-primary hover:text-white no-underline transition-colors duration-200"
              >
                Admin
              </Link>
            )}
            <div class="border-t mx-2 border-secondary"></div>
            <button
              onClick={onLogout}
              class="w-full text-left block px-8 py-2 text-sm text-gray hover:bg-primary hover:text-white transition-colors duration-200 bg-transparent border-none cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
