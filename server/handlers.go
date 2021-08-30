package main

import (
	"fmt"
	"net/http"
	"sync"

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

func getGame(token string) (game *Game, exists bool) {
	lock.RLock()
	game, exists = games[token]
	lock.RUnlock()

	return
}

func generateToken() string {
	return "mitoken"
}

func generateInvitationLink(c echo.Context) (string, string) {
	host := c.Echo().Server.Addr
	token := generateToken()
	return token, fmt.Sprintf("%s/%s", host, token)
}

func CreateGame(c echo.Context) error {
	websocket.Handler(func(ws *websocket.Conn) {
		defer ws.Close()

		// Returns invitation link to the user who created the game
		token, url := generateInvitationLink(c)
		data := make(map[string]string)
		data["url"] = url
		err := SendSocketMessage(c, ws, data)
		if err != nil {
			return
		}

		game := NewGame(ws, nil)
		addGame(token, game)

		fmt.Printf("### Creating game: %v\n", *game)
		playGame(c, game)
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
		playGame(c, game)
	}).ServeHTTP(c.Response(), c.Request())

	return nil
}

func playGame(c echo.Context, game *Game) {
	p1 := game.Player1
	p2 := game.Player2

	for {
		// Player1 message
		msgP1, err := ReceiveSocketMessage(c, p1.Conn)
		if err != nil {
			break
		}

		// Player2 message
		msgP2, err := ReceiveSocketMessage(c, p2.Conn)
		if err != nil {
			break
		}

		// Player1 abandons game
		if msgP1.Abandon {
			SendSocketMessage(c, p2.Conn, msgP1)
			break
		}

		// Player2 abandons game
		if msgP2.Abandon {
			SendSocketMessage(c, p1.Conn, msgP2)
			break
		}

		// Player 1 plays
		if game.Player1Plays {
			SendSocketMessage(c, p2.Conn, msgP1)
			// Player2 movement validation
			msgP2, err = ReceiveSocketMessage(c, p2.Conn)
			if err != nil {
				break
			}

			if !msgP2.LegalMove {
				SendSocketMessage(c, p1.Conn, msgP2)
				break
			}
		} else {
			// Player 2 plays
			SendSocketMessage(c, p1.Conn, msgP2)

			// Player1 movement validation
			msgP1, err = ReceiveSocketMessage(c, p1.Conn)
			if err != nil {
				break
			}

			if !msgP1.LegalMove {
				SendSocketMessage(c, p2.Conn, msgP1)
				break
			}
		}
	}
}
