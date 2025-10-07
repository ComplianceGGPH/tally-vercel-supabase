"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [from, setFrom] = useState(null); // null until hydrated
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const param = searchParams.get("from");
    setFrom(param || "/kanban");
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!from) return; // wait until 'from' is ready

    setIsLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      router.replace(from);
    } else {
      alert("Invalid password");
      setIsLoading(false);
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
      <button
        type="submit"
        className="border-2 border-gray-600 rounded-md pl-2 pr-2 border-r"
        disabled={isLoading || !from}
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
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