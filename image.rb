require 'rmagick'

class Picture
  include Magick

  def initialize(path, k = nil, min_diff = nil, resize = false)
    image = Image.read(path).first
    image = image.resize_to_fit(resize) if resize

    @pixel_count = image.rows * image.columns
    @histogram = Hash.new(0)

    image.color_histogram.each do |pixel, count|
      color = {
        R: pixel.red,
        G: pixel.green,
        B: pixel.blue
      }

      @histogram[color] += count
    end

    @histogram.each do |color, count|
      color.merge!(rgb2xyz(color[:R], color[:G], color[:B]))
      color.merge!(xyz2lab(color[:X], color[:Y], color[:Z]))
    end

    @dominant_colors = kmeans(k, min_diff) unless k.nil? || min_diff.nil?
  end

  def similarity(type, reference, threshold = nil)
    fail 'Similarity needs hex color.' unless reference =~ /^#[0-9a-fA-F]{6}$/

    reference = {
      :R => reference[1..2].to_i(16),
      :G => reference[3..4].to_i(16),
      :B => reference[5..6].to_i(16)
    }
    reference.merge!(rgb2xyz(reference[:R], reference[:G], reference[:B]))
    reference.merge!(xyz2lab(reference[:X], reference[:Y], reference[:Z]))

    if type.include?('km')
      results = []

      @dominant_colors.each do |color, percentage|
        results << {
          deltaE: deltaE94(color, reference)[:deltaE],
          cluster_percentage: percentage
        }
      end

      result = results.min_by { |result| result[:deltaE] }
    end

    if type.include?('tc') && !threshold.nil?
      @histogram.each do |color, count|
        color.merge!(deltaE94(reference, color))
      end

      sorted_histogram = @histogram.sort_by { |color, count| color[:deltaE] }
      @histogram = sorted_histogram.to_h
      @histogram = @histogram.keep_if do |color, count|
        color[:deltaE] <= threshold
      end

      similarity_count = 0
      @histogram.each { |color, count| similarity_count += count }
      
      result ||= {}
      result[:threshold_percentage] = 100 * (similarity_count / @pixel_count.to_f)
    end

    result
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

  def deltaE94(reference, sample)
    k1 = 0.045
    k2 = 0.015
    kL = kC = kH = 1

    dL = reference[:L] - sample[:L]
    da = reference[:a] - sample[:a]
    db = reference[:b] - sample[:b]

    c1 = Math.sqrt((reference[:a] ** 2) + (reference[:b] ** 2))
    c2 = Math.sqrt((sample[:a] ** 2) + (sample[:b] ** 2))
    dC = c1 - c2

    dH2 = (da ** 2) + (db ** 2) - (dC ** 2)

    sL = 1
    sC = 1 + (k1 * c1)
    sH = 1 + (k2 * c1)

    dE2 = ((dL/(kL*sL))**2) + ((dC/(kC*sC)) ** 2) + (dH2/((kH*sH)**2))

    { deltaE: Math.sqrt(dE2) }
  end

  def kmeans(k, min_diff)
    clusters = []
    min_diff = min_diff.to_f

    @histogram.to_a.sample(k).to_h.each do |color, count|
      clusters << {
        histogram: { color => count },
        center: color
      }
    end
    
    while true do
      cluster_colors = []
      k.times { |i| cluster_colors[i] = {} }

      @histogram.each do |color, count|
        cluster_index = nil
        min_distance = Float::INFINITY

        k.times do |i|
          center_color = clusters[i][:center]
          distance = deltaE94(center_color, color)[:deltaE]

          if distance < min_distance
            min_distance = distance
            cluster_index = i
          end
        end

        cluster_colors[cluster_index].merge!(color => count)
      end

      diff = 0

      k.times do |i|
        cluster = clusters[i]
        old_center = cluster[:center]

        cluster[:histogram] = cluster_colors[i]
        cluster[:center] = update_center(cluster[:histogram], k)

        diff = [diff, deltaE94(old_center, cluster[:center])[:deltaE]].max
      end

      break if diff < min_diff
    end

    centers = {}
    clusters.each do |cluster|
      cluster_pix_count = 0
      cluster[:histogram].each { |color, count| cluster_pix_count += count}
      cluster_percentage = 100 * (cluster_pix_count.to_f / @pixel_count)

      centers[cluster[:center]] = cluster_percentage
    end
    centers
  end

  def update_center(histogram, k)
    center = { :L => 0.0, :a => 0.0, :b => 0.0 }
    total_count = 0

    histogram.each do |color, count|
      center = center.map do |component, value|
        [component, value + (color[component] * count)]
      end.to_h

      total_count += count
    end

    center.map { |component, value| [component, value / total_count] }.to_h
  end
end
