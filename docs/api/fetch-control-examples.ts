import React from 'react';
import { 
  useFilterPilot, 
  useFetchControl,
  useRequiredFilters,
  useDependentFilters,
  useFilterCombinations
} from 'react-filter-pilot';
import type { FetchControlConfig } from 'react-filter-pilot';

// Example 1: Basic Required Filters
interface BasicFilters {
  search: string;
  category: string;
}

export function BasicRequiredFiltersExample() {
  const { filters, setFilterValue, data, isLoading, fetchControl } = useFilterPilot<any, BasicFilters>({
    filterConfigs: [
      { name: 'search', defaultValue: '' },
      { name: 'category', defaultValue: '' },
    ],
    fetchControl: {
      // Only fetch when both search and category have values
      requiredFilters: ['search', 'category'],
      onFetchSkipped: (reason) => {
        console.log('Fetch skipped:', reason);
      },
    },
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // This will only run when requirements are met
        const response = await fetch(`/api/search?q=${filters.search}&cat=${filters.category}`);
        return response.json();
      },
    },
  });

  return (
    <div>
      <input
        placeholder="Search (required)"
        value={filters.search}
        onChange={(e) => setFilterValue('search', e.target.value)}
      />
      
      <select
        value={filters.category}
        onChange={(e) => setFilterValue('category', e.target.value)}
      >
        <option value="">Select category (required)</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
      </select>
      
      {!fetchControl?.isEnabled && (
        <p style={{ color: 'orange' }}>
          ⚠️ {fetchControl?.reason}
        </p>
      )}
      
      {data && <div>Results: {data.length} items</div>}
    </div>
  );
}

// Example 2: Conditional Requirements
interface ConditionalFilters {
  searchType: 'text' | 'image' | 'video';
  textQuery: string;
  imageFile: File | null;
  videoUrl: string;
}

export function ConditionalRequirementsExample() {
  const fetchControl: FetchControlConfig<ConditionalFilters> = {
    conditionalRequirements: [
      {
        when: (filters) => filters.searchType === 'text',
        require: ['textQuery'],
        message: 'Text query is required for text search',
      },
      {
        when: (filters) => filters.searchType === 'image',
        require: ['imageFile'],
        message: 'Please upload an image for image search',
      },
      {
        when: (filters) => filters.searchType === 'video',
        require: ['videoUrl'],
        message: 'Video URL is required for video search',
      },
    ],
  };

  const { filters, setFilterValue, fetchControl: fc } = useFilterPilot<any, ConditionalFilters>({
    filterConfigs: [
      { name: 'searchType', defaultValue: 'text' },
      { name: 'textQuery', defaultValue: '' },
      { name: 'imageFile', defaultValue: null },
      { name: 'videoUrl', defaultValue: '' },
    ],
    fetchControl,
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // Different API endpoints based on search type
        switch (filters.searchType) {
          case 'text':
            return fetch(`/api/search/text?q=${filters.textQuery}`).then(r => r.json());
          case 'image':
            const formData = new FormData();
            formData.append('image', filters.imageFile!);
            return fetch('/api/search/image', { method: 'POST', body: formData }).then(r => r.json());
          case 'video':
            return fetch(`/api/search/video?url=${filters.videoUrl}`).then(r => r.json());
        }
      },
    },
  });

  return (
    <div>
      <select
        value={filters.searchType}
        onChange={(e) => setFilterValue('searchType', e.target.value as any)}
      >
        <option value="text">Text Search</option>
        <option value="image">Image Search</option>
        <option value="video">Video Search</option>
      </select>
      
      {filters.searchType === 'text' && (
        <input
          placeholder="Enter search text"
          value={filters.textQuery}
          onChange={(e) => setFilterValue('textQuery', e.target.value)}
        />
      )}
      
      {filters.searchType === 'image' && (
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFilterValue('imageFile', e.target.files?.[0] || null)}
        />
      )}
      
      {filters.searchType === 'video' && (
        <input
          placeholder="Enter video URL"
          value={filters.videoUrl}
          onChange={(e) => setFilterValue('videoUrl', e.target.value)}
        />
      )}
      
      {!fc?.isEnabled && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {fc?.reason}
        </div>
      )}
    </div>
  );
}

// Example 3: Minimum Values & Custom Validation
interface ValidationFilters {
  query: string;
  minPrice: number;
  maxPrice: number;
  tags: string[];
}

export function ValidationExample() {
  const { filters, setFilterValue, fetchControl } = useFilterPilot<any, ValidationFilters>({
    filterConfigs: [
      { name: 'query', defaultValue: '' },
      { name: 'minPrice', defaultValue: 0 },
      { name: 'maxPrice', defaultValue: 1000 },
      { name: 'tags', defaultValue: [] },
    ],
    fetchControl: {
      // Minimum string length
      minimumValues: {
        query: 3, // At least 3 characters
      },
      
      // Custom validation
      validate: (filters) => {
        if (filters.minPrice >= filters.maxPrice) {
          return { 
            valid: false, 
            message: 'Minimum price must be less than maximum price' 
          };
        }
        
        if (filters.tags.length > 5) {
          return { 
            valid: false, 
            message: 'Maximum 5 tags allowed' 
          };
        }
        
        return { valid: true };
      },
    },
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // API call
        return { data: [], totalRecords: 0 };
      },
    },
  });

  return (
    <div>
      <input
        placeholder="Search (min 3 characters)"
        value={filters.query}
        onChange={(e) => setFilterValue('query', e.target.value)}
      />
      
      <input
        type="number"
        placeholder="Min price"
        value={filters.minPrice}
        onChange={(e) => setFilterValue('minPrice', Number(e.target.value))}
      />
      
      <input
        type="number"
        placeholder="Max price"
        value={filters.maxPrice}
        onChange={(e) => setFilterValue('maxPrice', Number(e.target.value))}
      />
      
      {!fetchControl?.isEnabled && (
        <p style={{ color: 'red' }}>
          {fetchControl?.reason}
        </p>
      )}
    </div>
  );
}

