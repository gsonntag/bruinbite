package handlers

type LoginRequest struct {
	Username string `json:"username"` // could be email or username
	Password string `json:"password"`
}
