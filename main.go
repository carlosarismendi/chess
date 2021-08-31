package main

import (
	"fmt"
	"os"

	"github.com/labstack/echo/v4"
)

var (
	port = os.Getenv("PORT")
)

func main() {
	if len(port) <= 0 {
		port = "8080"
	}

	e := echo.New()
	e.Static("/", "static")

	// e.Use(middleware.Logger())
	// e.Use(middleware.Recover())

	e.GET("/new-game", CreateGame)
	e.GET("/join-game/:token", JoinGame)

	e.Logger.Fatal(e.Start(fmt.Sprintf(":%s", port)))
}
