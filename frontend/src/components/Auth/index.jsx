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
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-8">
      <div class="cardstatic p-12 w-full max-w-md shadow-lg">
        <h1 class="text-4xl text-center mb-2 text-primary">💵 Williams</h1>
        <p class="text-center text-text-secondary mb-8">
          Get to know your bills
        </p>

        <div class="flex gap-2 mb-8 border-b-2 border-secondary">
          <button
            class={`flex-1 py-3 bg-transparent text-base font-medium cursor-pointer transition-all ${
              isLogin
                ? "text-primary border-b-3 border-b-primary -mb-0.5"
                : "text-gray border-b-3 border-b-transparent -mb-0.5"
            }`}
            onClick={() => {
              setIsLogin(true);
              setError("");
            }}
          >
            Login
          </button>
          <button
            class={`flex-1 py-3 bg-transparent text-base font-medium cursor-pointer transition-all ${
              !isLogin
                ? "text-primary border-b-3 border-b-primary -mb-0.5"
                : "text-gray border-b-3 border-b-transparent -mb-0.5"
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
          class="flex flex-col transition-all duration-300 overflow-hidden"
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
                : "max-h-0 opacity-0 mb-0 p-0 overflow-hidden"
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
