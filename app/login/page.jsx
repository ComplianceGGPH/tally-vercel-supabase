"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/kanban';

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      router.push(from);
    } else {
      alert('Invalid password');
    }
  };

  return (
    <form onSubmit={handleLogin} className="login-form">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}