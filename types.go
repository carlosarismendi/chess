package main

import (
	"encoding/json"
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

func (m *MessageWS) toJSON() ([]byte, error) {
	return json.Marshal(m)
}

type Player struct {
	Color string
	Msgs  chan MessageWS
	Conn  *websocket.Conn
}

type Game struct {
	Player1      Player
	Player2      Player
	Player1Plays bool
	Turn         chan bool
	Quit         chan bool
}

func NewGame(p1Conn *websocket.Conn, p2Conn *websocket.Conn) *Game {
	return &Game{
		Player1: Player{
			Color: "White",
			Msgs:  make(chan MessageWS, 1),
			Conn:  p1Conn,
		},
		Player2: Player{
			Color: "Black",
			Msgs:  make(chan MessageWS, 1),
			Conn:  p2Conn,
		},
		Player1Plays: true,
		Turn:         make(chan bool, 1),
		Quit:         make(chan bool, 2),
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

func (g *Game) ReceiveMessage(c echo.Context, p *Player, opponent *Player) {
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
	g.Quit <- true
}

func (g *Game) SendMessage(c echo.Context, p *Player) {
	for {
		msg := <-p.Msgs
		SendSocketMessage(c, p.Conn, msg)

		if msg.TimeOut || msg.Abandon || msg.CheckMate {
			break
		}
	}

	close(p.Msgs)
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
