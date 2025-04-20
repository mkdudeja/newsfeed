import { FixedSizeList as List } from 'react-window';
import Spinner from '../shared/components/spinner';
import NewsFilters from './components/news-filters';
import NewsHeader from './components/news-header';
import NewsItem from './components/news-item';
import useNewsController from "./controller";

const News: React.FC = () => {
    const { rowData, newsHeight, sources, assets, keywords, filters, readyState, setFilters, logToConsole } = useNewsController();

    const renderNews = () => {
        if (!Array.isArray(rowData)) {
            return <Spinner />
        }

        if (!rowData.length) {
            return (
                <div className='flex justify-center text-md text-red-600'>
                    No news found. Please check the filter criteria, if any.
                </div>
            )
        }

        return (
            <List
                height={newsHeight}
                itemCount={rowData.length}
                itemSize={180}
                width="100%"
            >
                {({ index, style }: { index: number; style: React.CSSProperties }) => {
                    return (
                        <NewsItem news={rowData[index]} style={style} logToConsole={logToConsole} />
                    );
                }}
            </List>
        )
    };

    return (
        <div className='flex flex-col h-full space-y-4'>
            <NewsHeader readyState={readyState} />
            <div className='flex flex-col flex-1 space-y-4 px-4'>
                <NewsFilters keywords={keywords} assets={assets} sources={sources} filters={filters} setFilters={setFilters} />
                <div className="overflow-hidden flex-1">
                    {renderNews()}
                </div>
            </div>
        </div>
    )
}

export default News;