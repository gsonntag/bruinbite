package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
	"github.com/gsonntag/bruinbite/search"
)

func GetFriendsHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		// userId is a string, but we need to convert it to an int
		userIdInt, err := strconv.Atoi(userId)
		fmt.Println("userId: ", userId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		friends, err := mgr.GetFriendsByUserID(uint(userIdInt))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"friends": friends,
		})
	}
}

// GetOutgoingFriendRequestsHandler retrieves all friend requests for the current user
func GetOutgoingFriendRequestsHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		// userId is a string, but we need to convert it to an int
		userIdInt, err := strconv.Atoi(userId)
		fmt.Println("userId: ", userId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		requests, err := mgr.GetOutgoingFriendRequestsByUserID(uint(userIdInt))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"requests": requests,
		})
	}
}

// GetIncomingFriendRequestsHandler retrieves all incoming friend requests for the current user
func GetIncomingFriendRequestsHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId := c.GetString("userId")
		// userId is a string, but we need to convert it to an int
		userIdInt, err := strconv.Atoi(userId)
		fmt.Println("userId: ", userId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		requests, err := mgr.GetIncomingFriendRequestsByUserID(uint(userIdInt))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"requests": requests,
		})
	}
}

// sendFriendRequestHandler handles sending a friend request
func SendFriendRequestHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request struct {
			FriendID uint `json:"friend_id" binding:"required"`
		}
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		userId := c.GetString("userId")
		userIdInt, err := strconv.Atoi(userId)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}

		err = mgr.SendFriendRequest(uint(userIdInt), request.FriendID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to send friend request"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Friend request sent successfully"})
	}
}

// AcceptFriendRequestHandler handles accepting a friend request
func AcceptFriendRequestHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request struct {
			RequestID uint `json:"request_id" binding:"required"`
		}
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := mgr.AcceptFriendRequest(request.RequestID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to accept friend request"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Friend request accepted successfully"})
	}
}

// DeclineFriendRequestHandler handles declining a friend request
func DeclineFriendRequestHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		var request struct {
			RequestID uint `json:"request_id" binding:"required"`
		}
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		err := mgr.DeleteFriendRequest(request.RequestID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to decline friend request"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Friend request declined successfully"})
	}
}

// SearchUsersHandler handles searching for users by username
func SearchUsersHandler(mgr *db.DBManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.Query("username")
		if username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username query parameter is required"})
			return
		}
		users, err := mgr.GetUsersByUsername(username)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, users)
	}
}

// BleveSearchUsersHandler handles searching for users using Bleve search with fuzzy matching
func BleveSearchUsersHandler(mgr *db.DBManager, userSearchManager *search.BleveUserSearchManager) gin.HandlerFunc {
	return func(c *gin.Context) {
		username := c.Query("username")
		if username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username query parameter is required"})
			return
		}

		// Get current user ID to exclude from search results
		userIdStr := c.GetString("userId")
		userIdInt, err := strconv.Atoi(userIdStr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
			return
		}

		// Search using Bleve with fuzzy matching
		userDocs, err := userSearchManager.SearchUsers(username, uint(userIdInt), 20) // Limit to 20 results
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "search error"})
			return
		}

		// Convert UserDocuments back to User models for consistency with frontend
		var users []map[string]interface{}
		for _, doc := range userDocs {
			// Parse user ID back to uint
			userID, err := strconv.ParseUint(doc.ID, 10, 32)
			if err != nil {
				continue // Skip invalid IDs
			}

			user := map[string]interface{}{
				"ID":        uint(userID),
				"username":  doc.Username,
				"email":     doc.Email,
				"CreatedAt": doc.CreatedAt,
				"UpdatedAt": doc.CreatedAt, // Use CreatedAt as UpdatedAt for simplicity
				"DeletedAt": nil,
				"is_admin":  false,
			}
			users = append(users, user)
		}

		c.JSON(http.StatusOK, users)
	}
}
