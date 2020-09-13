import React, { lazy, Suspense } from "react";
import { HashRouter, Route, Switch } from "react-router-dom";

const Files = lazy(() => import("./Files"));
const Viewer = lazy(() => import("./Viewer"));
const NoMatch = lazy(() => import("./NoMatch"));

export default function App() {
  return (
    <HashRouter>
      <main>
        <Suspense fallback={<div></div>}>
          <Switch>
            <Route path="/" exact component={Files}/>
            <Route path="/viewer/:id" component={Viewer}/>
            <Route component={NoMatch}/>
          </Switch>
        </Suspense>
      </main>
    </HashRouter>
  );
}
