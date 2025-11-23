import { IBackgroundJob } from '../../types';
import { discoveryPluginRunner } from '../../services/discovery_plugin_services';
import { debug } from '../../services/logger_services';

/**
 * TODO: Add persistent queue
 */
export class JobQueue {
  private static queue: IBackgroundJob[] = [];
  private isProcessing: boolean = false;
  private readonly concurrencyLimit: number;
  private activeJobs: number = 0;

  constructor(concurrencyLimit: number = 1) {
    this.concurrencyLimit = concurrencyLimit;
  }

  /**
   * Adds a job to the queue.
   * @param job The asynchronous function to be executed.
   */
  enqueue(job: IBackgroundJob): void {
    JobQueue.queue.push(job);
    this.processQueue();
  }

  /**
   * Processes jobs from the queue, respecting the concurrency limit.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    while (JobQueue.queue.length > 0 && this.activeJobs < this.concurrencyLimit) {
      const job = JobQueue.queue.shift(); // Get the next job
      if (job) {
        this.activeJobs++;
        try {
          const {discoveryPlugin, rapport, selectorValue} = job;
          // toggle the background runner to a foreground runner
          await discoveryPluginRunner(discoveryPlugin, rapport, selectorValue)
        } catch (error) {
          debug("Job failed:", error);
          // Implement retry logic or error handling here
        } finally {
          this.activeJobs--;
          // Continue processing if there are more jobs and capacity
          await this.processQueue();
        }
      }
    }
    this.isProcessing = false;
  }
}

