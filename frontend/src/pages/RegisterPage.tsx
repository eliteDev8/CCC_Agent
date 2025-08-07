import React from "react";
import RegisterForm from "../components/Auth/RegisterForm";

const RegisterPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
      <RegisterForm onSwitch={() => {}} />
    </div>
  </div>
);

export default RegisterPage; 