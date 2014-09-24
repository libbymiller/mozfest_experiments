require 'faye'
require 'thin'
require 'sinatra'
require 'sinatra/base'
require 'sinatra/cross_origin'
require 'serialport'

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

  get '/set_freq/:freq' do
    cross_origin
    freq =  params[:freq]
    puts "freq is #{freq}"
    puts "client is #{client}"
    client.publish('/freq', 'text' => freq)
  end

end

