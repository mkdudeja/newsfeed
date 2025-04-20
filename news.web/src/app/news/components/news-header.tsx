import React from 'react';
import { IWSReadyState } from '../../shared/interfaces';
import { ReadyState } from '../../../library/reconnecting-websocket';

interface NewsHeaderProps {
    readyState: IWSReadyState;
}

// functioin to generate connection styles based on `state`
const getStateStyles = (state: ReadyState) => {
    switch (state) {
        case ReadyState.Connecting:
            return {
                color: 'bg-yellow-500',
                text: 'text-yellow-500',
                label: 'Connecting',
            };
        case ReadyState.Connected:
            return {
                color: 'bg-green-500',
                text: 'text-green-500',
                label: 'Connected',
            };
        case ReadyState.Closing:
            return {
                color: 'bg-orange-500',
                text: 'text-orange-500',
                label: 'Closing',
            };
        case ReadyState.Closed:
            return {
                color: 'bg-red-500',
                text: 'text-red-500',
                label: 'Closed',
            };
        case ReadyState.Muted:
            return {
                color: 'bg-gray-500',
                text: 'text-gray-500',
                label: 'Muted',
            };
        case ReadyState.Idle:
            return {
                color: 'bg-blue-500',
                text: 'text-blue-500',
                label: 'Idle',
            };
        default:
            return {
                color: 'bg-gray-500',
                text: 'text-gray-500',
                label: 'Unknown',
            };
    }
};

const NewsHeader: React.FC<NewsHeaderProps> = ({ readyState }) => {
    const { color, text, label } = getStateStyles(readyState?.state);

    return (
        <header className="flex justify-between items-center p-4 bg-white shadow-md">
            <h1 className="text-2xl font-semibold text-gray-800">News</h1>

            <div className="flex items-center space-x-2">
                <span
                    className={`w-3 h-3 rounded-full ${color}`}
                ></span>
                <span className={`text-sm ${text}`}>{label}</span>
            </div>
        </header>
    );
};

export default NewsHeader;
