import { useState, useEffect } from "react";
import ProductForm from './components/ProductForm';
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import Signup from "./components/Signup";
import Login from "./components/Login";
import './styles/App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [showSignup, setShowSignup] = useState(true);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setProducts([]);
      setAnalysisResult(null);
      if (currentUser) {
        const productsRef = collection(db, "users", currentUser.uid, "products");
        const unsubscribeProducts = onSnapshot(productsRef, (snapshot) => {
          const userProducts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProducts(userProducts);
        });
        return () => unsubscribeProducts();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (newProduct) => {
    if (!user) {
      alert("You must be logged in to add products.");
      return;
    }
    try {
      const productsRef = collection(db, "users", user.uid, "products");
      await addDoc(productsRef, newProduct);
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  // New: Delete product from Firestore
  const handleDeleteProduct = async (productId) => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }
    try {
      const productDocRef = doc(db, "users", user.uid, "products", productId);
      await deleteDoc(productDocRef);
      // onSnapshot will automatically update products state
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  async function analyzeProducts() {
    if (products.length === 0) {
      alert("Please add some products first!");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('http://localhost:4000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });

      if (!response.ok) {
        throw new Error('Failed to get your analysis');
      }

      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 400, margin: "auto" }}>
        {showSignup ? <Signup /> : <Login />}
        <button
          onClick={() => setShowSignup(!showSignup)}
          style={{ marginTop: 20 }}
        >
          {showSignup ? "Already have an account? Log In" : "No account? Sign Up"}
        </button>
      </div>
    );
  }

 return (
  <div>
    <h1 className="app-title">
      The Skindex
    </h1>
    <div className="user-info">
      <p>Welcome, {user.email}</p>
      <button onClick={handleLogout}>Log Out</button>
    </div>

    <ProductForm onSubmit={handleAddProduct} />

    {products.length > 0 && (
      <div className="added-products">
        <h3>Added Products:</h3>
        <ul>
          {products.map((p) => (
            <li key={p.id}>
              <div>
                <strong>{p.name}</strong> ({p.type})
                <span>— {p.useTime.join("/")}</span>
              </div>
              <button
                onClick={() => handleDeleteProduct(p.id)}
                aria-label={`Delete ${p.name}`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={analyzeProducts}
          disabled={loading}
          className="analyze-button"
        >
          {loading ? "Analyzing..." : "Analyze Skincare Products"}
        </button>

        {error && <p className="error-message">Error: {error}</p>}

        {analysisResult && (
          <div className="analysis-result">
            <h3>Analysis Result:</h3>
            <ul>
              {analysisResult.products.map((p, i) => (
                <li key={i}>
                  <strong>{p.name}</strong>: {p.description}
                </li>
              ))}
            </ul>
            <h4>Recommended Order:</h4>
            <ol>
              {analysisResult.recommendedOrder.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    )}
  </div>
);
}