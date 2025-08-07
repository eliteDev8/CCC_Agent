import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../../store/userSlice";
import type { RootState } from "../../store";
import { useNavigate } from "react-router-dom";

const RegisterForm: React.FC = () => {
  const dispatch = useDispatch<any>();
  const { loading, error, token } = useSelector((state: RootState) => state.user);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate("/chat", { replace: true });
  }, [token, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setLocalError("Passwords do not match");
      return;
    }
    setLocalError(null);
    dispatch(register({ email, password }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirm Password</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
      </div>
      {(localError || error) && <div className="text-red-500 text-sm">{localError || error}</div>}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? "Registering..." : "Register"}
      </button>
    </form>
  );
};

export default RegisterForm;