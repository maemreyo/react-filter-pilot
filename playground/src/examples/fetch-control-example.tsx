import React, { useState } from 'react';
import { 
  useFilterPilot, 
  useRequiredFilters,
  useDependentFilters,
  useFilterCombinations
} from 'react-filter-pilot';
import { Box, Card, Text, TextInput, Select, Button, Group, NumberInput, Checkbox, Divider, Alert, Badge, Stack, ActionIcon } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconX } from '@tabler/icons-react';

// Các loại filter khác nhau để demo
interface SearchFilters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
}

interface ConditionalFilters {
  searchType: 'text' | 'image' | 'video';
  textQuery: string;
  imageFile: File | null;
  videoUrl: string;
}

interface ValidationFilters {
  query: string;
  minPrice: number;
  maxPrice: number;
  tags: string[];
}

interface LocationFilters {
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

// Component hiển thị trạng thái fetch
const FetchStatus = ({ isEnabled, reason }: { isEnabled?: boolean; reason?: string }) => {
  if (isEnabled) {
    return (
      <Alert icon={<IconCheck size="1rem" />} color="green" title="Fetch được kích hoạt">
        API sẽ được gọi với các filter hiện tại
      </Alert>
    );
  }
  
  return (
    <Alert icon={<IconAlertCircle size="1rem" />} color="orange" title="Fetch bị vô hiệu hóa">
      {reason || 'Không đủ điều kiện để fetch dữ liệu'}
    </Alert>
  );
};

// Ví dụ 1: Basic Required Filters
export function BasicRequiredFiltersExample() {
  const { filters, setFilterValue, data, isLoading, fetchControl } = useFilterPilot<any, SearchFilters>({
    filterConfigs: [
      { name: 'search', defaultValue: '' },
      { name: 'category', defaultValue: '' },
      { name: 'minPrice', defaultValue: 0 },
      { name: 'maxPrice', defaultValue: 1000 },
    ],
    fetchControl: {
      // Chỉ fetch khi cả search và category có giá trị
      requiredFilters: ['search', 'category'],
      onFetchSkipped: (reason) => {
        console.log('Fetch skipped:', reason);
      },
    },
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          data: [
            { id: 1, name: 'Product 1', price: 100 },
            { id: 2, name: 'Product 2', price: 200 },
          ],
          totalRecords: 2
        };
      },
    },
  });

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} size="lg" mb="md">Ví dụ 1: Required Filters</Text>
      
      <Stack spacing="md">
        <TextInput
          label="Tìm kiếm (bắt buộc)"
          placeholder="Nhập từ khóa tìm kiếm"
          value={filters.search}
          onChange={(e) => setFilterValue('search', e.target.value)}
        />
        
        <Select
          label="Danh mục (bắt buộc)"
          placeholder="Chọn danh mục"
          value={filters.category}
          onChange={(value) => setFilterValue('category', value || '')}
          data={[
            { value: 'electronics', label: 'Điện tử' },
            { value: 'books', label: 'Sách' },
            { value: 'clothing', label: 'Quần áo' },
          ]}
        />
        
        <Group grow>
          <NumberInput
            label="Giá tối thiểu"
            value={filters.minPrice}
            onChange={(value) => setFilterValue('minPrice', value || 0)}
            min={0}
          />
          <NumberInput
            label="Giá tối đa"
            value={filters.maxPrice}
            onChange={(value) => setFilterValue('maxPrice', value || 1000)}
            min={0}
          />
        </Group>
        
        <Divider my="sm" />
        
        <FetchStatus isEnabled={fetchControl?.isEnabled} reason={fetchControl?.reason} />
        
        {isLoading ? (
          <Text>Đang tải...</Text>
        ) : data ? (
          <Box>
            <Text>Kết quả: {data.length} sản phẩm</Text>
          </Box>
        ) : null}
      </Stack>
    </Card>
  );
}

