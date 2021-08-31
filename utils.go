package main

import (
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"golang.org/x/net/websocket"
)

func SendSocketMessage(c echo.Context, ws *websocket.Conn, msg interface{}) error {
	fmt.Printf("#### SEND-MSG: %v\n", msg)
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
	fmt.Printf("#### RECEIVE-MSG: %v\n", msg)
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
		c.Logger().Error(err)
		return err
	}
	return nil
}
func ReceiveAndSendSocketMessage(c echo.Context, wsIn *websocket.Conn, wsOut *websocket.Conn) bool {
	msg := MessageWS{}
	err := websocket.JSON.Receive(wsIn, &msg)
	fmt.Printf("#### MSG IN: %v\n", msg)
	if err != nil {
		fmt.Println("xd")
		return true
		// c.Logger().Error(err)
		// SendError(c, wsIn, http.StatusBadRequest)
		// return msg, err
	}

	fmt.Printf("#### MS OUT: %v\n", msg)
	err = websocket.JSON.Send(wsOut, msg)
	if err != nil {
		fmt.Println("xd")
		//     c.Logger().Error(err)
		//     SendError(c, ws, http.StatusInternalServerError)
		return true
	}

	return msg.CheckMate
}
