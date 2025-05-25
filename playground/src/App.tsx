import { useState } from 'react';
import './App.css';
import { ProductList, BlogPostList, UserManagement, AdvancedExample } from './examples';

function App() {
  const [activeExample, setActiveExample] = useState<string>('advanced-example');

  return (
    <div className='app-container'>
      <header>
        <h1>React Filter Pilot Playground</h1>
        <p>Thử nghiệm các tính năng của thư viện react-filter-pilot</p>
      </header>

      <div className='example-selector'>
        <button
          className={activeExample === 'advanced-example' ? 'active' : ''}
          onClick={() => setActiveExample('advanced-example')}
        >
          Advanced Example
        </button>
        <button
          className={activeExample === 'product-list' ? 'active' : ''}
          onClick={() => setActiveExample('product-list')}
        >
          Product List
        </button>
        <button
          className={activeExample === 'blog-post-list' ? 'active' : ''}
          onClick={() => setActiveExample('blog-post-list')}
        >
          Blog Posts (Infinite)
        </button>
        <button
          className={activeExample === 'user-management' ? 'active' : ''}
          onClick={() => setActiveExample('user-management')}
        >
          User Management (Mutation)
        </button>
      </div>

      <main>
        {activeExample === 'advanced-example' && <AdvancedExample />}
        {activeExample === 'product-list' && <ProductList />}
        {activeExample === 'blog-post-list' && <BlogPostList />}
        {activeExample === 'user-management' && <UserManagement />}
      </main>

      <footer>
        <p>React Filter Pilot - Một thư viện quản lý filter, pagination và sorting cho React</p>
      </footer>
    </div>
  );
}

export default App;
