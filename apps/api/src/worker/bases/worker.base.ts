import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { WorkerException } from '@workers/exceptions/worker.exception';

export abstract class WorkerBase extends WorkerHost {
    @OnWorkerEvent('failed')
    onFailed(job: Job<any, null, string> | undefined, error: Error) {
        const maxAttempts = job.opts.attempts || 1;
        const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

        if (isLastAttempt) {
            let isFatal = true;

            if (error instanceof WorkerException) {
                isFatal = !!error;
            }

            if (isFatal) {
                try {
                    console.error(error);
                } catch (_) {}
            }
        }
    }
}
