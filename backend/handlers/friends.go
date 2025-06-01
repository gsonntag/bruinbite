package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gsonntag/bruinbite/db"
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