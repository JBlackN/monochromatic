require './flickr'

flickr = Flickr.new('6b9f37752302a413f13966f78431d076')
results = flickr.search('purple', '#7410a5')

results_by_sim = results.sort_by do |image, similarity|
  similarity[:deltaE]
end

results_by_perc = results.sort_by do |image, similarity|
  similarity[:percentage]
end.reverse.map.with_index.to_a.to_h

results_by_both = {}
results_by_sim.each_with_index do |result, index|
  results_by_both[result] = ((results_by_perc[result] + index + 2) / 2)
end
results_by_both = results_by_both.sort_by { |result, index| [index, result[1][:deltaE]] }.to_h

results_by_both.each do |result, index|
  file = result[0].to_s
  sim = "%.4f" % result[1][:deltaE]
  perc = "%.4f%" % result[1][:percentage]

  puts "#{file} (deltaE: #{sim}, #{perc})"
end

=begin
results.each do |image, similarity|
  sim = "%.4f" % similarity
  puts "#{image} (#{sim})"
end
=end
