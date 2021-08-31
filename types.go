package main

import (
	"encoding/json"

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
	Abandon    bool `json:"abandon"`
	CreateGame bool `json:"creategame"`
}

func (m *MessageWS) toJSON() ([]byte, error) {
	return json.Marshal(m)
}

type Player struct {
	Color string
	Conn  *websocket.Conn
}

type Game struct {
	Player1      Player
	Player2      Player
	Player1Plays bool
	Turn         chan bool
}

func NewGame(p1Conn *websocket.Conn, p2Conn *websocket.Conn) *Game {
	return &Game{
		Player1: Player{
			Color: "White",
			Conn:  p1Conn,
		},
		Player2: Player{
			Color: "Black",
			Conn:  p2Conn,
		},
		Player1Plays: true,
		Turn:         make(chan bool, 1),
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