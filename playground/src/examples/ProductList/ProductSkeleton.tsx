import React from 'react';

// Loading Skeleton
const ProductSkeleton: React.FC = () => (
  <div className='product-card skeleton'>
    <div className='skeleton-img'></div>
    <div className='product-info'>
      <div className='skeleton-text'></div>
      <div className='skeleton-text short'></div>
      <div className='skeleton-text'></div>
    </div>
  </div>
);

export default ProductSkeleton;
