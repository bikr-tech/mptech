#!/usr/bin/env python3
"""
Email queue worker entry point.
Run: python run_email_worker.py [--batch-size N] [--concurrency N] [--poll-interval SECONDS]

Example:
  python run_email_worker.py --batch-size 20 --concurrency 5
  python run_email_worker.py --poll-interval 3
"""
import asyncio
import os
import signal
import sys
from typing import Optional

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.workers.email_worker import EmailWorker


def parse_args():
    """Parse command-line arguments."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Process email job queue in the background"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help=f"Number of jobs to claim in each batch (default: {EmailWorker.__init__.__defaults__[1] if EmailWorker.__init__.__defaults__ else 10})",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=None,
        help=f"Maximum concurrent email sends (default: {EmailWorker.__init__.__defaults__[2] if EmailWorker.__init__.__defaults__ else 3})",
    )
    parser.add_argument(
        "--poll-interval",
        type=float,
        default=5.0,
        help="Seconds between polling for new jobs (default: 5.0)",
    )
    parser.add_argument(
        "--worker-id",
        type=str,
        default=None,
        help="Unique worker identifier (default: worker-{pid})",
    )

    args = parser.parse_args()

    return args


async def main():
    """Main entry point."""
    args = parse_args()

    print("\n" + "=" * 60)
    print("PlumbNepal Email Queue Worker")
    print("=" * 60)
    print(f"Worker ID: {args.worker_id or 'auto-generated'}")
    print(f"Batch Size: {args.batch_size or 10}")
    print(f"Concurrency: {args.concurrency or 3}")
    print(f"Poll Interval: {args.poll_interval}s")
    print("=" * 60 + "\n")

    worker = EmailWorker(
        worker_id=args.worker_id,
        batch_size=args.batch_size,
        concurrency=args.concurrency,
        poll_interval=args.poll_interval,
    )

    # Setup graceful shutdown
    async def shutdown_handler():
        """Handle shutdown signals gracefully."""
        print("\n\nShutting down gracefully...")
        worker._shutdown()
        await asyncio.sleep(1)
        print("Worker stopped.\n")

    # Create a task to wait for signals
    shutdown_task = asyncio.create_task(
        asyncio.to_thread(_handle_signals, shutdown_handler)
    )

    # Start the worker
    try:
        await worker.start()
    except KeyboardInterrupt:
        print("\nReceived keyboard interrupt")
        worker._shutdown()
    except Exception as e:
        print(f"\nFatal error: {e}")
        import traceback
        traceback.print_exc()
        worker._shutdown()
    finally:
        await shutdown_task
        sys.exit(0)


def _handle_signals(shutdown_handler):
    """Handle OS signals in a separate thread."""
    import threading

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    def sig_handler(sig, frame):
        print(f"\nReceived signal {sig} ({signal.name(sig)})")
        loop.call_soon_threadsafe(shutdown_handler)

    # Register signal handlers where supported
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            signal.signal(sig, sig_handler)
        except ValueError:
            # Signal type unsupported on this platform (Windows)
            pass

    loop.run_forever()


if __name__ == "__main__":
    asyncio.run(main())