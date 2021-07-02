import React, { lazy, Suspense } from "react";
import { HashRouter, Route, Switch } from "react-router-dom";

const Files = lazy(() => import("./Files"));
const Viewer = lazy(() => import("./Viewer"));
const ReadingStats = lazy(() => import("./ReadingStats"));
const Login = lazy(() => import("./Login"));
const NoMatch = lazy(() => import("./NoMatch"));

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div></div>}>
        <Switch>
          <Route path="/" exact component={Files}/>
          <Route path="/viewer/:id" component={Viewer}/>
          <Route path="/statistics" component={ReadingStats}/>
          <Route path="/login" component={Login}/>
          <Route component={NoMatch}/>
        </Switch>
      </Suspense>
    </HashRouter>
  );
}
