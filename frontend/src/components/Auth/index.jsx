import { useState } from "preact/hooks";
import { login, register } from "../../services/auth";
import { Button } from "../../uielements";

export function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await login(username, password);
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        onLoginSuccess(response.user);
      } else {
        const response = await register(username, email, password);
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        onLoginSuccess(response.user);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary to-secondary p-8">
      <div class="w-full max-w-md cardstatic p-12 shadow-lg">
        <h1 class="mb-2 text-center text-4xl text-primary">💵 Williams</h1>
        <p class="text-text-secondary mb-8 text-center">
          Get to know your bills
        </p>

        <div class="mb-8 flex gap-2 border-b-2 border-secondary">
          <button
            class={`flex-1 cursor-pointer bg-transparent py-3 text-base font-medium transition-all ${
              isLogin
                ? "-mb-0.5 border-b-3 border-b-primary text-primary"
                : "-mb-0.5 border-b-3 border-b-transparent text-gray"
            }`}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
          >
            Login
          </button>
          <button
            class={`flex-1 cursor-pointer bg-transparent py-3 text-base font-medium transition-all ${
              !isLogin
                ? "-mb-0.5 border-b-3 border-b-primary text-primary"
                : "-mb-0.5 border-b-3 border-b-transparent text-gray"
            }`}
            onClick={() => {
              setIsLogin(false);
              setError("");
            }}
          >
            Register
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          class="flex flex-col overflow-hidden transition-all duration-300"
        >
          {error && <div class="error-message">{error}</div>}

          <div class="form-group">
            <label class="form-label" htmlFor="username">
              Username
            </label>
            <input
              class="form-input"
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              autoComplete="username"
            />
          </div>

          <div
            class={`form-group transition-all duration-300 ease-in-out ${
              !isLogin
                ? "max-h-32 opacity-100"
                : "mb-0 max-h-0 overflow-hidden p-0 opacity-0"
            }`}
          >
            <label class="form-label" htmlFor="email">
              Email
            </label>
            <input
              class="form-input"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={!isLogin}
              autoComplete="email"
              tabIndex={isLogin ? -1 : 0}
            />
          </div>

          <div class="form-group">
            <label class="form-label" htmlFor="password">
              Password
            </label>
            <input
              class="form-input"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            extraClasses="w-full mt-2"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
          </Button>
        </form>
      </div>
    </div>
  );
}
