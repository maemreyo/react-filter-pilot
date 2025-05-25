import React, { useRef, useCallback } from 'react';
import { useFilterPilotInfinite } from 'react-filter-pilot';
import './BlogPostList.css';

// Types
interface BlogPost {
  id: string;
  title: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readTime: number;
  excerpt: string;
  imageUrl: string;
  likes: number;
}

interface BlogFilters {
  search: string;
  category: string;
  tags: string[];
  author: string;
  dateRange: {
    min: string;
    max: string;
  };
  minReadTime: number;
  maxReadTime: number;
}

// Mock data generator
const generateMockPosts = (count: number): BlogPost[] => {
  const categories = ['Technology', 'Health', 'Business', 'Lifestyle', 'Travel'];
  const tags = ['JavaScript', 'React', 'Node.js', 'CSS', 'HTML', 'TypeScript', 'Design', 'UX', 'Performance', 'Mobile'];
  const authors = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Maria Garcia', 'David Kim'];
  
  return Array.from({ length: count }, (_, i) => {
    // Generate random date within the last 2 years
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 730));
    
    // Generate random tags (2-4 tags per post)
    const postTags = [];
    const tagCount = Math.floor(Math.random() * 3) + 2;
    for (let j = 0; j < tagCount; j++) {
      const randomTag = tags[Math.floor(Math.random() * tags.length)];
      if (!postTags.includes(randomTag)) {
        postTags.push(randomTag);
      }
    }
    
    return {
      id: `post-${i + 1}`,
      title: `Blog Post ${i + 1}: ${['The Ultimate Guide to', 'How to Master', 'Understanding', 'Exploring', 'The Future of'][Math.floor(Math.random() * 5)]} ${tags[Math.floor(Math.random() * tags.length)]}`,
      author: authors[Math.floor(Math.random() * authors.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      tags: postTags,
      publishedAt: date.toISOString().split('T')[0],
      readTime: Math.floor(Math.random() * 20) + 3, // 3-22 minutes
      excerpt: `This is a summary of the blog post about ${postTags.join(', ')}. It contains valuable information for readers interested in ${categories[Math.floor(Math.random() * categories.length)].toLowerCase()}.`,
      imageUrl: `https://picsum.photos/800/400?random=${i}`,
      likes: Math.floor(Math.random() * 500),
    };
  });
};

// Mock database
const mockDatabase = generateMockPosts(200);

// Mock API fetch function with cursor pagination
const fetchBlogPosts = async ({ filters, cursor }: any) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  let filteredPosts = [...mockDatabase];

  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredPosts = filteredPosts.filter(
      p => p.title.toLowerCase().includes(searchLower) || 
           p.excerpt.toLowerCase().includes(searchLower)
    );
  }

  if (filters.category && filters.category !== 'all') {
    filteredPosts = filteredPosts.filter(p => p.category === filters.category);
  }

  if (filters.tags && filters.tags.length > 0) {
    filteredPosts = filteredPosts.filter(p => 
      filters.tags.some((tag: string) => p.tags.includes(tag))
    );
  }

  if (filters.author && filters.author !== 'all') {
    filteredPosts = filteredPosts.filter(p => p.author === filters.author);
  }

  if (filters.dateRange) {
    if (filters.dateRange.min) {
      filteredPosts = filteredPosts.filter(p => p.publishedAt >= filters.dateRange.min);
    }
    if (filters.dateRange.max) {
      filteredPosts = filteredPosts.filter(p => p.publishedAt <= filters.dateRange.max);
    }
  }

  if (filters.minReadTime > 0) {
    filteredPosts = filteredPosts.filter(p => p.readTime >= filters.minReadTime);
  }

  if (filters.maxReadTime < 30) {
    filteredPosts = filteredPosts.filter(p => p.readTime <= filters.maxReadTime);
  }

  // Sort by date (newest first)
  filteredPosts.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  // Handle cursor pagination
  const pageSize = 10;
  let startIndex = 0;
  
  if (cursor) {
    const cursorIndex = filteredPosts.findIndex(post => post.id === cursor);
    if (cursorIndex !== -1) {
      startIndex = cursorIndex + 1; // Start after the cursor
    }
  }
  
  const endIndex = startIndex + pageSize;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
  const nextCursor = paginatedPosts.length > 0 ? paginatedPosts[paginatedPosts.length - 1].id : null;
  
  return {
    data: paginatedPosts,
    totalRecords: filteredPosts.length,
    nextCursor,
    previousCursor: null, // Not implementing backward pagination in this example
    meta: {
      categories: [...new Set(mockDatabase.map(p => p.category))],
      authors: [...new Set(mockDatabase.map(p => p.author))],
      tags: [...new Set(mockDatabase.flatMap(p => p.tags))],
    },
  };
};

// Blog Post Card Component
const BlogPostCard: React.FC<{ post: BlogPost }> = ({ post }) => (
  <div className="blog-post-card">
    <div className="blog-post-image">
      <img src={post.imageUrl} alt={post.title} />
    </div>
    <div className="blog-post-content">
      <div className="blog-post-meta">
        <span className="blog-post-category">{post.category}</span>
        <span className="blog-post-date">{new Date(post.publishedAt).toLocaleDateString()}</span>
        <span className="blog-post-read-time">{post.readTime} min read</span>
      </div>
      <h3 className="blog-post-title">{post.title}</h3>
      <p className="blog-post-excerpt">{post.excerpt}</p>
      <div className="blog-post-footer">
        <div className="blog-post-author">By {post.author}</div>
        <div className="blog-post-likes">❤ {post.likes}</div>
      </div>
      <div className="blog-post-tags">
        {post.tags.map(tag => (
          <span key={tag} className="blog-post-tag">{tag}</span>
        ))}
      </div>
    </div>
  </div>
);

