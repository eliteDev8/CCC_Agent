import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import { useNavigate, useLocation, Link } from "react-router-dom";
import LoginForm from "../components/Auth/LoginForm";

const LoginPage: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      const from = (location.state as any)?.from?.pathname || "/chat";
      navigate(from, { replace: true });
    }
  }, [token, navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <LoginForm />
        <div className="mt-4 text-center text-sm">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;