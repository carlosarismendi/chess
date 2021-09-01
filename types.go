package main

import (
	"sync"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

// Message for Websocket connections
type MessageWS struct {
	FileSrc    int  `json:"filesrc"`
	RankSrc    int  `json:"ranksrc"`
	FileDst    int  `json:"filedst"`
	RankDst    int  `json:"rankdst"`
	LegalMove  bool `json:"legalmove"`
	CheckMate  bool `json:"checkmate"`
	CreateGame bool `json:"creategame"`
	Abandon    bool `json:"abandon"`
	TimeOut    bool `json:"timeout"`
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
		if msg.TimeOut || msg.Abandon || msg.CheckMate {
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

		if msg.TimeOut || msg.Abandon || msg.CheckMate {
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
	data["gamestart"] = true
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
