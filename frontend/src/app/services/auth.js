import { api } from '../utils/api'

export async function signup(username, email, password) {
  const response = await api.post('/signup', null, {
    username,
    email,
    password
  })
    
    
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Signup failed");
      }
      return response.json();
}

export async function login(username, password) {
  const response = await api.post('/login', null, {
    username, password
  })
    
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Login failed");
    }
    const { token, user } = await response.json();
    localStorage.setItem("jwt", token);
    return user;
}

export async function logout() {
  localStorage.removeItem("jwt") // stateless JWT, remove token on client's end
}