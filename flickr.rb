require 'fileutils'
require 'json'
require 'net/http'
require 'open-uri'

require './image'

class Flickr
  def initialize(api_key)
    @api_key = api_key
  end

  def search(text)
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
    results = []

    flickr_results[:photos][:photo].each do |photo|
      results << {
        farm_id: photo[:farm],
        server_id: photo[:server],
        id: photo[:id],
        secret: photo[:secret],
        title: photo[:title]
      }
    end

    results
  end
end
