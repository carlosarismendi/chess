package main

import (
	"fmt"

	"github.com/labstack/echo/v4"
)

var (
	host = "localhost"
	port = 8080
)

func main() {
	e := echo.New()
	e.Static("/", "../web")

	// e.Use(middleware.Logger())
	// e.Use(middleware.Recover())

	e.GET("/new-game", CreateGame)
	e.GET("/join-game/:token", JoinGame)

	e.Logger.Fatal(e.Start(fmt.Sprintf("%s:%d", host, port)))
}
