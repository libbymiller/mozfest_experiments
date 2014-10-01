#/bin/sh

cd /home/pi/mozfest_experiments/moz/;
sudo rm moz-*;
sudo airmon-ng check kill;
sudo airmon-ng start wlan0;
nohup sudo airodump-ng mon0 --channel 11 --write moz &

sudo  wpa_supplicant -B -iwlan1 -c/etc/wpa_supplicant.conf -Dwext && dhclient wlan1;
sudo dhclient wlan1;

sleep 5

cd /home/pi/mozfest_experiments
nohup /opt/node/bin/node wifi.js "192.168.1.10" &
