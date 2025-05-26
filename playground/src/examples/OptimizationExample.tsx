import React, { useState } from 'react';
import { useFilterPilot } from 'react-filter-pilot';
import { Box, Card, Text, TextInput, Select, Button, Group, NumberInput, Checkbox, Divider, Alert, Badge, Stack, ActionIcon, Title, Code, Paper } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconX, IconSearch, IconRefresh } from '@tabler/icons-react';

// Định nghĩa các loại filter
interface OptimizationFilters {
  search: string;
  category: string;
  minPrice: number | null;
  maxPrice: number | null;
  inStock: boolean;
  sortBy: string;
  tags: string[];
}

// Dữ liệu mẫu
const categories = [
  { value: '', label: 'Tất cả danh mục' },
  { value: 'electronics', label: 'Điện tử' },
  { value: 'clothing', label: 'Thời trang' },
  { value: 'books', label: 'Sách' },
  { value: 'home', label: 'Đồ gia dụng' },
];

const sortOptions = [
  { value: 'relevance', label: 'Liên quan nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'newest', label: 'Mới nhất' },
];

const tags = [
  { value: 'sale', label: 'Giảm giá' },
  { value: 'new', label: 'Mới' },
  { value: 'popular', label: 'Phổ biến' },
  { value: 'limited', label: 'Số lượng có hạn' },
];

// Mock API call
const fetchProducts = async (params: any) => {
  console.log('Fetching products with params:', params);
  
  // Giả lập độ trễ mạng
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    data: Array(10).fill(null).map((_, index) => ({
      id: index + 1,
      name: `Sản phẩm ${index + 1}`,
      price: Math.floor(Math.random() * 1000) + 10,
      category: categories[Math.floor(Math.random() * categories.length)].value,
      inStock: Math.random() > 0.3,
    })),
    totalRecords: 100,
  };
};

