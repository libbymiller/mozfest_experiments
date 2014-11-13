# Mozfest technical investigation 

The brief was to do some technical experiments to see if it was feasible to do an installation at 
Mozfest that responded to the presence of people in a way that made people think about privacy.

In summary: it is possible: scanning for wifi finds the most devices and is also the most 
accurate. BTLE works but is rare and inaccurate. BT works but only if the device is discoverable, 
which phones are not usually. We've not tried RFID yet - that should work fine with the right 
reader, but only in very close or touching proximity.


# New proposal

*Note that we'recurrently investigating a different idea to do with images rather than audio*

Andrew Nicolaou and I had a think about our options, producing the following requirements:

* must progress Radiodan / MediScape work
* must fill a largeish space
* must make people think about privacy
* should make people return

The next idea was a space in which as people moved through it with the devices they were already carrying, would respond musically to their movement in a way they could control. The idea was to address multiple ways in which people were "leaking" data - just their mac addresses or other unique identifiers for devices - and illustrate it audially and maybe visually. We could have multiple boxes detecting multiple types of ID allowing us to spread the work. It would give us the opportunity to reuse some of the Radiodan infrastructure and perhaps also look into the web audio api some more. We'd need help with the musical side of it. 

This would:

* progress Radiodan / MediaScape work on device proximity and identity
* allow us to fill the space
* we think make people think about privacy because they could directly interact with it


I took the task of doing a technical investigation as I'd already looked into BTLE and Radiodan, and had done some work on web audio.


## Technical investigation

I tried a number of things

1. Bluetooth LE and proximity
2. web audio API via faye to a laptop, web audio API on the PI
3. wifi and proximity
4. Bluetooth detection


### 1. BTLE and proximity

This was the most detailed investigation, and is based on previous work I've done around detecting BTLE devices using the node.js library, noble.

Noble is very easy to use, I tried it on mac os X 10.9 and linux (Raspberry pi). It requires a dongle and a little setup on the PI:

    sudo apt-get install bluetooth bluez blueman libbluetooth-dev
    npm install noble

On Mac os X you need a machine that can do BTLE, < 2 years old: if it's not built in, you need a dongle, which are ~£5.

I tried it with two kinds of devices, a light blue bean and a Nike Fuelband.

Light blue beans are about £70 for 4, only available from the US. They have built in RGB LED, 3 dimensional accelerometers, plus a built in api for reading and writing, with 5 spaces for writing a single long int each. They have a small amount of board attached for adding sensors. They run from a coin battery, which under low load can last a year.
They are arduino-compatible, and you communicate with them over their bluetooth port which appears as a serial port on the mac. They don't work with windows or linux yet. They have a reasonable community involved and are responsive to that community.

Here as with the Nike Fuelband I was using them only as identifiers, not any of their other functionality, so they only needed to be on.

In order to get the IDs of nearby devices you just need to scan; but in order to get their proximity you need to connect to them. Connecting typically times out after a few seconds so you need to reconnect frequently. Proximity (RRSI) is inaccurate, although there are ways to process it which make it less so, though I've not tried them. Requesting RSSI more than once every 2 seconds makes it more inaccurate. Devices seem to vary and it appeared there was some interaction between them. Other strange things were that the same device ids appeared differently on the Raspberry pi and the mac. It may be possible for some devices to get more information associated with them, such as manufacturer.

