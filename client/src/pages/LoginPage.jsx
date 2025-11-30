export default function LoginPage({ onLogin }) {

  function fakeLogin() {
    onLogin(1);   // hardcoded userID for now
  }

  return (
    <div>
      <h2>Login Page</h2>
      <button onClick={fakeLogin}>
        Log In (always userID = 1)
      </button>
    </div>
  );
}
