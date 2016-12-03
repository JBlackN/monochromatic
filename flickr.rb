require 'fileutils'
require 'json'
require 'net/http'
require 'open-uri'

require './image'

class Flickr
  def initialize(api_key)
    @api_key = api_key
  end

  def search(text, color_hex)
    params = {
      method: 'flickr.photos.search',
      format: 'json',
      text: text,
      per_page: 20, # TODO: change or remove
      api_key: @api_key
    }

    url = URI('https://api.flickr.com/services/rest/')
    url.query = URI.encode_www_form(params)

    response = Net::HTTP.get_response(url)

    fail 'API call failed.' unless response.is_a?(Net::HTTPSuccess)

    flickr_results = JSON.parse(response.body[/jsonFlickrApi\((.*)\)/, 1], { symbolize_names: true })
    results = {}

    flickr_results[:photos][:photo].each do |photo|
      farm_id = photo[:farm]
      server_id = photo[:server]
      id = photo[:id]
      secret = photo[:secret]

      photo_url = "https://farm#{farm_id}.staticflickr.com/#{server_id}/#{id}_#{secret}_h.jpg"
      thumbnail_url = "https://farm#{farm_id}.staticflickr.com/#{server_id}/#{id}_#{secret}_m.jpg"
      cached_path = "image_cache/#{id}.jpg"

      open_uri_opts = { ssl_verify_mode: OpenSSL::SSL::VERIFY_NONE }
      open(thumbnail_url, open_uri_opts) do |photo|
        File.open(cached_path, 'wb') do |file|
          file.puts photo.read
        end
      end

      pic = Picture.new("image_cache/#{id}.jpg", 3, 1)
      results[photo_url.to_sym] = pic.similarity(color_hex)

      FileUtils.rm_f cached_path
    end

    results
  end
end
