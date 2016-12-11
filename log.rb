require 'singleton'

class Log
  include Singleton

  def initialize
    @log = {}
  end

  def log(action, time)
    @logfile = File.open('./log/log.csv', 'a');

    @log[action] ||= { time: 0.0, processed: 0 }
    @log[action][:time] += time
    @log[action][:processed] += 1

    @write = true

    @log.keys.each do |action|
      next if action == :search
      @write = false unless @log[action][:processed] == @count
    end

    if @write
      @log.keys.each do |action|
        if action == :search
          @logfile.puts "#{action.to_s};#{@log[action][:time]}"
        else
          @logfile.puts "#{action.to_s};#{@log[action][:time] / @count}"
        end
      end

      @logfile.puts
      @log = {}
    end

    @logfile.close
  end

  def set_count(count)
    @count = count.to_i
  end
end
