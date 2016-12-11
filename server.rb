require 'benchmark'
require 'fileutils'
require 'json'
require 'sinatra'

require './flickr'
require './image'
require './log'

get '/' do
  slim :index
end

get '/search' do
  content_type :json
  text = params[:text]
  count = params[:count]

  Log.instance.set_count(count)

  time = Benchmark.measure do
    flickr = Flickr.new('6b9f37752302a413f13966f78431d076')
    $result = flickr.search(text, count).to_json
  end

  Log.instance.log(:search, time.real)

  $result
end

get '/similarity' do
  content_type :json
  id = params[:id]
  url = params[:url]
  color = params[:color]
  type = params[:type]

  cached_path = "./cache/#{id}.jpg"
  open_uri_opts = { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }

  time = Benchmark.measure do
    open(url, open_uri_opts) do |photo|
      File.open(cached_path, 'wb') do |file|
        file.puts photo.read
      end
    end
  end

  Log.instance.log(:download, time.real)

  if type.include?('km')
    k = params[:k].to_i
    min_diff = params[:mindiff].to_f
    pic = Picture.new(cached_path, k, min_diff)
  else
    pic = Picture.new(cached_path)
  end

  threshold = type.include?('tc') ? params[:threshold].to_f : nil

  time = Benchmark.measure do
    $similarity = pic.similarity(type, color, threshold)
  end

  Log.instance.log(:similarity, time.real)

  FileUtils.rm_f cached_path

  $similarity.to_json
end
