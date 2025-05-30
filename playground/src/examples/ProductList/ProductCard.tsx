import React from 'react';
import { Product } from '.';

// Product Card Component
const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
  <div className="product-card">
    <img src={product.imageUrl} alt={product.name} />
    <div className="product-info">
      <h3>{product.name}</h3>
      <p className="product-category">{product.category}</p>
      <p className="product-brand">{product.brand}</p>
      <div className="product-rating">
        {'★'.repeat(product.rating)}{'☆'.repeat(5 - product.rating)}
        <span>({product.reviews})</span>
      </div>
      <div className="product-footer">
        <span className="product-price">${product.price}</span>
        <span className={`product-stock ${product.inStock ? 'in-stock' : 'out-stock'}`}>
          {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
        </span>
      </div>
    </div>
  </div>
);

export default ProductCard;