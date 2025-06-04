
export async function signup(username, email, password) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/signup`, {
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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
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

export async function logout() {
  localStorage.removeItem("jwt") // stateless JWT, remove token on client's end
}