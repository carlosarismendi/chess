package main

import (
	"sync"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

const (
	NONE int8 = iota
	GAME_START
	CHECKMATE
	TIMEOUT
	ABANDON
	OFFER_DRAW
	ACCEPT_DRAW
	KING_DROWNED
	FORCED_DRAW // This will happen when there are only kings or kings +  opposite bishops
)

func isGameFinished(flag int8) bool {
	return flag == CHECKMATE || flag == TIMEOUT || flag == ABANDON ||
		flag == ACCEPT_DRAW || flag == KING_DROWNED || flag == FORCED_DRAW
}

// Message for Websocket connections
type MessageWS struct {
	IdxSrc int8 `json:"idxsrc"`
	IdxDst int8 `json:"idxdst"`
	Flag   int8 `json:"flag"`
}

type Player struct {
	Color string
	Msgs  chan MessageWS
	Conn  *websocket.Conn
	Quit  chan bool
}

func NewPlayer(color string, wsConn *websocket.Conn) *Player {
	return &Player{
		Color: color,
		Msgs:  make(chan MessageWS, 1),
		Conn:  wsConn,
		Quit:  make(chan bool, 1),
	}
}

func (p *Player) ReceiveMessage(c echo.Context, opponent *Player) {
	for {
		msg, err := ReceiveSocketMessage(c, p.Conn)
		if err != nil {
			break
		}

		opponent.Msgs <- msg
		if isGameFinished(msg.Flag) {
			break
		}
	}
	p.Quit <- true
	close(p.Quit)
}

func (p *Player) SendMessage(c echo.Context) {
	for {
		msg := <-p.Msgs
		SendSocketMessage(c, p.Conn, msg)

		if isGameFinished(msg.Flag) {
			break
		}
	}

	close(p.Msgs)
}

type Game struct {
	Player1 *Player
	Player2 *Player
}

func NewGame(p1Conn *websocket.Conn, p2Conn *websocket.Conn) *Game {
	return &Game{
		Player1: NewPlayer("White", p1Conn),
		Player2: NewPlayer("Black", p2Conn),
	}
}

func (g *Game) Start(c echo.Context) (errP1 error, errP2 error) {
	data := make(map[string]interface{})
	data["flag"] = GAME_START
	data["color"] = g.Player1.Color

	errP1 = SendSocketMessage(c, g.Player1.Conn, data)

	data["color"] = g.Player2.Color
	errP2 = SendSocketMessage(c, g.Player2.Conn, data)
	return
}

type GameMap struct {
	games map[string]*Game
	lock  sync.RWMutex
}

func NewGameMap() *GameMap {
	return &GameMap{
		games: make(map[string]*Game),
		lock:  sync.RWMutex{},
	}
}

func (gm *GameMap) addGame(key string, game *Game) {
	gm.lock.Lock()
	gm.games[key] = game
	gm.lock.Unlock()
}

func (gm *GameMap) removeGame(key string) {
	gm.lock.Lock()
	_, exits := gm.games[key]
	if exits {
		delete(gm.games, key)
	}
	gm.lock.Unlock()
}

func (gm *GameMap) getGame(key string) (game *Game, exists bool) {
	gm.lock.RLock()
	game, exists = gm.games[key]
	gm.lock.RUnlock()
	return
}
