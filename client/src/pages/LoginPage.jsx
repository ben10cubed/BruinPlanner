export default function LoginPage({ onLogin }) {
  return (
    <div className="login-card">
      <h2>Dummy Login</h2>
      <p>Click to continue to the scheduler.</p>
      <button onClick={onLogin}>Login</button>
    </div>
  );
}
