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
	fmt.Printf("### Games: %v", games)
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
	host := c.Echo().Server.Addr
	return fmt.Sprintf("%s/?token=%s", host, token)
}

func CreateGame(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		// defer ws.Close()

		// Returns invitation link to the user who created the game
		token := generateToken()
		url := generateInvitationLink(c, token)
		data := make(map[string]string)
		data["url"] = url
		err := SendSocketMessage(c, ws, data)
		if err != nil {
			return
		}

		game := NewGame(ws, nil)
		addGame(token, game)

		fmt.Printf("### Creating game: %v\n", *game)
		// for {
		// 	ReceiveAndSendSocketMessage(c, game.Player1.Conn, game.Player2.Conn)
		// }
		// playGame(c, game, "Player 1")
		for {
			<-game.Turn
			checkmate := ReceiveAndSendSocketMessage(c, game.Player1.Conn, game.Player2.Conn)
			game.Turn <- true

			if checkmate {
				break
			}
		}

		removeGame(token)
	}).ServeHTTP(c.Response(), c.Request())

	return nil
}

func JoinGame(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		// User joins a game by invitation link
		token := c.Param("token")
		game, exits := getGame(token)
		if !exits {
			SendSocketMessage(c, ws, http.StatusNotFound)
			c.Logger().Error(fmt.Sprintf("Game with token %s does not exists.", token))
			return
		}

		game.Player2.Conn = ws

		// Send to both players signal to start playing
		errP1, errP2 := game.Start(c)
		if errP1 != nil || errP2 != nil {
			c.Logger().Error(fmt.Sprintf("errP1: %v && errP2: %v", errP1, errP2))
			SendError(c, game.Player1.Conn, http.StatusInternalServerError)
			SendError(c, game.Player2.Conn, http.StatusInternalServerError)
			return
		}

		fmt.Printf("### Joining game: %v\n", *game)
		game.Turn <- true
		for {
			<-game.Turn
			checkmate := ReceiveAndSendSocketMessage(c, game.Player2.Conn, game.Player1.Conn)
			game.Turn <- true

			if checkmate {
				break
			}
		}

		removeGame(token)
	}).ServeHTTP(c.Response(), c.Request())

	return nil
}
