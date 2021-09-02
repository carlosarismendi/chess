package main

import (
	"sync"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

// If this consts are modified. const FLAGS_WS must be adapted to this in frontend in constants.js
const (
	NONE int8 = iota
	GAME_START
	CHECKMATE
	TIMEOUT
	ABANDON
	OFFER_DRAW
	ACCEPT_DRAW
	DECLINE_DRAW
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

type ChessTimer struct {
	lock    sync.RWMutex
	Clock   time.Time
	Stopped bool
	tick    time.Duration
}

func NewChessTimer(duration time.Duration) *ChessTimer {
	t := time.Time{}
	return &ChessTimer{
		lock:    sync.RWMutex{},
		Clock:   t.Add(duration),
		Stopped: true,
		tick:    time.Millisecond * 50,
	}
}

func (ct *ChessTimer) toMap() map[string]int {
	m := make(map[string]int)

	ct.lock.RLock()
	m["minutes"] = ct.Clock.Minute()
	m["seconds"] = ct.Clock.Second()
	ct.lock.RUnlock()
	return m
}

func (ct *ChessTimer) Stop() {
	ct.Stopped = true
}

func (ct *ChessTimer) Start() {
	ct.Stopped = false
}

func (ct *ChessTimer) update() {
	<-time.Tick(ct.tick)

	ct.lock.Lock()
	ct.Clock = ct.Clock.Add(-ct.tick)
	ct.lock.Unlock()
}

type Player struct {
	Color string
	Msgs  chan MessageWS
	Conn  *websocket.Conn
	Quit  chan bool
	Timer *ChessTimer
}

func NewPlayer(color string, wsConn *websocket.Conn, timerDuration time.Duration) *Player {
	return &Player{
		Color: color,
		Msgs:  make(chan MessageWS, 1),
		Conn:  wsConn,
		Quit:  make(chan bool, 1),
		Timer: NewChessTimer(timerDuration),
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

		// Player has moved a piece
		if msg.IdxSrc != 0 {
			p.Timer.Stop()
			opponent.Timer.Start()
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
	Quit    chan bool
}

func NewGame(p1Conn *websocket.Conn, p2Conn *websocket.Conn, timerDuration time.Duration) *Game {
	return &Game{
		Player1: NewPlayer("White", p1Conn, timerDuration),
		Player2: NewPlayer("Black", p2Conn, timerDuration),
		Quit:    make(chan bool, 1),
	}
}

func (g *Game) Start(c echo.Context) (errP1 error, errP2 error) {
	data := make(map[string]interface{})
	data["flag"] = GAME_START
	data["color"] = g.Player1.Color

	errP1 = SendSocketMessage(c, g.Player1.Conn, data)

	data["color"] = g.Player2.Color
	errP2 = SendSocketMessage(c, g.Player2.Conn, data)

	go g.manageTimers(c)
	return
}

func (g *Game) manageTimers(c echo.Context) {
	p1Timer := g.Player1.Timer
	p2Timer := g.Player2.Timer

	p1Timer.Start()

	go func() {
		tmap1 := make(map[string]map[string]int)
		tmap2 := make(map[string]map[string]int)

		// Every 200 milliseconds, both players will be sent the timers of both of them.
		for range time.Tick(time.Millisecond * 200) {
			tmap1["timer"], tmap1["opponentTimer"] = p1Timer.toMap(), p2Timer.toMap()
			tmap2["timer"], tmap2["opponentTimer"] = tmap1["opponentTimer"], tmap1["timer"]

			err := SendSocketMessage(c, g.Player1.Conn, tmap1)
			if err != nil {
				return
			}

			SendSocketMessage(c, g.Player2.Conn, tmap2)
			if err != nil {
				return
			}
		}
	}()

	for {
		select {
		// Once the game is finished and removed, it will receive a message
		// through this channel and will end the execution of this routine
		case <-g.Quit:
			return

		default:
			if p1Timer.Stopped {
				p2Timer.update()
			} else {
				p1Timer.update()
			}
		}
	}
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
	game, exits := gm.games[key]
	if exits {
		game.Quit <- true
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
