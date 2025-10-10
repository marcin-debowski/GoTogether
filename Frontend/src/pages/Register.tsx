import axios from "axios";
import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";
  const { refresh } = useAuth();

  const [form, setForm] = React.useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const passwordsMatch = form.password === form.confirmPassword;
  const passwordStrongEnough = form.password.length >= 8; // minimalna reguła
  const canSubmit =
    form.name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    passwordStrongEnough &&
    passwordsMatch &&
    !loading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError("Hasła nie są takie same.");
      return;
    }
    if (!passwordStrongEnough) {
      setError("Hasło musi mieć co najmniej 8 znaków.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "/api/auth/register",
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        },
        { withCredentials: true }
      );
      // Backend ustawia cookie – odśwież usera i przejdź dalej
      await refresh();
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.status === 409
          ? "Użytkownik z takim emailem już istnieje."
          : err.response?.data?.message || err.message || "Błąd rejestracji";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'
    >
      <div className='w-full max-w-sm flex flex-col gap-3'>
        <h1 className='text-xl font-semibold text-center'>Rejestracja</h1>

        {error && (
          <p className='text-red-600 text-sm bg-red-50 border border-red-200 p-2 rounded'>
            {error}
          </p>
        )}

        <label htmlFor='name' className='text-sm font-medium'>
          Imię
        </label>
        <input
          onChange={handleChange}
          name='name'
          value={form.name}
          type='text'
          id='name'
          className='border border-gray-300 p-2 rounded'
          required
        />

        <label htmlFor='email' className='text-sm font-medium'>
          Email
        </label>
        <input
          onChange={handleChange}
          name='email'
          value={form.email}
          type='email'
          id='email'
          className='border border-gray-300 p-2 rounded'
          required
        />

        <label htmlFor='password' className='text-sm font-medium'>
          Hasło
        </label>
        <input
          onChange={handleChange}
          name='password'
          value={form.password}
          type='password'
          id='password'
          className='border border-gray-300 p-2 rounded'
          required
        />
        <p className='text-xs text-gray-500'>Minimum 8 znaków.</p>

        <label htmlFor='confirmPassword' className='text-sm font-medium'>
          Powtórz hasło
        </label>
        <input
          onChange={handleChange}
          name='confirmPassword'
          value={form.confirmPassword}
          type='password'
          id='confirmPassword'
          className='border border-gray-300 p-2 rounded'
          required
        />
        {!passwordsMatch && form.confirmPassword && (
          <p className='text-xs text-red-600'>Hasła muszą się zgadzać.</p>
        )}

        <button
          type='submit'
          disabled={!canSubmit}
          className='bg-blue-600 disabled:opacity-50 text-white p-2 rounded mt-2'
        >
          {loading ? "Rejestracja..." : "Zarejestruj się"}
        </button>

        <p className='text-sm text-gray-600 text-center'>
          Masz już konto?{" "}
          <Link to='/login' className='text-blue-600 hover:underline'>
            Zaloguj się
          </Link>
        </p>
      </div>
    </form>
  );
}

export default Register;