The code is [here](https://github.com/libbymiller/mozfest_experiments/rssi.js)

All it does is use noble to detect to and connect to any available BTLE devices and get their IDs and RSSIs. It sends a call to a specified url whenever it detects an RSSI or if it decides it's out of range. 

One problem is that there are currently very few BTLE devices around.


### 2. Web audio API via faye to a laptop

To experiment with the web audio API I wrote a simple web audio api example, using my existing "beeps" library, that plays a note based on a number (low number = high note, high number = low note). A web server takes API calls and converts them to faye, which javascript intercepts and uses. This works fine, though with too many calls too rapidly the server crashes. 

Web Audio playback works on Chrome, Safari and Mozilla, but not on Epiphany, the new Raspberry Pi browser (even though some detectors report it as being present). Faye and the web audio api page can be on a different machine to the detection.


The code is here:
https://github.com/libbymiller/mozfest_experiments/blob/master/default.rb
https://github.com/libbymiller/mozfest_experiments/blob/master/views/music.erb


3. Wifi mac address and proximity

When devices are searching for wifi networks they give out their mac addresses, and so can be tracked, even if they are not connected to a network. This is a technique used by some shopping centres to track visitors, and by a company that tried to track people using rubbish bins, so it's quite good for raising awareness of privacy issues. Newer MC OS devices are using fake ids to circumvent and change these kinds of techniques.

The technique is straightforward - I tried it on a raspberry pi, and it uses a wifi card to scan for devices.

First run 
    sudo airmon-ng start wlan0

kill everything using wlan 1 and run it again

    sudo airmon-ng start wlan0

In another window:

     sudo airodump-ng --write mozfest wlan0

This dumps a file with the prefix "mozfest" showing data like this:

 CH 12 ][ Elapsed: 3 mins ][ 2014-09-24 12:39                                         
                                                                                                                                 
 BSSID              PWR  Beacons    #Data, #/s  CH  MB   ENC  CIPHER AUTH ESSID
                                                                                                                                 
 XX:XX:XX:XX:XX:XX   -1        4        0    0  11  11   OPN              SSID_30A74D                                    
 XX:XX:XX:XX:XX:XX  -66      127      287    0  11  54e. WPA2 CCMP   PSK  SSID_5739A                                                
 XX:XX:XX:XX:XX:XX  -72        9        0    0   1  54e. WPA2 CCMP   PSK  SSID_E7E818                                         
                                                                                                                                 
 BSSID              STATION            PWR   Rate    Lost    Frames  Probe                                                        
                                                                                                                                  
 XX:XX:XX:XX:XX:XX  00:XX:XX:XX:XX:XX  -80    0 - 1     77        4                                                               
 XX:XX:XX:XX:XX:XX  14:XX:XX:XX:XX:XX  -40    0e- 1     27       48                                                               
 XX:XX:XX:XX:XX:XX  D4:XX:XX:XX:XX:XX  -76    1e- 1      0      720  SSID_5739A                                                      
 XX:XX:XX:XX:XX:XX  18:XX:XX:XX:XX:XX  -44    0 - 0      0       12  SSID_5739A  

Then it's straightforward to write a node.js script that listens for changes to this file and picks out changes to the number and power of the items connected (under "STATION" and "PWR").

Informal experimentation suggested that PWR was very consistent, unlike for BTLE.

I'm slightly concerned that using this might be seen as a security problem (although used like this there's no packet injection and no messing with the network, just scanning). Also, we'd need to figure out the networking to have two wifi cards if we need it to connect to anything else (or use ethernet). In places like the office (and I guess Mozfest) there would be 100s of devices around.

The code to take these and send them via faye is in 
    ./start_wifi_stalker.sh
    ./stop_wifi_stalker.sh


4. BT detection

I searched for but failed to find any node.js libraries that did straightforward bluetooth scanning (or ones that I could make work, anyway).

It's straightforward on linux though:

    sudo hcitool scan

gives something like:

Scanning ...
	30:XX:XX:XX:XX:XX	libbyphone
	14:XX:XX:XX:XX:XX	rd000142

The big caveat here is that the devices need to be discoverable, and typically bluetooth discoverability on phones is switched off after a minute. Discoverability is not necessary if he device has been paired, but that's probably not the way we want to go.


Conclusions


* Scanning for wifi mac addresses finds the most devices and is also the most accurate. 
* BTLE works but is rare and inaccurate. 
* BT works but only if the device is discoverable, which phones are not usually. 
* We've not tried RFID yet - that should work fine with the right reader, but only in very close or touching proximity
* web audio API is strightforward on modern browsers but doesn't work on the Raspberry pi.
* the audio I made sounds horrible.




