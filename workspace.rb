require 'rmagick'

test_img_path = ARGV[0]
img = Magick::Image.read(test_img_path).first
histogram = img.color_histogram.sort_by { |pixel, count| count }.to_h

new_histogram = Hash.new(0) # del

histogram.each do |pixel, count|
  red_8bit = pixel.red / 256
  green_8bit = pixel.green / 256
  blue_8bit = pixel.blue / 256

  # del:
  red_4bit = red_8bit / 16
  green_4bit = green_8bit / 16
  blue_4bit = blue_8bit / 16

  new_histogram["#{red_4bit},#{green_4bit},#{blue_4bit}"] += count

  #puts "(#{red_8bit}, #{green_8bit}, #{blue_8bit}): #{count}"
end

# del:
i = 1
new_histogram = new_histogram.sort_by { |pixel, count| count }.to_h
new_histogram.each do |pixel, count|
  puts "#{i} - (#{pixel}): #{count}"
  i += 1
end

# Technika:
# ---------
# * foreach color in histogram: compute deltaE s picked color
# * sort histogram by deltaE
# * pick some most similar
# * take counts, sum, percentage of all image pixels
# * use percentage as similarity metric
