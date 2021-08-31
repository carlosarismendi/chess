package main

import (
	"crypto/md5"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

var lock sync.RWMutex = sync.RWMutex{}
var games map[string]*Game = make(map[string]*Game)

func addGame(token string, game *Game) {
	lock.Lock()
	games[token] = game
	lock.Unlock()
}

func removeGame(token string) {
	lock.Lock()
	_, exits := games[token]
	if exits {
		delete(games, token)
	}
	lock.Unlock()
}

func getGame(token string) (game *Game, exists bool) {
	lock.RLock()
	game, exists = games[token]
	lock.RUnlock()

	return
}

func generateToken() string {
	currentDateStr := time.Now().String()
	token := md5.Sum([]byte(currentDateStr))
	return fmt.Sprintf("%x", token)
}

func generateInvitationLink(c echo.Context, token string) string {
	host := c.Request().Host
	return fmt.Sprintf("%s/?token=%s", host, token)
}

func CreateGame(c echo.Context) error {
	var token string
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		// Returns invitation link to the user who created the game
		token = generateToken()
		url := generateInvitationLink(c, token)
		data := make(map[string]string)
		data["url"] = url
		err := SendSocketMessage(c, ws, data)
		if err != nil {
			return
		}

		game := NewGame(ws, nil)
		addGame(token, game)

		for {
			select {
			case <-game.Turn:
				endGame := ReceiveAndSendSocketMessage(c, game.Player1.Conn, game.Player2.Conn)
				game.Turn <- true

				if endGame {
					break
				}
				break
			case <-time.After(5 * 60 * time.Second): // 5 minutes
				return
			}
		}
	}).ServeHTTP(c.Response(), c.Request())

	removeGame(token)
	return nil
}

func JoinGame(c echo.Context) error {
	var token string
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		// User joins a game by invitation link
		token = c.Param("token")
		game, exits := getGame(token)
		if !exits {
			SendSocketMessage(c, ws, http.StatusNotFound)
			c.Logger().Error(fmt.Sprintf("Game with token %s does not exists.\n", token))
			return
		}

		game.Player2.Conn = ws

		// Send to both players signal to start playing
		errP1, errP2 := game.Start(c)
		if errP1 != nil || errP2 != nil {
			c.Logger().Error(fmt.Sprintf("errP1: %v && errP2: %v\n", errP1, errP2))
			SendError(c, game.Player1.Conn, http.StatusInternalServerError)
			SendError(c, game.Player2.Conn, http.StatusInternalServerError)
			return
		}

		game.Turn <- true
		for {
			<-game.Turn
			endGame := ReceiveAndSendSocketMessage(c, game.Player2.Conn, game.Player1.Conn)
			game.Turn <- true

			if endGame {
				break
			}
		}
	}).ServeHTTP(c.Response(), c.Request())

	removeGame(token)
	return nil
}