// Example 4: Using Helper Hooks
interface ComplexFilters {
  country: string;
  state: string;
  city: string;
  postalCode: string;
  searchMethod: 'quick' | 'advanced';
  advancedOptions: {
    includeNearby: boolean;
    radius: number;
  };
}

export function HelperHooksExample() {
  const { filters, setFilterValue, data } = useFilterPilot<any, ComplexFilters>({
    filterConfigs: [
      { name: 'country', defaultValue: '' },
      { name: 'state', defaultValue: '' },
      { name: 'city', defaultValue: '' },
      { name: 'postalCode', defaultValue: '' },
      { name: 'searchMethod', defaultValue: 'quick' },
      { name: 'advancedOptions', defaultValue: { includeNearby: false, radius: 10 } },
    ],
    fetchConfig: {
      fetchFn: async () => ({ data: [], totalRecords: 0 }),
    },
  });

  // Use helper hooks
  const requiredCheck = useRequiredFilters(filters, ['country']);
  
  const dependentCheck = useDependentFilters(filters, [
    { if: 'country', then: 'state' },
    { if: 'state', then: 'city' },
    { if: 'searchMethod', equals: 'advanced', then: ['advancedOptions'] },
  ]);
  
  const combinationCheck = useFilterCombinations(filters, [
    {
      filters: ['city', 'postalCode'],
      condition: 'none',
      message: 'Please use either city OR postal code, not both',
    },
  ]);

  const canFetch = requiredCheck.isValid && 
                   dependentCheck.isValid && 
                   combinationCheck.isValid;

  return (
    <div>
      <select
        value={filters.country}
        onChange={(e) => setFilterValue('country', e.target.value)}
      >
        <option value="">Select Country</option>
        <option value="US">United States</option>
        <option value="CA">Canada</option>
      </select>
      
      {filters.country && (
        <select
          value={filters.state}
          onChange={(e) => setFilterValue('state', e.target.value)}
        >
          <option value="">Select State</option>
          {/* Load states based on country */}
        </select>
      )}
      
      {filters.state && (
        <input
          placeholder="City"
          value={filters.city}
          onChange={(e) => setFilterValue('city', e.target.value)}
        />
      )}
      
      <input
        placeholder="OR Postal Code"
        value={filters.postalCode}
        onChange={(e) => setFilterValue('postalCode', e.target.value)}
      />
      
      <div style={{ marginTop: '20px' }}>
        {!requiredCheck.isValid && (
          <p style={{ color: 'red' }}>{requiredCheck.message}</p>
        )}
        
        {dependentCheck.errors.map((error, i) => (
          <p key={i} style={{ color: 'orange' }}>{error}</p>
        ))}
        
        {combinationCheck.errors.map((error, i) => (
          <p key={i} style={{ color: 'red' }}>{error}</p>
        ))}
        
        <button disabled={!canFetch}>
          Search {!canFetch && '(Fix errors first)'}
        </button>
      </div>
    </div>
  );
}

// Example 5: Dynamic Fetch Control
export function DynamicFetchControlExample() {
  const [searchMode, setSearchMode] = React.useState<'simple' | 'advanced'>('simple');
  
  const { filters, setFilterValue, fetchControl } = useFilterPilot<any, any>({
    filterConfigs: [
      { name: 'query', defaultValue: '' },
      { name: 'filters', defaultValue: {} },
    ],
    fetchControl: {
      // Dynamic requirements based on mode
      enabled: (filters) => {
        if (searchMode === 'simple') {
          return filters.query.length >= 2;
        } else {
          return Object.keys(filters.filters).length >= 3;
        }
      },
      
      onFetchStart: (filters) => {
        console.log('Starting fetch with filters:', filters);
      },
      
      onFetchEnd: (result) => {
        console.log('Fetch completed, found:', result.totalRecords, 'records');
      },
      
      onFetchError: (error, filters) => {
        console.error('Fetch failed:', error);
        // Could show toast notification here
      },
    },
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // Different endpoints for different modes
        const endpoint = searchMode === 'simple' 
          ? `/api/search/simple?q=${filters.query}`
          : `/api/search/advanced`;
          
        return fetch(endpoint, {
          method: searchMode === 'advanced' ? 'POST' : 'GET',
          body: searchMode === 'advanced' ? JSON.stringify(filters.filters) : undefined,
        }).then(r => r.json());
      },
    },
  });

  return (
    <div>
      <div>
        <label>
          <input
            type="radio"
            checked={searchMode === 'simple'}
            onChange={() => setSearchMode('simple')}
          />
          Simple Search
        </label>
        <label>
          <input
            type="radio"
            checked={searchMode === 'advanced'}
            onChange={() => setSearchMode('advanced')}
          />
          Advanced Search
        </label>
      </div>
      
      {searchMode === 'simple' ? (
        <input
          placeholder="Search (min 2 chars)"
          value={filters.query}
          onChange={(e) => setFilterValue('query', e.target.value)}
        />
      ) : (
        <div>
          <p>Add at least 3 filters to search</p>
          {/* Advanced filter UI */}
        </div>
      )}
      
      <div>
        Fetch status: {fetchControl?.isEnabled ? '✅ Ready' : `❌ ${fetchControl?.reason}`}
      </div>
    </div>
  );
}