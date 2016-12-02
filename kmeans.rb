require './image'

path = 'test_images/03023_pinetree_1920x1080.jpg'
image = Picture.new(path, 3, 1, 320)
puts image.similarity('#0259cc')