// Ví dụ 2: Conditional Requirements
export function ConditionalRequirementsExample() {
  const { filters, setFilterValue, fetchControl } = useFilterPilot<any, ConditionalFilters>({
    filterConfigs: [
      { name: 'searchType', defaultValue: 'text' },
      { name: 'textQuery', defaultValue: '' },
      { name: 'imageFile', defaultValue: null },
      { name: 'videoUrl', defaultValue: '' },
    ],
    fetchControl: {
      conditionalRequirements: [
        {
          when: (filters) => filters.searchType === 'text',
          require: ['textQuery'],
          message: 'Cần nhập từ khóa tìm kiếm cho tìm kiếm văn bản',
        },
        {
          when: (filters) => filters.searchType === 'image',
          require: ['imageFile'],
          message: 'Vui lòng tải lên một hình ảnh để tìm kiếm',
        },
        {
          when: (filters) => filters.searchType === 'video',
          require: ['videoUrl'],
          message: 'URL video là bắt buộc cho tìm kiếm video',
        },
      ],
    },
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          data: [],
          totalRecords: 0
        };
      },
    },
  });

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} size="lg" mb="md">Ví dụ 2: Conditional Requirements</Text>
      
      <Stack spacing="md">
        <Select
          label="Loại tìm kiếm"
          value={filters.searchType}
          onChange={(value) => setFilterValue('searchType', value as any)}
          data={[
            { value: 'text', label: 'Tìm kiếm văn bản' },
            { value: 'image', label: 'Tìm kiếm hình ảnh' },
            { value: 'video', label: 'Tìm kiếm video' },
          ]}
        />
        
        {filters.searchType === 'text' && (
          <TextInput
            label="Từ khóa tìm kiếm"
            placeholder="Nhập từ khóa tìm kiếm"
            value={filters.textQuery}
            onChange={(e) => setFilterValue('textQuery', e.target.value)}
          />
        )}
        
        {filters.searchType === 'image' && (
          <Box>
            <Text size="sm" mb={5}>Tải lên hình ảnh</Text>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFilterValue('imageFile', e.target.files?.[0] || null)}
            />
          </Box>
        )}
        
        {filters.searchType === 'video' && (
          <TextInput
            label="URL Video"
            placeholder="Nhập URL video"
            value={filters.videoUrl}
            onChange={(e) => setFilterValue('videoUrl', e.target.value)}
          />
        )}
        
        <Divider my="sm" />
        
        <FetchStatus isEnabled={fetchControl?.isEnabled} reason={fetchControl?.reason} />
      </Stack>
    </Card>
  );
}

// Ví dụ 3: Minimum Values & Custom Validation
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
        query: 3, // Ít nhất 3 ký tự
      },
      
      // Custom validation
      validate: (filters) => {
        if (filters.minPrice >= filters.maxPrice) {
          return { 
            valid: false, 
            message: 'Giá tối thiểu phải nhỏ hơn giá tối đa' 
          };
        }
        
        if (filters.tags.length > 5) {
          return { 
            valid: false, 
            message: 'Tối đa 5 thẻ được phép' 
          };
        }
        
        return { valid: true };
      },
    },
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          data: [],
          totalRecords: 0
        };
      },
    },
  });

  // Giả lập thêm tag
  const [tagInput, setTagInput] = useState('');
  const addTag = () => {
    if (tagInput && !filters.tags.includes(tagInput)) {
      setFilterValue('tags', [...filters.tags, tagInput]);
      setTagInput('');
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} size="lg" mb="md">Ví dụ 3: Minimum Values & Custom Validation</Text>
      
      <Stack spacing="md">
        <TextInput
          label="Từ khóa tìm kiếm (ít nhất 3 ký tự)"
          placeholder="Nhập từ khóa tìm kiếm"
          value={filters.query}
          onChange={(e) => setFilterValue('query', e.target.value)}
        />
        
        <Group grow>
          <NumberInput
            label="Giá tối thiểu"
            value={filters.minPrice}
            onChange={(value) => setFilterValue('minPrice', value || 0)}
            min={0}
          />
          <NumberInput
            label="Giá tối đa"
            value={filters.maxPrice}
            onChange={(value) => setFilterValue('maxPrice', value || 1000)}
            min={0}
          />
        </Group>
        
        <Box>
          <Text size="sm" mb={5}>Thẻ (tối đa 5)</Text>
          <Group spacing="xs" mb="xs">
            {filters.tags.map((tag, index) => (
              <Badge 
                key={index} 
                color="blue"
                rightSection={
                  <ActionIcon 
                    size="xs" 
                    color="blue" 
                    radius="xl" 
                    variant="transparent"
                    onClick={() => setFilterValue('tags', filters.tags.filter((_, i) => i !== index))}
                  >
                    <IconX size="0.75rem" />
                  </ActionIcon>
                }
              >
                {tag}
              </Badge>
            ))}
          </Group>
          <Group>
            <TextInput
              placeholder="Thêm thẻ"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button onClick={addTag}>Thêm</Button>
          </Group>
        </Box>
        
        <Divider my="sm" />
        
        <FetchStatus isEnabled={fetchControl?.isEnabled} reason={fetchControl?.reason} />
      </Stack>
    </Card>
  );
}

