wget -c https://golang.org/dl/go1.17.linux-amd64.tar.gz
sudo tar -C . -xvzf go1.17.linux-amd64.tar.gz
export GOBIN="$GOPATH/bin"
export GOROOT=.
export PATH=$PATH:$GOROOT/bin
source ~/.bash_profile
source ~/.profile
go get github.com/labstack/echo/v4
