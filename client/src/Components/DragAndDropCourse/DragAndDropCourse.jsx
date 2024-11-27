import React, { useState, useEffect, useRef } from "react";
import Subject from "./Subject";

// Utility function for class names
const cn = (...classes) => classes.filter(Boolean).join(" ");

// Custom MultiSelect Component
const MultiSelect = ({
  label,
  value = [],
  onChange,
  options,
  placeholder,
  isSingleSelect = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    if (isSingleSelect) {
      // If single-select, set only the selected option
      onChange([option]);
    } else {
      // Default multi-select behavior
      const newValue = value.includes(option)
        ? value.filter((item) => item !== option)
        : [...value, option];
      onChange(newValue);
    }
  };

  const handleSelectAll = () => {
    if (!isSingleSelect) {
      onChange(value.length === options.length ? [] : [...options]);
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative w-full bg-white rounded-lg pl-3 pr-10 py-2 text-left",
          "border border-gray-300 focus:outline-none focus:ring-2",
          "focus:ring-blue-500 focus:border-blue-500",
          "cursor-pointer text-sm min-h-[40px]"
        )}>
        {value.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <span className="text-gray-900">
            {value.length === 1 ? value[0] : `${value.length} selected`}
          </span>
        )}
        <span className="absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className={cn(
              "h-5 w-5 text-gray-400 transition-transform duration-200",
              isOpen ? "transform rotate-180" : ""
            )}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {!isSingleSelect && (
              <button
                onClick={handleSelectAll}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 border-b border-gray-200">
                {value.length === options.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}
            {options.map((option, index) => (
              <div
                key={index}
                className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => toggleOption(option)}>
                <input
                  type="checkbox"
                  checked={value.includes(option)}
                  onChange={() => {}}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  disabled={isSingleSelect}
                />
                <span className="ml-3 text-sm text-gray-700">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((selected, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selected}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(selected);
                }}
                className="ml-1.5 inline-flex items-center justify-center flex-shrink-0 h-4 w-4 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-900 focus:outline-none">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Custom Button Component
const Button = ({ children, onClick, className = "", isFullWidth = false }) => (
  <button
    onClick={onClick}
    className={cn(
      "bg-blue-600 text-white rounded-lg px-4 py-2",
      "hover:bg-blue-700 focus:outline-none focus:ring-2",
      "focus:ring-blue-500 focus:ring-offset-2",
      "transition-colors duration-200",
      isFullWidth ? "w-full" : "",
      className
    )}>
    {children}
  </button>
);

// Custom Alert Component
const Alert = ({ message, type = "error" }) => {
  const textColor = type === "error" ? "text-red-700" : "text-blue-700";

  return message ? <div className={cn("p-4", textColor)}>{message}</div> : null;
};

// Main Component

const DragAndDropCourses = () => {
  const [enumValues, setEnumValues] = useState(null);
  const [filters, setFilters] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSubject, setShowSubject] = useState(false); // New state to toggle views

  useEffect(() => {
    fetchEnumValues();
  }, []);

  const fetchEnumValues = async () => {
    try {
      setIsLoading(true);
      const jwtToken = localStorage.getItem("jwtToken");
      const response = await fetch(
        "http://localhost:4000/api/courses/enum-values",
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch enum values");
      }

      const data = await response.json();
      const values = data.values;

      const initialFilters = Object.keys(values).reduce((acc, key) => {
        acc[key] = [];
        return acc;
      }, {});

      setEnumValues(values);
      setFilters(initialFilters);
    } catch (error) {
      setError("Failed to load filter options. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError("");
  };

  const handleReset = () => {
    const resetFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {});
    setFilters(resetFilters);
    setCourses([]);
    setError("");
  };

  const handleSearch = async () => {
    const isAnyFilterSelected = Object.values(filters).some(
      (value) => value.length > 0
    );

    if (!isAnyFilterSelected) {
      setError("Please select at least one filter option.");

      return;
    }

    try {
      setIsSearching(true);
      setError("");

      const requestBody = Object.entries(filters).reduce(
        (acc, [key, value]) => {
          if (value.length > 0) {
            acc[key] = value;
          }
          return acc;
        },
        {}
      );

      const jwtToken = localStorage.getItem("jwtToken");
      const response = await fetch(
        "http://localhost:4000/api/courses/filter-courses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch filtered courses");
      }

      const data = await response.json();
      setCourses(data.values);
      setShowSubject(true); // Show Subject component after search
    } catch (error) {
      setError("Failed to fetch courses. Please try again.");
      console.error("Error fetching filtered courses:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleBack = () => {
    setShowSubject(false); // Show filter UI when going back
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showSubject) {
    return <Subject courses={courses} onBack={handleBack} filters={filters} />;
  }

  return (
    <div className="max-w-[56rem] mx-auto p-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-8 overflow-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Course Filter</h2>
            <p className="mt-1 text-gray-600">
              Select multiple criteria to filter available courses
            </p>
          </div>

          <div className="space-y-6">
            {enumValues &&
              Object.keys(enumValues).map((topic) => (
                <MultiSelect
                  key={topic}
                  label={topic.charAt(0).toUpperCase() + topic.slice(1)}
                  value={filters[topic]}
                  onChange={(value) => handleFilterChange(topic, value)}
                  options={enumValues[topic]}
                  placeholder={`Select ${topic}`}
                  isSingleSelect={topic === "semester"}
                />
              ))}

            {error && <Alert message={error} type="error" />}

            <div className="flex gap-4">
              <Button
                onClick={handleSearch}
                isFullWidth
                className={isSearching ? "opacity-70 cursor-not-allowed" : ""}
                disabled={isSearching}>
                {isSearching ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Searching...
                  </span>
                ) : (
                  "Search Courses"
                )}
              </Button>
              <Button
                onClick={handleReset}
                className="bg-gray-500 hover:bg-gray-600"
                isFullWidth
                disabled={isSearching}>
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DragAndDropCourses;