// Ví dụ 4: Using Helper Hooks
export function HelperHooksExample() {
  const { filters, setFilterValue } = useFilterPilot<any, LocationFilters>({
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

  // Sử dụng các helper hooks
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
      message: 'Vui lòng sử dụng thành phố HOẶC mã bưu điện, không dùng cả hai',
    },
  ]);

  const canFetch = requiredCheck.isValid && 
                   dependentCheck.isValid && 
                   combinationCheck.isValid;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} size="lg" mb="md">Ví dụ 4: Helper Hooks</Text>
      
      <Stack spacing="md">
        <Select
          label="Quốc gia (bắt buộc)"
          placeholder="Chọn quốc gia"
          value={filters.country}
          onChange={(value) => setFilterValue('country', value || '')}
          data={[
            { value: 'US', label: 'Hoa Kỳ' },
            { value: 'CA', label: 'Canada' },
            { value: 'VN', label: 'Việt Nam' },
          ]}
        />
        
        {filters.country && (
          <Select
            label="Tiểu bang/Tỉnh"
            placeholder="Chọn tiểu bang/tỉnh"
            value={filters.state}
            onChange={(value) => setFilterValue('state', value || '')}
            data={[
              { value: 'CA', label: 'California' },
              { value: 'NY', label: 'New York' },
              { value: 'TX', label: 'Texas' },
            ]}
          />
        )}
        
        {filters.state && (
          <TextInput
            label="Thành phố"
            placeholder="Nhập tên thành phố"
            value={filters.city}
            onChange={(e) => setFilterValue('city', e.target.value)}
          />
        )}
        
        <TextInput
          label="HOẶC Mã bưu điện"
          placeholder="Nhập mã bưu điện"
          value={filters.postalCode}
          onChange={(e) => setFilterValue('postalCode', e.target.value)}
        />
        
        <Select
          label="Phương thức tìm kiếm"
          value={filters.searchMethod}
          onChange={(value) => setFilterValue('searchMethod', value as any)}
          data={[
            { value: 'quick', label: 'Tìm kiếm nhanh' },
            { value: 'advanced', label: 'Tìm kiếm nâng cao' },
          ]}
        />
        
        {filters.searchMethod === 'advanced' && (
          <Box>
            <Text size="sm" mb={5}>Tùy chọn nâng cao</Text>
            <Checkbox
              label="Bao gồm khu vực lân cận"
              checked={filters.advancedOptions.includeNearby}
              onChange={(e) => setFilterValue('advancedOptions', {
                ...filters.advancedOptions,
                includeNearby: e.currentTarget.checked
              })}
              mb="xs"
            />
            <NumberInput
              label="Bán kính (km)"
              value={filters.advancedOptions.radius}
              onChange={(value) => setFilterValue('advancedOptions', {
                ...filters.advancedOptions,
                radius: value || 10
              })}
              min={1}
              max={100}
            />
          </Box>
        )}
        
        <Divider my="sm" />
        
        <Box>
          <Text fw={500} mb="xs">Trạng thái validation:</Text>
          
          {!requiredCheck.isValid && (
            <Alert color="red" mb="xs">
              {requiredCheck.message}
            </Alert>
          )}
          
          {dependentCheck.errors.map((error, i) => (
            <Alert key={i} color="orange" mb="xs">
              {error}
            </Alert>
          ))}
          
          {combinationCheck.errors.map((error, i) => (
            <Alert key={i} color="red" mb="xs">
              {error}
            </Alert>
          ))}
          
          <Button disabled={!canFetch} mt="md">
            Tìm kiếm {!canFetch && '(Sửa lỗi trước)'}
          </Button>
        </Box>
      </Stack>
    </Card>
  );
}

