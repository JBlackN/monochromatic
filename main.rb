require './image'

results = {}

test_images = Dir['test_images/*']
i = 1

test_images.each do |test_image|
  puts "Processing #{test_image} (#{i}/#{test_images.length})"
  
  pic = Picture.new(test_image)
  similarity = pic.similarity('#fde352', 0.25)
  
  results[test_image.to_sym] = similarity

  sim = "%.4f%" % similarity
  puts "  - similarity: #{sim}"
  i += 1
end

puts
puts 'Results'
80.times { print '=' }
puts

results = results.sort_by { |image, similarity| similarity }.reverse.to_h
results.each do |image, similarity|
  sim = "%.4f%" % similarity
  puts "#{image} (#{sim})"
end
