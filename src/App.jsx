import { useState, useEffect } from "react";
import ProductForm from './components/ProductForm';
import { db, auth } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import Landing from './Landing';
import Signup from "./components/Signup";
import Login from "./components/Login";
import './styles/App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  
  const [showSignup, setShowSignup] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [emailToSend, setEmailToSend] = useState('');
  const [sendEmailStatus, setSendEmailStatus] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordUpdateStatus, setPasswordUpdateStatus] = useState(null);
  const [reauthError, setReauthError] = useState(null);

    useEffect(() => {
    window.scrollTo(0, 0);
  }, [user, showSignup]);

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

      setSendEmailStatus("Email sent successfully! Please check your spam folder if you do not see it.");
    } catch (err) {
      setSendEmailStatus(`Error sending email: ${err.message}`);
    }
  }

  async function handleUpdatePassword() {
    setPasswordUpdateStatus(null);
    setReauthError(null);

    if (!currentPassword) {
      setReauthError("Please enter your current password to confirm.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordUpdateStatus("Password must be at least 6 characters.");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);

      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      setPasswordUpdateStatus("Password updated successfully.");
      setNewPassword("");
      setCurrentPassword("");

      setTimeout(() => {
        setIsModalOpen(false);
        setPasswordUpdateStatus(null);
        setReauthError(null);
      }, 1500);
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        setReauthError("Current password is incorrect.");
      } else {
        setPasswordUpdateStatus(`Error: ${error.message}`);
      }
    }
  }

  if (!user) {
    return (
      <div className="auth-container">
        {showSignup === null && (
          <Landing
            onLoginClick={() => setShowSignup(false)}
            onSignupClick={() => setShowSignup(true)}
          />
        )}

        {showSignup === false && (
          <div className="auth-box">
            <Login />
            <button
              onClick={() => setShowSignup(null)}
              className="toggle-auth-button"
            >
              Back
            </button>
          </div>
        )}

        {showSignup === true && (
          <div className="auth-box">
            <Signup />
            <button
              onClick={() => setShowSignup(null)}
              className="toggle-auth-button"
            >
              Back
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="app-title">
        The Skindex
      </h1>
      <p className="disclaimer">
        ⚠️ This is not medical advice. 
        The analysis may not be 100% accurate and is not a replacement for a licensed professional. 
        Please consult a licensed professional for any health concerns or more accurate and personalized information.
      </p>

      <div className="user-info">
        <p>Welcome, {user.email}</p>
        <button onClick={() => setIsModalOpen(true)} style={{ marginRight: 10 }}>
          Update Password
        </button>
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
      <strong>{p.name || "Unnamed Product"}</strong> ({p.type || "unspecified"})
      <span> — {(p.useTime && p.useTime.length ? p.useTime.join("/") : "unspecified")}</span>
    </div>
    <button
      onClick={() => handleDeleteProduct(p.id)}
      aria-label={`Delete ${p.name || "product"}`}
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
            {loading ? "Analyzing your routine, please wait a moment ..." : "Analyze Skincare Products"}
          </button>

         <p className="analysis-disclaimer">
  If the analysis fails, try refreshing the page and trying again.
  If the problem persists, contact me on <a href="https://x.com/sylvariae" target="_blank" rel="noopener noreferrer">Twitter</a>.
</p>

          {error && <p className="error-message">Error: {error}</p>}

          {analysisResult && analysisResult.products && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Analysis Result:</h3>
              <ul>
                {(analysisResult.products || []).map((p, i) => (
  <li key={i}>
    <strong>{p.name || "Unnamed Product"}</strong>: {p.description || "No description"}
    <br />
    <em>
      Use: {(p.usageTime && p.usageTime.length ? p.usageTime.join(', ') : "unspecified")},
      {p.frequency || "unspecified"}
    </em>
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
      {analysisResult.conflicts.map((conflict, i) => {
        // Make sure products is a string
        let productsStr = "unknown";
        if (Array.isArray(conflict.products)) {
          productsStr = conflict.products
            .map(p => (typeof p === "string" ? p : JSON.stringify(p)))
            .join(" & ");
        } else if (typeof conflict.products === "string") {
          productsStr = conflict.products;
        }

        const reasonStr = typeof conflict.reason === "string"
          ? conflict.reason
          : JSON.stringify(conflict.reason) || "unspecified";

        return (
          <li key={i}>
            ⚠️ <strong>{productsStr}</strong>: {reasonStr}
          </li>
        );
      })}
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
                  style={{ 
                    padding: '0.5rem', 
                    width: '100%', 
                    maxWidth: 300, 
                    border: '2px solid #d9a8c9', 
                    marginRight: '1rem',
                  }}
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

      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            setIsModalOpen(false);
            setCurrentPassword("");
            setNewPassword("");
            setPasswordUpdateStatus(null);
            setReauthError(null);
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Update Password</h3>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="modal-input"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="modal-input"
            />
            {reauthError && <p className="modal-error">{reauthError}</p>}
            {passwordUpdateStatus && (
              <p className={`modal-status ${passwordUpdateStatus.includes("Error") ? 'error' : 'success'}`}>
                {passwordUpdateStatus}
              </p>
            )}
            <button onClick={handleUpdatePassword} className="modal-button update-button">
              Update Password
            </button>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setCurrentPassword("");
                setNewPassword("");
                setPasswordUpdateStatus(null);
                setReauthError(null);
              }}
              className="modal-button cancel-button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
