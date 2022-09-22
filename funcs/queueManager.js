class QueueManager {
  m_interval_ms;
  m_interval;
  m_queue;

  constructor(interval_ms = 1000) {
    this.m_interval_ms = interval_ms;
    this.m_interval = null;
    this.m_queue = [];
  }

  executeQueue() {
    if (!this.m_queue.length)
      return void this.removeInterval();

    const result = this.m_queue.shift()?.();

    if (result instanceof Promise)
      result.catch(console.error);
  }

  createInterval() {
    if (this.m_interval)
      throw new Error("Interval already running");

    this.interval = setInterval(this.executeQueue.bind(this), this.m_interval_ms);
  }

  removeInterval() {
    clearInterval(this.m_interval);

    this.m_interval = null;
  }

  add(callback) {
    if (!this.interval)
      this.createInterval();

    this.m_queue.push(callback);
  }
}

module.exports = {QueueManager}