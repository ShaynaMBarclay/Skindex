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
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import Signup from "./components/Signup";
import Login from "./components/Login";


export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [showSignup, setShowSignup] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setProducts([]); // Clear products when user changes
      if (currentUser) {
        // Listen for products for this user in real time
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

  // Add product under current user's collection
  const handleAddProduct = async (newProduct) => {
    if (!user) {
      alert("You must be logged in to add products.");
      return;
    }
    try {
      const productsRef = collection(db, "users", user.uid, "products");
      const docRef = await addDoc(productsRef, newProduct);
      console.log("Saved with ID:", docRef.id);
      // No need to update state manually, onSnapshot handles it
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

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
      <h1
        style={{ textAlign: "center", marginTop: "2rem", color: "#e75480" }}
      >
        The Skindex
      </h1>
      <div style={{ maxWidth: 400, margin: "1rem auto", textAlign: "center" }}>
        <p>Welcome, {user.email}</p>
        <button onClick={handleLogout}>Log Out</button>
      </div>

      <ProductForm onSubmit={handleAddProduct} />

      {products.length > 0 && (
        <div style={{ maxWidth: "600px", margin: "2rem auto" }}>
          <h3>Added Products:</h3>
          <ul>
            {products.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong> ({p.type}) — {p.useTime.join("/")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}