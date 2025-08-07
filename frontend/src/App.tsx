import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import DataPage from "./pages/DataPage";
import MainLayout from "./pages/MainLayout";
import ChatBox from "./components/ChatBox/ChatBox";
import { fetchMe } from "./store/userSlice";
import api from "./api/client";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useSelector((state: RootState) => state.user.token);
  const [valid, setValid] = React.useState(true);

  React.useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
  }, [token]);

  if (!valid) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const App: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector((state: any) => state.user.user);
  const token = useSelector((state: any) => state.user.token);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe());
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="chat" element={<ChatBox />} />
          <Route path="data" element={<DataPage />} />
          {/* Add more routes as needed */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;