import { useState } from 'react';
import './App.css';
import { ProductList } from './examples';

function App() {
  const [activeExample, setActiveExample] = useState<string>('product-list');

  return (
    <div className='app-container'>
      <header>
        <h1>React Filter Pilot Playground</h1>
        <p>Thử nghiệm các tính năng của thư viện react-filter-pilot</p>
      </header>

      <div className='example-selector'>
        <button
          className={activeExample === 'basic-task-list' ? 'active' : ''}
          onClick={() => setActiveExample('basic-task-list')}
        >
          Basic Task List
        </button>
        <button
          className={activeExample === 'simple-task-list' ? 'active' : ''}
          onClick={() => setActiveExample('simple-task-list')}
        >
          Simple Task List
        </button>
        <button
          className={activeExample === 'product-list' ? 'active' : ''}
          onClick={() => setActiveExample('product-list')}
        >
          Product List
        </button>
        {/* Thêm các ví dụ khác ở đây khi cần */}
      </div>

      <main>
        {activeExample === 'product-list' && <ProductList />}
      </main>

      <footer>
        <p>React Filter Pilot - Một thư viện quản lý filter, pagination và sorting cho React</p>
      </footer>
    </div>
  );
}

export default App;
