'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-white">
            <h2 className="text-2xl font-bold mb-4 text-red-500">Something went wrong!</h2>
            <p className="mb-6 text-gray-400">We apologize for the inconvenience.</p>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
                Try again
            </button>
        </div>
    );
}
