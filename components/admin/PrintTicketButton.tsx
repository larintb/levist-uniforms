"use client";

import React from 'react';

export function PrintTicketButton() {
    return (
        <button
            onClick={() => window.print()}
            className="px-4 py-2 h-10 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
            Imprimir Ticket
        </button>
    );
}