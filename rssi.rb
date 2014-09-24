require 'faye'
require 'thin'
require 'sinatra'
require 'sinatra/base'
require 'sinatra/cross_origin'
require 'serialport'

$stdout.sync = true

class MyApp < Sinatra::Base
  register Sinatra::CrossOrigin

  client = nil

  before do
    client = Faye::Client.new('http://localhost:9292/faye')

    client.subscribe('/foo') do |message|
      puts message.inspect
    end

  end

  get '/' do
    cross_origin
    puts "hello"  
    erb :index
  end

  get '/set_rssi/:id/:rssi' do
    cross_origin
    id =  params[:id]
    rssi =  params[:rssi]
    puts "id is #{id}"
    puts "rssi is #{rssi}"
    client.publish('/rssi', 'id' => id, 'rssi' => rssi)
  end

end