export function OptimizationExample() {
  const [fetchCount, setFetchCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  
  // Cấu hình filter pilot với các tùy chọn tối ưu
  const {
    filters,
    setFilterValue,
    resetFilters,
    pagination,
    setPage,
    data,
    isLoading,
    fetchControl,
  } = useFilterPilot<any, OptimizationFilters>({
    filterConfigs: [
      { 
        name: 'search', 
        defaultValue: '', 
        debounceMs: 500, // Debounce cho search
        syncWithUrl: true, // Cho phép đồng bộ với URL
      },
      { 
        name: 'category', 
        defaultValue: '', 
        syncWithUrl: true, 
      },
      { 
        name: 'minPrice', 
        defaultValue: 0, 
        syncWithUrl: false, // Không đồng bộ với URL
      },
      { 
        name: 'maxPrice', 
        defaultValue: 1000000000, 
        syncWithUrl: false, 
      },
      { 
        name: 'inStock', 
        defaultValue: false, 
        syncWithUrl: true, 
      },
      { 
        name: 'sortBy', 
        defaultValue: 'relevance', 
        syncWithUrl: true, 
      },
      { 
        name: 'tags', 
        defaultValue: [], 
        syncWithUrl: false, 
      },
    ],
    paginationConfig: {
      initialPage: 1,
      initialPageSize: 10,
      syncWithUrl: true,
      resetOnFilterChange: true,
      // Chỉ reset page khi các filter quan trọng thay đổi
      resetPageOnFilterChange: (filterName) => 
        ['search', 'category', 'inStock'].includes(filterName),
    },
    fetchConfig: {
      fetchFn: async (params) => {
        setFetchCount(prev => prev + 1);
        setLastFetchTime(new Date());
        return fetchProducts(params);
      },
      queryKey: 'optimization-example',
      staleTime: 30000, // 30 giây
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retryOnMount: false,
      throttleMs: 1000, // Throttle 1 giây
    },
    fetchControl: {
      debounceMs: 500, // Debounce cho fetch control
      // Chỉ fetch khi có search hoặc category
      validate: (filters) => {
        if (filters.minPrice !== null && filters.maxPrice !== null && 
            filters.minPrice > filters.maxPrice) {
          return { 
            valid: false, 
            message: 'Giá tối thiểu không thể lớn hơn giá tối đa' 
          };
        }
        return { valid: true };
      },
      onFetchStart: () => console.log('Bắt đầu fetch dữ liệu'),
      onFetchEnd: () => console.log('Kết thúc fetch dữ liệu'),
      onFetchError: (error) => console.error('Lỗi fetch:', error),
      onFetchSkipped: (reason) => console.warn('Bỏ qua fetch:', reason),
    },
  });

  return (
    <Box p="md">
      <Title order={2} mb="md">Ví dụ về Tối ưu hóa Filter Pilot</Title>
      
      <Paper p="md" mb="md" withBorder>
        <Title order={4} mb="sm">Thông tin Debug</Title>
        <Stack spacing="xs">
          <Text>Số lần fetch: <Badge>{fetchCount}</Badge></Text>
          <Text>Thời gian fetch cuối: <Badge>{lastFetchTime ? lastFetchTime.toLocaleTimeString() : 'Chưa có'}</Badge></Text>
          <Text>Fetch được kích hoạt: <Badge color={fetchControl?.isEnabled ? 'green' : 'red'}>{fetchControl?.isEnabled ? 'Có' : 'Không'}</Badge></Text>
          {!fetchControl?.isEnabled && <Text color="red">Lý do: {fetchControl?.reason}</Text>}
        </Stack>
      </Paper>
      
      <Group position="apart" mb="md">
        <Title order={3}>Bộ lọc</Title>
        <Button 
          leftIcon={<IconRefresh size={16} />} 
          variant="outline" 
          onClick={resetFilters}
        >
          Đặt lại bộ lọc
        </Button>
      </Group>
      
      <Card withBorder mb="md">
        <Stack>
          <Group grow>
            <TextInput
              label="Tìm kiếm"
              placeholder="Nhập từ khóa tìm kiếm"
              icon={<IconSearch size={16} />}
              value={filters.search}
              onChange={(e) => setFilterValue('search', e.target.value)}
            />
            
            <Select
              label="Danh mục"
              placeholder="Chọn danh mục"
              data={categories}
              value={filters.category}
              onChange={(value) => setFilterValue('category', value || '')}
            />
          </Group>
          
          <Group grow>
            <NumberInput
              label="Giá tối thiểu"
              placeholder="Từ"
              value={filters.minPrice!}
              onChange={(value) => setFilterValue('minPrice', value)}
              min={0}
            />
            
            <NumberInput
              label="Giá tối đa"
              placeholder="Đến"
              value={filters.maxPrice!}
              onChange={(value) => setFilterValue('maxPrice', value)}
              min={0}
            />
          </Group>
          
          <Group position="apart">
            <Checkbox
              label="Chỉ hiển thị sản phẩm còn hàng"
              checked={filters.inStock}
              onChange={(e) => setFilterValue('inStock', e.currentTarget.checked)}
            />
            
            <Select
              label="Sắp xếp theo"
              data={sortOptions}
              value={filters.sortBy}
              onChange={(value) => setFilterValue('sortBy', value || 'relevance')}
              style={{ width: 200 }}
            />
          </Group>
          
          <Box>
            <Text size="sm" weight={500} mb={5}>Tags</Text>
            <Group spacing="xs">
              {tags.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={filters.tags.includes(tag.value) ? 'filled' : 'outline'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    const newTags = filters.tags.includes(tag.value)
                      ? filters.tags.filter(t => t !== tag.value)
                      : [...filters.tags, tag.value];
                    setFilterValue('tags', newTags);
                  }}
                >
                  {tag.label}
                </Badge>
              ))}
            </Group>
          </Box>
        </Stack>
      </Card>
      
      {/* Hiển thị kết quả */}
      <Box>
        <Title order={3} mb="md">Kết quả ({pagination.totalRecords})</Title>
        
        {isLoading ? (
          <Text>Đang tải...</Text>
        ) : data && data.length > 0 ? (
          <Stack>
            {data.map((product) => (
              <Card key={product.id} withBorder p="sm">
                <Group position="apart">
                  <Text weight={500}>{product.name}</Text>
                  <Badge color={product.inStock ? 'green' : 'red'}>
                    {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                  </Badge>
                </Group>
                <Text size="sm" color="dimmed">Danh mục: {product.category || 'Không có'}</Text>
                <Text weight={700} color="blue">{product.price.toLocaleString()} đ</Text>
              </Card>
            ))}
          </Stack>
        ) : (
          <Alert icon={<IconAlertCircle size={16} />} title="Không tìm thấy kết quả" color="yellow">
            Không có sản phẩm nào phù hợp với bộ lọc của bạn. Vui lòng thử lại với các tiêu chí khác.
          </Alert>
        )}
        
        {/* Phân trang */}
        <Group position="center" mt="md">
          <Button
            disabled={!pagination.hasPreviousPage}
            onClick={() => setPage(pagination.page - 1)}
          >
            Trang trước
          </Button>
          <Text>
            Trang {pagination.page} / {pagination.totalPages}
          </Text>
          <Button
            disabled={!pagination.hasNextPage}
            onClick={() => setPage(pagination.page + 1)}
          >
            Trang sau
          </Button>
        </Group>
      </Box>
      
      <Divider my="xl" />
      
      <Box mb="xl">
        <Title order={3} mb="md">Các tính năng tối ưu hóa đã áp dụng</Title>
        <Stack spacing="md">
          <Paper p="md" withBorder>
            <Title order={5}>1. Tắt syncWithUrl cho từng filter</Title>
            <Text>Một số filter như minPrice, maxPrice và tags được cấu hình với <Code>syncWithUrl: false</Code> để tránh cập nhật URL mỗi khi thay đổi.</Text>
          </Paper>
          
          <Paper p="md" withBorder>
            <Title order={5}>2. Thêm resetPageOnFilterChange</Title>
            <Text>Chỉ reset trang khi các filter quan trọng thay đổi (search, category, inStock) thông qua <Code>resetPageOnFilterChange</Code>.</Text>
          </Paper>
          
          <Paper p="md" withBorder>
            <Title order={5}>3. Tăng throttleMs</Title>
            <Text>Đã cấu hình <Code>throttleMs: 1000</Code> để giảm số lần gọi API khi có nhiều thay đổi liên tiếp.</Text>
          </Paper>
          
          <Paper p="md" withBorder>
            <Title order={5}>4. Thêm debounceMs cho fetchControl</Title>
            <Text>Đã thêm <Code>debounceMs: 500</Code> cho fetchControl để trì hoãn việc kiểm tra điều kiện fetch.</Text>
          </Paper>
          
          <Paper p="md" withBorder>
            <Title order={5}>5. Tối ưu hóa fetchConfig</Title>
            <Text>Đã cấu hình các tùy chọn như <Code>refetchOnMount: false</Code>, <Code>retryOnMount: false</Code>, <Code>staleTime: 30000</Code> để tối ưu hóa việc fetch dữ liệu.</Text>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}