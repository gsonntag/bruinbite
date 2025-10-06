package handlers

import (
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

		// Track found user IDs to avoid duplicates
		foundUserIDs := make(map[uint]bool)
		var allUsers []map[string]interface{}

		// First: Try Bleve search with fuzzy matching
		userDocs, err := userSearchManager.SearchUsers(username, uint(userIdInt), 20)
		if err != nil {
			// Bleve search failed, continue with database fallback
		} else {
			// Get fresh user data from database for each Bleve search result
			for _, doc := range userDocs {
				userID, err := strconv.ParseUint(doc.ID, 10, 32)
				if err != nil {
					continue
				}

				// Skip if we've already found this user
				if foundUserIDs[uint(userID)] {
					continue
				}

				fullUser, err := mgr.GetUserByID(uint(userID))
				if err != nil {
					continue
				}

				foundUserIDs[uint(userID)] = true
				user := map[string]interface{}{
					"ID":              fullUser.ID,
					"username":        fullUser.Username,
					"email":           fullUser.Email,
					"profile_picture": fullUser.ProfilePicture,
					"CreatedAt":       fullUser.CreatedAt,
					"UpdatedAt":       fullUser.UpdatedAt,
					"DeletedAt":       fullUser.DeletedAt,
					"is_admin":        fullUser.IsAdmin,
				}
				allUsers = append(allUsers, user)
			}
		}

		// Second: Also try direct database search to catch any users missed by Bleve
		// This ensures recently updated profiles are found even if search index is stale
		dbUsers, err := mgr.GetUsersByUsername(username)
		if err != nil {
			// Database search failed, return whatever we found from Bleve
		} else {
			for _, dbUser := range dbUsers {
				// Skip current user and already found users
				if dbUser.ID == uint(userIdInt) || foundUserIDs[dbUser.ID] {
					continue
				}

				foundUserIDs[dbUser.ID] = true
				user := map[string]interface{}{
					"ID":              dbUser.ID,
					"username":        dbUser.Username,
					"email":           dbUser.Email,
					"profile_picture": dbUser.ProfilePicture,
					"CreatedAt":       dbUser.CreatedAt,
					"UpdatedAt":       dbUser.UpdatedAt,
					"DeletedAt":       dbUser.DeletedAt,
					"is_admin":        dbUser.IsAdmin,
				}
				allUsers = append(allUsers, user)
			}
		}

		// Limit results to 20 and sort by relevance (Bleve results first, then DB results)
		if len(allUsers) > 20 {
			allUsers = allUsers[:20]
		}

		c.JSON(http.StatusOK, allUsers)
	}
}
