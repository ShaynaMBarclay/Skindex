import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  };
  
  return (
    <div className="login-container">
      <form className="login-wrapper" onSubmit={handleSubmit}>
        <h2 className="login-title">Login</h2>
        {error && <p className="login-error">{error}</p>}
        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <div className="login-button-wrapper">
        <button className="login-button" type="submit">Login</button>
       </div>
      </form>
    </div>
  );
}