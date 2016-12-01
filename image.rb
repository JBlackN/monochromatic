require 'rmagick'

class Picture
  include Magick

  def initialize(path)
    @histogram = {}

    Image.read(path).first.color_histogram.each do |pixel, count|
      color_8bit = {
        R: pixel.red / 256,
        G: pixel.green / 256,
        B: pixel.blue / 256
      }

      @histogram[color_8bit] = count
    end

    @histogram.each do |color, count|
      color.merge!(rgb2xyz(color[:R], color[:G], color[:B]))
      color.merge!(xyz2lab(color[:X], color[:Y], color[:Z]))
    end
  end

  def test # TODO: remove
    @histogram.each { |color, count| puts "#{color}: #{count}" }
  end

  private

  def rgb2xyz(r, g, b)
    r_norm = r / 255.0
    g_norm = g / 255.0
    b_norm = b / 255.0

    channels = [r_norm, g_norm, b_norm]

    channels.map! do |channel|
      if channel <= 0.04045
        channel = channel / 12.92
      else
        channel = ((channel + 0.055) / 1.055) ** 2.4
      end

      channel *= 100
    end
    
    r_norm, g_norm, b_norm = channels

    {
      :X => r_norm * 0.4124 + g_norm * 0.3576 + b_norm * 0.1805,
      :Y => r_norm * 0.2126 + g_norm * 0.7152 + b_norm * 0.0722,
      :Z => r_norm * 0.0193 + g_norm * 0.1192 + b_norm * 0.9505
    }
  end

  def xyz2lab(x, y, z)
    eps = 0.008856
    kappa = 903.3

    x_ref = x / 95.047
    y_ref = y / 100.0
    z_ref = z / 108.883

    params = [x_ref, y_ref, z_ref]

    params.map! do |param|
      if param > eps
        param **= (1.0/3)
      else
        param = (kappa * param + 16) / 116
      end
    end

    f_x, f_y, f_z = params

    {
      :L => 116 * f_y - 16,
      :a => 500 * (f_x - f_y),
      :b => 200 * (f_y - f_z)
    }
  end
end

pic = Picture.new('test_images/00593_autumnsunflower_1920x1200.jpg')
pic.test