// Loading Skeleton
const BlogPostSkeleton: React.FC = () => (
  <div className="blog-post-card skeleton">
    <div className="blog-post-image skeleton-img"></div>
    <div className="blog-post-content">
      <div className="blog-post-meta">
        <span className="skeleton-text short"></span>
        <span className="skeleton-text short"></span>
      </div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text short"></div>
    </div>
  </div>
);

// Main Component
export const BlogPostList: React.FC = () => {
  const observerTarget = useRef<HTMLDivElement>(null);

  const {
    filters,
    setFilterValue,
    resetFilters,
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    totalRecords,
  } = useFilterPilotInfinite<BlogPost, BlogFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 500,
        urlKey: 'q',
      },
      {
        name: 'category',
        defaultValue: 'all',
        urlKey: 'cat',
      },
      {
        name: 'tags',
        defaultValue: [],
        urlKey: 'tags',
        transformToUrl: (value: string[]) => value.join(','),
        transformFromUrl: (value: string) => value ? value.split(',') : [],
      },
      {
        name: 'author',
        defaultValue: 'all',
        urlKey: 'author',
      },
      {
        name: 'dateRange',
        urlKey: 'drange',
        defaultValue: { min: '', max: '' },
        transformToUrl: (value) => `${value.min || ''}:${value.max || ''}`,
        transformFromUrl: (value) => {
          const [min, max] = value.split(':');
          return { min, max };
        },
      },
      {
        name: 'minReadTime',
        defaultValue: 0,
        urlKey: 'minRead',
        transformToUrl: (value) => value.toString(),
        transformFromUrl: (value) => parseInt(value, 10),
      },
      {
        name: 'maxReadTime',
        defaultValue: 30,
        urlKey: 'maxRead',
        transformToUrl: (value) => value.toString(),
        transformFromUrl: (value) => parseInt(value, 10),
      },
    ],
    sortConfig: {
      initialSortField: 'publishedAt',
      initialSortDirection: 'desc',
    },
    fetchConfig: {
      fetchFn: fetchBlogPosts,
      staleTime: 5 * 60 * 1000, // 5 minutes
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  });

  // Intersection Observer for infinite scrolling
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Set up the intersection observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: '0px 0px 400px 0px', // Load more when 400px from bottom
    });
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  // Get all available tags from the data
  const allTags = React.useMemo(() => {
    return [...new Set(mockDatabase.flatMap(post => post.tags))];
  }, []);

  // Get all available authors
  const allAuthors = React.useMemo(() => {
    return [...new Set(mockDatabase.map(post => post.author))];
  }, []);

  return (
    <div className="blog-list-container">
      <div className="blog-list-header">
        <h2>Blog Posts</h2>
        <p>Showing {data.length} of {totalRecords} posts</p>
      </div>

      <div className="blog-filters">
        {/* Search */}
        <div className="filter-item">
          <input
            type="text"
            placeholder="Search posts..."
            value={filters.search}
            onChange={(e) => setFilterValue('search', e.target.value)}
            className="search-input"
          />
        </div>

        {/* Category Filter */}
        <div className="filter-item">
          <select
            value={filters.category}
            onChange={(e) => setFilterValue('category', e.target.value)}
            className="select-filter"
          >
            <option value="all">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Health">Health</option>
            <option value="Business">Business</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Travel">Travel</option>
          </select>
        </div>

        {/* Author Filter */}
        <div className="filter-item">
          <select
            value={filters.author}
            onChange={(e) => setFilterValue('author', e.target.value)}
            className="select-filter"
          >
            <option value="all">All Authors</option>
            {allAuthors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
        </div>

        {/* Read Time Range */}
        <div className="filter-item read-time-filter">
          <label>Read Time: {filters.minReadTime}-{filters.maxReadTime} min</label>
          <div className="range-slider">
            <input
              type="range"
              min="0"
              max="30"
              value={filters.minReadTime}
              onChange={(e) => setFilterValue('minReadTime', parseInt(e.target.value))}
            />
            <input
              type="range"
              min="0"
              max="30"
              value={filters.maxReadTime}
              onChange={(e) => setFilterValue('maxReadTime', parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Reset Filters */}
        <button onClick={resetFilters} className="reset-filters-btn">
          Reset Filters
        </button>
      </div>

      {/* Tags Filter */}
      <div className="tags-filter">
        {allTags.map(tag => (
          <button
            key={tag}
            className={`tag-btn ${filters.tags.includes(tag) ? 'active' : ''}`}
            onClick={() => {
              const newTags = filters.tags.includes(tag)
                ? filters.tags.filter(t => t !== tag)
                : [...filters.tags, tag];
              setFilterValue('tags', newTags);
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Blog Posts */}
      <div className="blog-posts-grid">
        {data.map(post => (
          <BlogPostCard key={post.id} post={post} />
        ))}
        
        {/* Loading skeletons */}
        {(isLoading || isFetchingNextPage) && (
          <>
            <BlogPostSkeleton />
            <BlogPostSkeleton />
            <BlogPostSkeleton />
          </>
        )}
        
        {/* Observer target for infinite scrolling */}
        <div ref={observerTarget} className="observer-target"></div>
      </div>

      {/* Load more button (alternative to infinite scroll) */}
      {hasNextPage && (
        <button 
          onClick={() => fetchNextPage()} 
          disabled={isFetchingNextPage}
          className="load-more-btn"
        >
          {isFetchingNextPage ? 'Loading more...' : 'Load More'}
        </button>
      )}

      {/* No results message */}
      {!isLoading && data.length === 0 && (
        <div className="no-results">
          <h3>No blog posts found</h3>
          <p>Try adjusting your filters to find what you're looking for.</p>
          <button onClick={resetFilters} className="reset-filters-btn">
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};