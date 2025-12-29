import React from 'react';
import { parseMarkdown } from './markdown';

interface PlanToolRendererProps {
    plan: string;
    onApprove: () => void;
    onReject: () => void;
    isApproved?: boolean;
    isRejected?: boolean;
}

export const PlanToolRenderer: React.FC<PlanToolRendererProps> = ({
    plan,
    onApprove,
    onReject,
    isApproved = false,
    isRejected = false
}) => {
    return (
        <div className="plan-tool-container p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 my-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Implementation Plan
                </h3>
                {isApproved && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approved
                    </span>
                )}
                {isRejected && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                        Rejected
                    </span>
                )}
            </div>

            <div
                className="plan-content prose dark:prose-invert max-w-none text-sm mb-6 bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(plan) }}
            />

            {!isApproved && !isRejected && (
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onReject}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        Reject / Refine
                    </button>
                    <button
                        onClick={onApprove}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve & Execute Plan
                    </button>
                </div>
            )}

            {isApproved && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Executing changes autonomously...
                </div>
            )}
        </div>
    );
};
