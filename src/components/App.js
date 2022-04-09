import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { UserProvider } from "contexts/user-context";

const Files = lazy(() => import("components/Files"));
const Viewer = lazy(() => import("components/Viewer"));
const Statistics = lazy(() => import("components/Statistics"));
const Login = lazy(() => import("components/Login"));
const Register = lazy(() => import("components/Register"));
const NoMatch = lazy(() => import("components/NoMatch"));

export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Files/>}/>
            <Route path="/viewer/:id" element={<Viewer/>}/>
            <Route path="/statistics" element={<Statistics/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/register" element={<Register/>}/>
            <Route path="*" element={<NoMatch/>}/>
          </Routes>
        </Suspense>
      </UserProvider>
    </HashRouter>
  );
}
