require 'rmagick'

class Picture
  include Magick

  def initialize(path)
    image = Image.read(path).first#.resize_to_fit(320, 320)

    @pixel_count = image.rows * image.columns
    @histogram = {}

    image.color_histogram.each do |pixel, count|
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
    #puts @pixel_count
    @histogram.each { |color, count| puts "#{color}: #{count}" }
  end

  def similarity(target, threshold_norm)
    fail 'Similarity needs hex color.' unless target =~ /^#[0-9a-fA-F]{6}$/

    target = {
      :R => target[1..2].to_i(16),
      :G => target[3..4].to_i(16),
      :B => target[5..6].to_i(16)
    }
    target.merge!(rgb2xyz(target[:R], target[:G], target[:B]))
    target.merge!(xyz2lab(target[:X], target[:Y], target[:Z]))
    
    @histogram.each do |color, count|
      color.merge!(deltaE94(color, target))
    
    end

    sorted_histogram = @histogram.sort_by { |color, count| color[:deltaE] }

    min_deltaE = sorted_histogram.first[0][:deltaE]
    max_deltaE = sorted_histogram.last[0][:deltaE]
    threshold = min_deltaE + ((max_deltaE - min_deltaE) * threshold_norm)

    @histogram = sorted_histogram.to_h
    @histogram = @histogram.keep_if do |color, count|
      color[:deltaE] <= threshold
    end

    similarity_count = 0
    @histogram.each { |color, count| similarity_count += count }

    100 * (similarity_count / @pixel_count.to_f)
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

  def deltaE94(source, target)
    k1 = 0.045
    k2 = 0.015
    kL = kC = kH = 1

    dL = source[:L] - target[:L]
    da = source[:a] - target[:a]
    db = source[:b] - target[:b]

    c1 = Math.sqrt((source[:a] ** 2) + (source[:b] ** 2))
    c2 = Math.sqrt((target[:a] ** 2) + (target[:b] ** 2))
    dC = c1 - c2

    dH2 = (da ** 2) + (db ** 2) - (dC ** 2)

    sL = 1
    sC = 1 + (k1 * c1)
    sH = 1 + (k2 * c1)

    dE2 = ((dL/(kL*sL))**2) + ((dC/(kC*sC)) ** 2) + (dH2/((kH*sH)**2))

    { deltaE: Math.sqrt(dE2) }
  end
end

#pic = Picture.new('test_images/00593_autumnsunflower_1920x1200.jpg')
#pic.similarity('#fde352', 0.25)
#pic.test
