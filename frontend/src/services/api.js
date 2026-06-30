import axios from "axios";


const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    import.meta.env.REACT_APP_API_URL ||
    'http://localhost:5000/api',
  timeout: 10000,
});

// ── Request Interceptor ─────────────────────────────────
// Attach token to every request — works with both storage formats:
//   Format A (loginApi.js): sessionStorage["gs_user"] = { token, user }
//   Format B (App.jsx):     sessionStorage["token"] + sessionStorage["user"]
api.interceptors.request.use(
  (config) => {
    let token = null;

    // Format A — gs_user object
    const gsUser = sessionStorage.getItem("gs_user");
    if (gsUser) {
      try {
        const parsed = JSON.parse(gsUser);
        token = parsed.token || null;
      } catch (_) {}
    }

    // Format B — standalone token key (App.jsx sets this)
    if (!token) {
      token =
        sessionStorage.getItem("token") ||
        localStorage.getItem("token") ||
        null;
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401 && !error.config.url.includes("/login")) {
        console.warn("⚠️ Unauthorized - clearing session");
        sessionStorage.removeItem("gs_user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("authType");
        sessionStorage.removeItem("gs_outlet_id");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("authType");
        window.location.href = "/";
      }

      if (status === 404) {
        console.warn("⚠️ Resource not found:", error.config.url);
      }

      if (status === 500) {
        console.error("❌ Server error:", error.config.url);
      }
    }
    return Promise.reject(error);
  }
);

export default api;