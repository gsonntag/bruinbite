package handlers

import (
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/search"
)

// UpdateProfileRequest represents the request body for updating profile
type UpdateProfileRequest struct {
	Username       string  `json:"username" binding:"required"`
	Email          string  `json:"email" binding:"required"`
	ProfilePicture *string `json:"profile_picture,omitempty"` // base64 encoded image
}

// isValidEmail validates email format using regex
func isValidEmail(email string) bool {
	// Basic email validation regex
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	re := regexp.MustCompile(emailRegex)
	return re.MatchString(email)
}

// UpdateProfileHandler handles profile updates via JSON
func UpdateProfileHandler(mgr *db.DBManager, userSearchManager *search.BleveUserSearchManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by auth middleware)
		userIdStr := c.GetString("userId")
		userID, err := strconv.ParseUint(userIdStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
			return
		}

		// Parse request body
		var req UpdateProfileRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate email format
		if !isValidEmail(req.Email) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email format"})
			return
		}

		// Get current user to check authorization
		currentUser, err := mgr.GetUserByID(uint(userID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user info"})
			return
		}

		// Handle base64 profile picture if provided
		var profilePicturePath *string
		if req.ProfilePicture != nil && *req.ProfilePicture != "" {
			base64Data := *req.ProfilePicture
			if strings.Contains(base64Data, ",") {
				parts := strings.Split(base64Data, ",")
				if len(parts) > 1 {
					base64Data = parts[1]
				}
			}

			if len(base64Data) == 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "empty image data"})
				return
			}

			// Decode base64 image
			data, err := base64.StdEncoding.DecodeString(base64Data)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base64 image data: " + err.Error()})
				return
			}

			if len(data) < 100 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "image file appears to be corrupted or too small"})
				return
			}

			// Detect image type and validate
			contentType := http.DetectContentType(data)
			if !strings.HasPrefix(contentType, "image/") {
				c.JSON(http.StatusBadRequest, gin.H{"error": "uploaded file is not a valid image format"})
				return
			}

			// Determine file extension
			var ext string
			switch contentType {
			case "image/jpeg":
				ext = ".jpg"
			case "image/png":
				ext = ".png"
			case "image/gif":
				ext = ".gif"
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported image format"})
				return
			}

			// Create uploads directory if it doesn't exist
			uploadsDir := "./uploads/profile_pictures"
			if err := os.MkdirAll(uploadsDir, 0755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create uploads directory"})
				return
			}

			// Generate unique filename
			filename := fmt.Sprintf("profile_%d_%d%s", userID, time.Now().Unix(), ext)
			filePath := filepath.Join(uploadsDir, filename)

			// Save image file
			if err := os.WriteFile(filePath, data, 0644); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save image"})
				return
			}

			// Store relative path for database
			relativePath := fmt.Sprintf("/uploads/profile_pictures/%s", filename)
			profilePicturePath = &relativePath
		} else {
			// Keep existing profile picture
			profilePicturePath = currentUser.ProfilePicture
		}

		// Update user profile in database
		if err := mgr.UpdateUserProfile(uint(userID), req.Username, req.Email, profilePicturePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
			return
		}

		// Return updated user info
		user, err := mgr.GetUserByID(uint(userID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get updated user info"})
			return
		}

		// Update the user search index with the new profile information
		if userSearchManager != nil {
			userDoc := search.UserToDocument(*user)
			if err := userSearchManager.UpdateUser(userDoc); err != nil {
				// Log the error but don't fail the request since the profile update succeeded
				fmt.Printf("Warning: failed to update user search index: %v\n", err)
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Profile updated successfully",
			"user":    user,
		})
	}
}

// UploadProfilePictureHandler handles multipart file uploads for profile pictures
func UploadProfilePictureHandler(mgr *db.DBManager, userSearchManager *search.BleveUserSearchManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context
		userIdStr := c.GetString("userId")
		userID, err := strconv.ParseUint(userIdStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
			return
		}

		// Parse multipart form
		file, header, err := c.Request.FormFile("profile_picture")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "no file provided"})
			return
		}
		defer file.Close()

		// Validate file size (5MB limit)
		if header.Size > 5*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file too large (max 5MB)"})
			return
		}

		// Validate file type
		contentType := header.Header.Get("Content-Type")
		if !strings.HasPrefix(contentType, "image/") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file must be an image"})
			return
		}

		// Get file extension
		ext := filepath.Ext(header.Filename)
		if ext == "" {
			// Try to determine from content type
			switch contentType {
			case "image/jpeg":
				ext = ".jpg"
			case "image/png":
				ext = ".png"
			case "image/gif":
				ext = ".gif"
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported image format"})
				return
			}
		}

		// Create uploads directory if it doesn't exist
		uploadsDir := "./uploads/profile_pictures"
		if err := os.MkdirAll(uploadsDir, 0755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create uploads directory"})
			return
		}

		// Generate unique filename
		filename := fmt.Sprintf("profile_%d_%d%s", userID, time.Now().Unix(), ext)
		filePath := filepath.Join(uploadsDir, filename)

		// Create destination file
		dst, err := os.Create(filePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create file"})
			return
		}
		defer dst.Close()

		// Copy uploaded file to destination
		if _, err := io.Copy(dst, file); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save file"})
			return
		}

		// Store relative path for database
		relativePath := fmt.Sprintf("/uploads/profile_pictures/%s", filename)

		// Get current user info to preserve username and email
		currentUser, err := mgr.GetUserByID(uint(userID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user info"})
			return
		}

		// Update user profile picture in database
		if err := mgr.UpdateUserProfile(uint(userID), currentUser.Username, currentUser.Email, &relativePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile picture"})
			return
		}

		// Get updated user info
		updatedUser, err := mgr.GetUserByID(uint(userID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get updated user info"})
			return
		}

		// Update the user search index with the new profile information
		if userSearchManager != nil {
			userDoc := search.UserToDocument(*updatedUser)
			if err := userSearchManager.UpdateUser(userDoc); err != nil {
				// Log the error but don't fail the request since the profile update succeeded
				fmt.Printf("Warning: failed to update user search index: %v\n", err)
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"message":         "Profile picture updated successfully",
			"profile_picture": relativePath,
		})
	}
}
