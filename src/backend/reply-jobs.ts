/** Conversation-scoped cancellation, including providers which ignore abort. */
export class ReplyJobs {
  private jobs = new Map<string, Set<AbortController>>()

  async run<T>(scope: string, work: (signal: AbortSignal) => Promise<T>, parent?: AbortSignal): Promise<T> {
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (parent?.aborted) abort()
    parent?.addEventListener('abort', abort, { once: true })
    const jobs = this.jobs.get(scope) || new Set<AbortController>()
    jobs.add(controller)
    this.jobs.set(scope, jobs)
    try {
      controller.signal.throwIfAborted()
      const result = await work(controller.signal)
      controller.signal.throwIfAborted()
      return result
    } finally {
      parent?.removeEventListener('abort', abort)
      jobs.delete(controller)
      if (!jobs.size) this.jobs.delete(scope)
    }
  }

  cancel(scope: string): void {
    for (const controller of this.jobs.get(scope) || []) controller.abort()
  }
}
