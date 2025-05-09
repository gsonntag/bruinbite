const API_BASE = "http://localhost:8080";

export async function signup(username, email, password) {
    const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
        credentials: "include", // if you ever use cookies
      });
    
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Signup failed");
      }
      return res.json();
}

export async function login(username, password) {
    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
    }
    const { token, user } = await res.json();
    // TODO: possibly save user somewhere?
    localStorage.setItem("jwt", token);
    return user;
}