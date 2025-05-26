import { useState } from 'react';
import './App.css';
import { ProductList, BlogPostList, UserManagement, AdvancedExample, FetchControlExamples, OptimizationExample } from './examples';
import { SimpleMantineTableExample } from './examples/mantine-simple-example';
import { MantineTableWithFilterPilot, AdvancedMantineTableExample } from './examples/mantine-table-example';

function App() {
  const [activeExample, setActiveExample] = useState<string>('mantine-simple');

  return (
    <div className='app-container'>
      <header>
        <h1>React Filter Pilot Playground</h1>
        <p>Thử nghiệm các tính năng của thư viện react-filter-pilot</p>
      </header>

      <div className='example-selector'>
        <button
          className={activeExample === 'mantine-simple' ? 'active' : ''}
          onClick={() => setActiveExample('mantine-simple')}
        >
          Mantine Simple Example
        </button>
        <button
          className={activeExample === 'mantine-table' ? 'active' : ''}
          onClick={() => setActiveExample('mantine-table')}
        >
          Mantine Table Example
        </button>
        <button
          className={activeExample === 'mantine-advanced' ? 'active' : ''}
          onClick={() => setActiveExample('mantine-advanced')}
        >
          Mantine Advanced Example
        </button>
        <button
          className={activeExample === 'advanced-example' ? 'active' : ''}
          onClick={() => setActiveExample('advanced-example')}
        >
          Advanced Example
        </button>
        <button
          className={activeExample === 'fetch-control' ? 'active' : ''}
          onClick={() => setActiveExample('fetch-control')}
        >
          Fetch Control Examples
        </button>
        <button
          className={activeExample === 'optimization' ? 'active' : ''}
          onClick={() => setActiveExample('optimization')}
        >
          Optimization Examples
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
        {activeExample === 'mantine-simple' && <SimpleMantineTableExample />}
        {activeExample === 'mantine-table' && <MantineTableWithFilterPilot />}
        {activeExample === 'mantine-advanced' && <AdvancedMantineTableExample />}
        {activeExample === 'advanced-example' && <AdvancedExample />}
        {activeExample === 'fetch-control' && <FetchControlExamples />}
        {activeExample === 'optimization' && <OptimizationExample />}
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
