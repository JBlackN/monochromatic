require 'fileutils'
require 'json'
require 'sinatra'

require './flickr'
require './image'

get '/' do
  slim :index
end

get '/search' do
  content_type :json
  text = params['text']

  flickr = Flickr.new('6b9f37752302a413f13966f78431d076')
  flickr.search(text).to_json
end

get '/similarity' do
  content_type :json
  id = params[:id]
  url = params[:url]
  color = params[:color]

  cached_path = "./image_cache/#{id}.jpg"
  open_uri_opts = { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }

  open(url, open_uri_opts) do |photo|
    File.open(cached_path, 'wb') do |file|
      file.puts photo.read
    end
  end

  pic = Picture.new(cached_path, 3, 1) # TODO: custom k, min_diff
  similarity = pic.similarity(color)

  FileUtils.rm_f cached_path

  similarity.to_json
end
