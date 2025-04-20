import { useEffect, useRef, useState } from "react";

interface MultiSelectDropdownProps<T> {
    label: string;
    options: T[];
    selected: T[];
    onChange: (updatedSelected: T[]) => void;
}

const MultiSelectDropdown = <T extends string>({
    label,
    options,
    selected,
    onChange,
}: MultiSelectDropdownProps<T>) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleOption = (option: T) => {
        const updated = selected.includes(option)
            ? selected.filter((item) => item !== option)
            : [...selected, option];

        onChange(updated);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full text-sm" ref={dropdownRef}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>

            <div
                className="w-full border border-gray-300 rounded px-3 py-1.5 bg-white cursor-pointer hover:border-gray-400 transition"
                onClick={() => setIsOpen((prev) => !prev)}
            >
                <span className="text-gray-800 truncate block">
                    {selected.length > 0 ? `${selected.length} selected` : "Select..."}
                </span>
            </div>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-200 rounded shadow-sm">
                    {options.map((option) => (
                        <label
                            key={option}
                            className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                onChange={() => toggleOption(option)}
                                className="mr-2 accent-blue-500"
                            />
                            <span className="truncate">{option}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
