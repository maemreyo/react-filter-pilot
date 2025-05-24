import React, { useRef, useEffect } from 'react';
import { useFilterPilotInfinite } from 'react-filter-pilot';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  tags: string[];
}

interface PostFilters {
  search: string;
  tags: string[];
  author: string;
}

/**
 * Example: Infinite scrolling blog posts with filters
 */
export function InfiniteBlogPosts() {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const {
    data,
    filters,
    setFilterValue,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useFilterPilotInfinite<Post, PostFilters>({
    filterConfigs: [
      {
        name: 'search',
        defaultValue: '',
        debounceMs: 300,
        urlKey: 'q',
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
        defaultValue: '',
        urlKey: 'author',
      },
    ],
    fetchConfig: {
      fetchFn: async ({ filters, cursor }) => {
        const params = new URLSearchParams();
        
        if (filters.search) params.set('search', filters.search);
        if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
        if (filters.author) params.set('author', filters.author);
        if (cursor) params.set('cursor', String(cursor));
        params.set('limit', '20');
        
        const response = await fetch(`/api/posts?${params}`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const result = await response.json();
        
        return {
          data: result.posts,
          totalRecords: result.total,
          nextCursor: result.nextCursor,
        };
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  });

  // Intersection Observer for auto-loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Popular tags for quick filtering
  const popularTags = ['javascript', 'react', 'typescript', 'nodejs', 'css'];

  return (
    <div className="infinite-blog-posts">
      {/* Filters */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Search posts..."
          value={filters.search}
          onChange={(e) => setFilterValue('search', e.target.value)}
          className="search-input"
        />
        
        <input
          type="text"
          placeholder="Filter by author..."
          value={filters.author}
          onChange={(e) => setFilterValue('author', e.target.value)}
          className="author-input"
        />
        
        <div className="tag-filters">
          <h4>Filter by tags:</h4>
          {popularTags.map((tag) => (
            <label key={tag} className="tag-checkbox">
              <input
                type="checkbox"
                checked={filters.tags.includes(tag)}
                onChange={(e) => {
                  const newTags = e.target.checked
                    ? [...filters.tags, tag]
                    : filters.tags.filter((t) => t !== tag);
                  setFilterValue('tags', newTags);
                }}
              />
              {tag}
            </label>
          ))}
        </div>
        
        {/* Active filters display */}
        {filters.tags.length > 0 && (
          <div className="active-tags">
            Active tags:
            {filters.tags.map((tag) => (
              <span
                key={tag}
                className="tag-chip"
                onClick={() => setFilterValue('tags', filters.tags.filter((t) => t !== tag))}
              >
                {tag} ×
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {isError ? (
        <div className="error-message">
          Error loading posts: {error?.message}
        </div>
      ) : (
        <>
          {/* Posts list */}
          <div className="posts-container">
            {isLoading ? (
              // Initial loading state
              <div className="loading-skeleton">
                {Array.from({ length: 5 }).map((_, i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="no-results">
                No posts found matching your filters.
              </div>
            ) : (
              data.map((post) => (
                <article key={post.id} className="post-card">
                  <h2>{post.title}</h2>
                  <div className="post-meta">
                    <span className="author">By {post.author}</span>
                    <span className="date">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="post-content">{post.content}</p>
                  <div className="post-tags">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="tag"
                        onClick={() => setFilterValue('tags', [...filters.tags, tag])}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Load more trigger */}
          <div ref={loadMoreRef} className="load-more-trigger">
            {isFetchingNextPage && (
              <div className="loading-more">
                <span>Loading more posts...</span>
              </div>
            )}
            
            {!hasNextPage && data.length > 0 && (
              <div className="end-of-list">
                You've reached the end! 🎉
              </div>
            )}
          </div>

          {/* Manual load more button (fallback) */}
          {hasNextPage && !isFetchingNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="load-more-button"
            >
              Load More Posts
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Loading skeleton component
function PostSkeleton() {
  return (
    <div className="post-card skeleton">
      <div className="skeleton-title"></div>
      <div className="skeleton-meta">
        <span className="skeleton-author"></span>
        <span className="skeleton-date"></span>
      </div>
      <div className="skeleton-content">
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
      <div className="skeleton-tags">
        <span className="skeleton-tag"></span>
        <span className="skeleton-tag"></span>
        <span className="skeleton-tag"></span>
      </div>
    </div>
  );
}

/**
 * Example: Virtual scrolling with infinite data
 */
export function VirtualInfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFilterPilotInfinite<{ id: string; name: string }, {}>({
    filterConfigs: [],
    fetchConfig: {
      fetchFn: async ({ cursor }) => {
        // Fetch implementation
        const response = await fetch(`/api/items?cursor=${cursor || ''}`);
        const result = await response.json();
        
        return {
          data: result.items,
          totalRecords: result.total,
          nextCursor: result.nextCursor,
        };
      },
    },
  });

  // This is a simplified example - in production, use a library like @tanstack/react-virtual
  return (
    <div
      className="virtual-list"
      style={{ height: '600px', overflow: 'auto' }}
      onScroll={(e) => {
        const target = e.currentTarget;
        const scrollPercentage = 
          (target.scrollTop + target.clientHeight) / target.scrollHeight;
        
        if (scrollPercentage > 0.9 && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }}
    >
      {data.map((item) => (
        <div key={item.id} className="virtual-item">
          {item.name}
        </div>
      ))}
      
      {isFetchingNextPage && <div>Loading more...</div>}
    </div>
  );
}