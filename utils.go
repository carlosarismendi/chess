package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

func SendSocketMessage(c echo.Context, ws *websocket.Conn, msg interface{}) error {
	err := websocket.JSON.Send(ws, msg)
	if err != nil {
		c.Logger().Error(err)
		SendError(c, ws, http.StatusInternalServerError)
		return err
	}
	return nil
}

func ReceiveSocketMessage(c echo.Context, ws *websocket.Conn) (MessageWS, error) {
	msg := MessageWS{}
	err := websocket.JSON.Receive(ws, &msg)
	if err != nil {
		c.Logger().Error(err)
		SendError(c, ws, http.StatusBadRequest)
		return msg, err
	}

	return msg, nil
}

func SendError(c echo.Context, ws *websocket.Conn, errorCode int) error {
	payload := make(map[string]int)
	payload["errorcode"] = errorCode
	err := websocket.JSON.Send(ws, payload)
	if err != nil {
		fmt.Printf("[ERROR-send]: %v\n", err)
		c.Logger().Error(err)
		return err
	}
	return nil
}

func ReceiveAndSendSocketMessage(c echo.Context, wsIn *websocket.Conn, wsOut *websocket.Conn) bool {
	msg, err := ReceiveSocketMessage(c, wsIn)
	if err != nil {
		return true
	}

	err = SendSocketMessage(c, wsOut, msg)
	if err != nil {
		return true
	}

	return msg.CheckMate || msg.TimeOut || msg.Abandon
}
