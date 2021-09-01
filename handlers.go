package main

import (
	"crypto/md5"
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

var gameMap *GameMap = NewGameMap()

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
		gameMap.addGame(token, game)

		go game.ReceiveMessage(c, &game.Player1, &game.Player2)
		go game.SendMessage(c, &game.Player1)
		<-game.Quit
	}).ServeHTTP(c.Response(), c.Request())

	gameMap.removeGame(token)
	return nil
}

func JoinGame(c echo.Context) error {
	var token string
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		// User joins a game by invitation link
		token = c.Param("token")
		game, exits := gameMap.getGame(token)
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

		go game.ReceiveMessage(c, &game.Player2, &game.Player1)
		go game.SendMessage(c, &game.Player2)
		<-game.Quit
	}).ServeHTTP(c.Response(), c.Request())

	gameMap.removeGame(token)
	return nil
}
