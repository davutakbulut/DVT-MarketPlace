export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startAutoSyncWorker } = await import('@/lib/cron/autoSyncWorker');
    startAutoSyncWorker();
  }
}
