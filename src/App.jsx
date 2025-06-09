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

  const [emailToSend, setEmailToSend] = useState('');
  const [sendEmailStatus, setSendEmailStatus] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setProducts([]);
      setAnalysisResult(null);
      setEmailToSend(''); 
      setSendEmailStatus(null);
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

  
  const handleDeleteProduct = async (productId) => {
    if (!user) {
      alert("You must be logged in.");
      return;
    }
    try {
      const productDocRef = doc(db, "users", user.uid, "products", productId);
      await deleteDoc(productDocRef);
      
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
    setSendEmailStatus(null);
    setEmailToSend('');

    try {
      const response = await fetch('https://skindexserver.onrender.com/analyze', {
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

  async function sendResultsByEmail() {
    if (!emailToSend) {
      alert("Please enter an email address.");
      return;
    }

    setSendEmailStatus(null);

     try {
      const response = await fetch('https://skindexserver.onrender.com/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToSend, analysisResult }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email.");
      }

      setSendEmailStatus("Email sent successfully!");
    } catch (err) {
      setSendEmailStatus(`Error sending email: ${err.message}`);
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

        {analysisResult && analysisResult.products && (
          <div style={{ marginTop: '1rem' }}>
            <h3>Analysis Result:</h3>
            <ul>
              {analysisResult.products.map((p, i) => (
                <li key={i}>
                  <strong>{p.name}</strong>: {p.description} <br />
                  <em>Use: {p.usageTime.join(', ')}, {p.frequency}</em>
                </li>
              ))}
            </ul>

            <h4>Recommended AM Routine:</h4>
            <ol>
              {(analysisResult.recommendedRoutine?.AM || []).map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ol>

            <h4>Recommended PM Routine:</h4>
            <ol>
              {(analysisResult.recommendedRoutine?.PM || []).map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ol>

            {analysisResult.conflicts?.length > 0 && (
              <>
                <h4>Conflicts:</h4>
                <ul>
                  {analysisResult.conflicts.map((conflict, i) => (
                    <li key={i}>
                      ⚠️ <strong>{conflict.products.join(" & ")}</strong>: {conflict.reason}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div style={{ marginTop: '2rem' }}>
                <h4>Get your results emailed (optional):</h4>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={emailToSend}
                  onChange={(e) => setEmailToSend(e.target.value)}
                  style={{ padding: '0.5rem', width: '100%', maxWidth: 300 }}
                />
                <button onClick={sendResultsByEmail} style={{ marginTop: '0.5rem' }}>
                  Send Results by Email
                </button>
                {sendEmailStatus && (
                  <p style={{ marginTop: '0.5rem', color: sendEmailStatus.includes("Error") ? 'red' : 'green' }}>
                    {sendEmailStatus}
                  </p>
                )}
              </div>

          </div>
        )}
      </div>
    )}
  </div>
); 
} 
