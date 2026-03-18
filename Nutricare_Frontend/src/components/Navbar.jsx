import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; //f

export default function Navbar() {
  const { user, logout } = useAuth();

  const navigate = useNavigate(); //f
  const handleLogout = async () => {
    await logout(); // clears session + user state
    navigate("/login"); // ✅ redirect to login page
  };

  return (
    <nav className="bg-teal-600 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">NutriCare </h1>
      <div className="space-x-4">
        {!user ? (
          <>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/register">Register</Link>
            <Link to="/login">Login</Link>
          </>
        ) : (
          <>
            <Link to="/user">User</Link>
            <Link to="/body-metrics">Body Metrics</Link>
            <Link to="/diets">Diet Generation</Link>

            <button
              onClick={handleLogout}
              className="bg-white text-teal-600 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
