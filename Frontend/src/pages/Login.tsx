import React from "react";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [form, setForm] = React.useState({ login: "", password: "" });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const redirectTo = (location.state as any)?.from?.pathname || "/";
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await axios.post(
        "/api/auth/login",
        {
          email: form.login,
          password: form.password,
        },
        { withCredentials: true }
      );
      await refresh();
      setSuccess(true);
      setForm({ login: "", password: "" });
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Błąd logowania");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col items-center justify-center min-h-screen bg-gray-100'
    >
      <label htmlFor='login'>Login</label>
      <input
        name='login'
        value={form.login}
        onChange={handleChange}
        type='email'
        id='login'
        className='border border-gray-300 p-2 rounded mb-4 w-64'
        required
      />
      <label htmlFor='password'>Password</label>
      <input
        name='password'
        value={form.password}
        onChange={handleChange}
        type='password'
        id='password'
        className='border border-gray-300 p-2 rounded mb-4 w-64'
        required
      />
      <p className='text-sm text-gray-500 mb-4'>
        Jeśli nie masz konta,{" "}
        <Link to='/register' className='text-blue-500'>
          {" "}
          zarejestruj się.
        </Link>
      </p>
      <button type='submit' disabled={loading} className='bg-blue-500 text-white p-2 rounded'>
        {loading ? "Logowanie..." : "Zaloguj"}
      </button>
      {error && <p className='text-red-600 mt-2 text-sm w-64 text-center'>{error}</p>}
      {success && <p className='text-green-600 mt-2 text-sm w-64 text-center'>Zalogowano</p>}
    </form>
  );
}

export default Login;
