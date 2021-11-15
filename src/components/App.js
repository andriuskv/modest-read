import { lazy, Suspense } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { UserProvider } from "../context/user-context";

const Files = lazy(() => import("./Files"));
const Viewer = lazy(() => import("./Viewer"));
const Statistics = lazy(() => import("./Statistics"));
const Login = lazy(() => import("./Login"));
const Register = lazy(() => import("./Register"));
const NoMatch = lazy(() => import("./NoMatch"));

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
