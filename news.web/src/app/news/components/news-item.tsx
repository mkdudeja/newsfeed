import { INews } from "../interface"

interface INewsItemProps {
    news: INews;
    style: React.CSSProperties;
    logToConsole: (news: INews) => void;
}

const NewsItem: React.FC<INewsItemProps> = ({ news, style, logToConsole }) => {
    const formattedDate = new Date(news.timestamp).toLocaleString();

    return (
        <div style={style} className="p-4 bg-white shadow border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">{news.source}</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                {news.link ? (
                    <a
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:underline overflow-hidden whitespace-nowrap text-ellipsis"
                    >
                        {news.headline}
                    </a>
                ) : (
                    <span className="block overflow-hidden whitespace-nowrap text-ellipsis">
                        {news.headline}
                    </span>
                )}
            </h2>

            <div className="flex justify-between">
                {/* Display keywords if they exist */}
                {news.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {news.keywords.map((keyword) => (
                            <span key={keyword} className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                {keyword}
                            </span>
                        ))}
                    </div>
                )}

                {/* Display assets if they exist */}
                {news.assets.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {news.assets.map((asset) => (
                            <span key={asset} className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {asset}
                            </span>
                        ))}
                    </div>
                )}
            </div>


            <div className="flex justify-between items-end mt-4">
                {/* Log Button */}
                <button
                    onClick={() => logToConsole(news)}
                    className="px-4 py-2 text-sm font-medium bg-gray-800 text-white rounded hover:bg-gray-700 transition"
                >
                    Log Item
                </button>

                {/* Display the timestamp in local date format */}
                <span className="text-xs text-gray-500 mt-2">{formattedDate}</span>
            </div>

        </div>
    );
}

export default NewsItem;