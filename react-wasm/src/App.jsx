import { useState, useEffect } from 'react';

function App() {
  const [wasm, setWasm] = useState(null);
  const [name, setName] = useState('World');
  const [greeting, setGreeting] = useState('');
  const [num1, setNum1] = useState(5);
  const [num2, setNum2] = useState(10);
  const [sum, setSum] = useState(null);
  const [fibNumber, setFibNumber] = useState(10);
  const [fibResult, setFibResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        const wasmModule = await import('./wasm_pkg/wasm_lib.js');
        await wasmModule.default();
        setWasm(wasmModule);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadWasm();
  }, []);

  const handleGreet = () => {
    if (wasm) {
      const result = wasm.greet(name);
      setGreeting(result);
    }
  };

  const handleAdd = () => {
    if (wasm) {
      const result = wasm.add(parseInt(num1), parseInt(num2));
      setSum(result);
    }
  };

  const handleFibonacci = () => {
    if (wasm) {
      const result = wasm.fibonacci(parseInt(fibNumber));
      setFibResult(result);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <h1>Loading WebAssembly...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h1>Error Loading WebAssembly</h1>
        <p style={styles.error}>{error}</p>
        <p>Make sure you have built the WASM module:</p>
        <pre style={styles.code}>cd ../wasm_lib && wasm-pack build --target web</pre>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>Rust + React + WebAssembly Demo</h1>

      <div style={styles.section}>
        <h2>1. Greeting Function</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          style={styles.input}
        />
        <button onClick={handleGreet} style={styles.button}>
          Greet
        </button>
        {greeting && <p style={styles.result}>{greeting}</p>}
      </div>

      <div style={styles.section}>
        <h2>2. Add Two Numbers</h2>
        <input
          type="number"
          value={num1}
          onChange={(e) => setNum1(e.target.value)}
          style={styles.input}
        />
        <span style={styles.operator}>+</span>
        <input
          type="number"
          value={num2}
          onChange={(e) => setNum2(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAdd} style={styles.button}>
          Calculate
        </button>
        {sum !== null && <p style={styles.result}>Result: {sum}</p>}
      </div>

      <div style={styles.section}>
        <h2>3. Fibonacci Number</h2>
        <input
          type="number"
          value={fibNumber}
          onChange={(e) => setFibNumber(e.target.value)}
          min="0"
          max="40"
          style={styles.input}
        />
        <button onClick={handleFibonacci} style={styles.button}>
          Calculate
        </button>
        {fibResult !== null && (
          <p style={styles.result}>
            Fibonacci({fibNumber}) = {fibResult}
          </p>
        )}
      </div>

      <div style={styles.footer}>
        <p>Open your browser console to see Rust logs!</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  section: {
    marginBottom: '40px',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    marginRight: '10px',
    width: '150px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  result: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#d4edda',
    border: '1px solid #c3e6cb',
    borderRadius: '4px',
    color: '#155724',
  },
  error: {
    color: '#d9534f',
    backgroundColor: '#f2dede',
    padding: '10px',
    borderRadius: '4px',
    marginTop: '10px',
  },
  code: {
    backgroundColor: '#2d2d2d',
    color: '#f8f8f2',
    padding: '15px',
    borderRadius: '4px',
    overflowX: 'auto',
  },
  operator: {
    fontSize: '20px',
    margin: '0 10px',
  },
  footer: {
    marginTop: '40px',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
  },
};

export default App;
