import React from "react";

function Register() {
  const [form, setForm] = React.useState({ login: "", password: "" });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  return (
    <form className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <label htmlFor='login'>Login</label>
      <input
        onChange={handleChange}
        type='text'
        id='login'
        className='border border-gray-300 p-2 rounded mb-4'
      />
      <label htmlFor='email'>Email</label>
      <input
        onChange={handleChange}
        type='email'
        id='email'
        className='border border-gray-300 p-2 rounded mb-4'
      />

      <label htmlFor='password'>Password</label>
      <input
        onChange={handleChange}
        type='password'
        id='password'
        className='border border-gray-300 p-2 rounded mb-4'
      />
      <label htmlFor='confirmPassword'>Confirm Password</label>
      <input
        onChange={handleChange}
        type='password'
        id='confirmPassword'
        className='border border-gray-300 p-2 rounded mb-4'
      />
      <button type='submit' className='bg-blue-500 text-white p-2 rounded'>
        Submit
      </button>
    </form>
  );
}

export default Register;