// Ví dụ 5: Dynamic Fetch Control
export function DynamicFetchControlExample() {
  const [searchMode, setSearchMode] = useState<'simple' | 'advanced'>('simple');
  
  const { filters, setFilterValue, fetchControl } = useFilterPilot<any, any>({
    filterConfigs: [
      { name: 'query', defaultValue: '' },
      { name: 'filters', defaultValue: {} },
    ],
    fetchControl: {
      // Yêu cầu động dựa trên mode
      enabled: (filters) => {
        if (searchMode === 'simple') {
          return filters.query.length >= 2;
        } else {
          return Object.keys(filters.filters).length >= 3;
        }
      },
      
      onFetchStart: (filters) => {
        console.log('Bắt đầu fetch với filters:', filters);
      },
      
      onFetchEnd: (result) => {
        console.log('Fetch hoàn thành, tìm thấy:', result.totalRecords, 'bản ghi');
      },
      
      onFetchError: (error, filters) => {
        console.error('Fetch thất bại:', error);
      },
    },
    fetchConfig: {
      fetchFn: async ({ filters }) => {
        // Giả lập API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          data: [],
          totalRecords: 0
        };
      },
    },
  });

  // Giả lập thêm filter nâng cao
  const [filterKey, setFilterKey] = useState('');
  const [filterValue, setFilterValueState] = useState('');
  
  const addAdvancedFilter = () => {
    if (filterKey && filterValue) {
      setFilterValue('filters', {
        ...filters.filters,
        [filterKey]: filterValue
      });
      setFilterKey('');
      setFilterValueState('');
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Text fw={500} size="lg" mb="md">Ví dụ 5: Dynamic Fetch Control</Text>
      
      <Stack spacing="md">
        <Group>
          <Checkbox
            label="Tìm kiếm nâng cao"
            checked={searchMode === 'advanced'}
            onChange={(e) => setSearchMode(e.currentTarget.checked ? 'advanced' : 'simple')}
          />
        </Group>
        
        {searchMode === 'simple' ? (
          <TextInput
            label="Từ khóa tìm kiếm (ít nhất 2 ký tự)"
            placeholder="Nhập từ khóa tìm kiếm"
            value={filters.query}
            onChange={(e) => setFilterValue('query', e.target.value)}
          />
        ) : (
          <Box>
            <Text fw={500} mb="xs">Bộ lọc nâng cao (thêm ít nhất 3)</Text>
            
            {Object.entries(filters.filters).length > 0 ? (
              <Box mb="md">
                {Object.entries(filters.filters).map(([key, value], index) => (
                  <Group key={index} mb="xs">
                    <Badge>{key}: {value}</Badge>
                    <ActionIcon 
                      color="red" 
                      size="xs"
                      onClick={() => {
                        const newFilters = { ...filters.filters };
                        delete newFilters[key];
                        setFilterValue('filters', newFilters);
                      }}
                    >
                      <IconX size="0.75rem" />
                    </ActionIcon>
                  </Group>
                ))}
              </Box>
            ) : (
              <Text color="dimmed" mb="md">Chưa có bộ lọc nào được thêm</Text>
            )}
            
            <Group align="end">
              <TextInput
                label="Tên bộ lọc"
                placeholder="Ví dụ: color, size, brand"
                value={filterKey}
                onChange={(e) => setFilterKey(e.target.value)}
              />
              <TextInput
                label="Giá trị"
                placeholder="Ví dụ: red, large, nike"
                value={filterValue}
                onChange={(e) => setFilterValueState(e.target.value)}
              />
              <Button onClick={addAdvancedFilter}>Thêm</Button>
            </Group>
          </Box>
        )}
        
        <Divider my="sm" />
        
        <FetchStatus isEnabled={fetchControl?.isEnabled} reason={fetchControl?.reason} />
      </Stack>
    </Card>
  );
}

// Main component kết hợp tất cả các ví dụ
export function FetchControlExamples() {
  const [activeExample, setActiveExample] = useState<number>(1);

  return (
    <Box p="md">
      <Text fw={700} size="xl" mb="lg">Ví dụ về Fetch Control</Text>
      
      <Group mb="lg">
        {[1, 2, 3, 4, 5].map((num) => (
          <Button
            key={num}
            variant={activeExample === num ? 'filled' : 'outline'}
            onClick={() => setActiveExample(num)}
          >
            Ví dụ {num}
          </Button>
        ))}
      </Group>
      
      {activeExample === 1 && <BasicRequiredFiltersExample />}
      {activeExample === 2 && <ConditionalRequirementsExample />}
      {activeExample === 3 && <ValidationExample />}
      {activeExample === 4 && <HelperHooksExample />}
      {activeExample === 5 && <DynamicFetchControlExample />}
    </Box>
  );
}