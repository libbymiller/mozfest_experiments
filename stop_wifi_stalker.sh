#/bin/sh

sudo airmon-ng stop wlan0

sudo kill `pidof node`
sudo kill `pidof airodump-ng`

