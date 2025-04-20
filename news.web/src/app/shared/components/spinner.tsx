import React from 'react';

const Spinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center p-4">
            <div className="w-5 h-5 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
            <span className="ml-2 text-sm text-gray-600">Loading...</span>
        </div>
    );
};

export default Spinner;
