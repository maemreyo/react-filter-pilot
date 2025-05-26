# Fetch Control Guide

## Overview

Fetch control allows you to precisely manage when and how data fetching occurs in react-filter-pilot. This is useful for:

- Requiring certain filters before fetching
- Preventing unnecessary API calls
- Implementing complex validation rules
- Showing helpful messages to users
- Handling dependent filters

## Basic Usage

### 1. Required Filters

Only fetch when specific filters have values:

```typescript
const { data, fetchControl } = useFilterPilot({
  fetchControl: {
    requiredFilters: ['search', 'category'],
  },
  // ... other config
});

// Check fetch status
if (!fetchControl.isEnabled) {
  console.log(fetchControl.reason); // "Required filter 'search' is missing"
}
```

### 2. Conditional Requirements

Different requirements based on filter values:

```typescript
fetchControl: {
  conditionalRequirements: [
    {
      when: (filters) => filters.searchType === 'location',
      require: ['latitude', 'longitude'],
      message: 'Location coordinates are required for location search',
    },
    {
      when: (filters) => filters.priceFilter === true,
      require: ['minPrice', 'maxPrice'],
    },
  ],
}
```

### 3. Minimum Values

Ensure minimum lengths or values:

```typescript
fetchControl: {
  minimumValues: {
    searchQuery: 3,    // String must be at least 3 characters
    radius: 1,         // Number must be at least 1
  },
}
```

### 4. Custom Validation

Implement complex validation logic:

```typescript
fetchControl: {
  validate: (filters) => {
    // Check price range
    if (filters.minPrice >= filters.maxPrice) {
      return { 
        valid: false, 
        message: 'Max price must be greater than min price' 
      };
    }
    
    // Check date range
    if (filters.startDate > filters.endDate) {
      return { 
        valid: false, 
        message: 'End date must be after start date' 
      };
    }
    
    return { valid: true };
  },
}
```

## Helper Hooks

### useRequiredFilters

Check if required filters are present:

```typescript
const requiredCheck = useRequiredFilters(filters, ['country', 'city']);

if (!requiredCheck.isValid) {
  console.log(requiredCheck.missing); // ['city']
  console.log(requiredCheck.message); // "Missing required filters: city"
}
```

### useDependentFilters

Handle filter dependencies:

```typescript
const deps = useDependentFilters(filters, [
  { if: 'country', then: 'state' },
  { if: 'state', then: 'city' },
  { if: 'advanced', equals: true, then: ['radius', 'includeNearby'] },
]);

if (!deps.isValid) {
  console.log(deps.errors);
  // ["When 'country' is set, 'state' is required"]
}
```

### useFilterCombinations

Enforce rules about filter combinations:

```typescript
const combos = useFilterCombinations(filters, [
  {
    filters: ['quickSearch', 'advancedFilters'],
    condition: 'none',
    message: 'Cannot use quick search with advanced filters',
  },
  {
    filters: ['latitude', 'longitude'],
    condition: 'all',
    message: 'Both latitude and longitude are required',
  },
]);
```

## Lifecycle Hooks

### onFetchStart

Called before fetch begins:

```typescript
fetchControl: {
  onFetchStart: (filters) => {
    console.log('Fetching with:', filters);
    setLoadingMessage('Searching...');
  },
}
```

### onFetchEnd

Called after successful fetch:

```typescript
fetchControl: {
  onFetchEnd: (result) => {
    console.log(`Found ${result.totalRecords} items`);
    if (result.totalRecords === 0) {
      showNoResultsMessage();
    }
  },
}
```

### onFetchError

Handle fetch errors:

```typescript
fetchControl: {
  onFetchError: (error, filters) => {
    if (error.message.includes('rate limit')) {
      showRateLimitWarning();
    } else {
      showGenericError();
    }
  },
}
```

### onFetchSkipped

Called when fetch is prevented:

```typescript
fetchControl: {
  onFetchSkipped: (reason, filters) => {
    setUserMessage(reason);
    logAnalytics('fetch_skipped', { reason, filters });
  },
}
```

## Advanced Patterns

### Dynamic Fetch Control

Change requirements based on application state:

```typescript
const [userLevel, setUserLevel] = useState('basic');

const fetchControl = {
  enabled: (filters) => {
    if (userLevel === 'basic') {
      // Basic users need more filters
      return filters.category && filters.priceRange;
    } else {
      // Premium users can search with less
      return true;
    }
  },
};
```

### Async Validation

For validation that requires API calls:

```typescript
const [isLocationValid, setLocationValid] = useState(true);

// Validate location with geocoding API
useEffect(() => {
  if (filters.address) {
    validateAddress(filters.address).then(setLocationValid);
  }
}, [filters.address]);

const fetchControl = {
  enabled: isLocationValid,
  validate: (filters) => {
    if (!isLocationValid) {
      return { 
        valid: false, 
        message: 'Please enter a valid address' 
      };
    }
    return { valid: true };
  },
};
```

### Combining Multiple Checks

```typescript
// Use all helper hooks together
const required = useRequiredFilters(filters, ['query']);
const deps = useDependentFilters