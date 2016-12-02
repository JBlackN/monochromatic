require './image'

image = Picture.new('test_images/03023_pinetree_1920x1080.jpg')
puts image.kmeans(3, 1)
