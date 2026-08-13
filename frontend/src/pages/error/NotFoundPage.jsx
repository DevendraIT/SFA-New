import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="text-center max-w-md bg-slate-800/90 border border-slate-700 p-8 md:p-10 rounded-3xl shadow-2xl">
        <h1 className="text-7xl font-black text-indigo-500 tracking-tight mb-2">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The page you are looking for does not exist or has been removed.
        </p>
        <button
          onClick={handleGoBack}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl transition shadow-lg cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
