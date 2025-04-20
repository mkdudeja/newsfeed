import { useMemo } from "react";
import MultiSelectDropdown from "../../shared/components/multi-select";
import { INewsFilters } from "../interface"

interface INewsFiltersProps {
    assets: string[];
    sources: string[];
    keywords: string[];
    filters: INewsFilters;
    setFilters: React.Dispatch<React.SetStateAction<INewsFilters>>;
}

const NewsFilters: React.FC<INewsFiltersProps> = ({ assets, sources, keywords, filters, setFilters }) => {
    const [selectedTags, selectedAssets, selecetdSources] = useMemo(() => [Array.from(filters.keywords), Array.from(filters.assets), Array.from(filters.sources)], [filters])

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MultiSelectDropdown
                label="Sources"
                options={sources}
                selected={selecetdSources}
                onChange={(updated) =>
                    setFilters({ ...filters, sources: new Set(updated) })
                }
            />

            <MultiSelectDropdown
                label="Keywords"
                options={keywords}
                selected={selectedTags}
                onChange={(updated) =>
                    setFilters({ ...filters, keywords: new Set(updated) })
                }
            />

            <MultiSelectDropdown
                label="Assets"
                options={assets}
                selected={selectedAssets}
                onChange={(updated) =>
                    setFilters({ ...filters, assets: new Set(updated) })
                }
            />
        </div>
    );
}

export default NewsFilters;