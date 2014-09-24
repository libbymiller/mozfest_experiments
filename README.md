Currently a two-part experiment:

* run foreman start to start a faye server and a thin app, which forwards calls to faye and makes a webaudio api beep
* run node ./noble/examples/rssi.js to send rssi (nearness) of BTLE devices to the server
* or try it by doing "curl http://localhost:3030/set_rssi/foo/99"
* point your browser at http://localhost:3030/

you'll probably need to do

    bundle install 

and also 

    npm install noble

see https://github.com/sandeepmistry/noble

