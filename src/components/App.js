import React, { lazy, Suspense } from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { UserProvider } from "../context/user-context";

const Files = lazy(() => import("./Files"));
const Viewer = lazy(() => import("./Viewer"));
const ReadingStats = lazy(() => import("./ReadingStats"));
const Login = lazy(() => import("./Login"));
const Register = lazy(() => import("./Register"));
const NoMatch = lazy(() => import("./NoMatch"));

export default function App() {
  return (
    <HashRouter>
      <UserProvider>
        <Suspense fallback={null}>
          <Switch>
            <Route path="/" exact component={Files}/>
            <Route path="/viewer/:id" component={Viewer}/>
            <Route path="/statistics" component={ReadingStats}/>
            <Route path="/login" component={Login}/>
            <Route path="/register" component={Register}/>
            <Route component={NoMatch}/>
          </Switch>
        </Suspense>
      </UserProvider>
    </HashRouter>
  );
}
