import { Suspense, lazy } from "react";

const Home = lazy(() => import("./pages/Home"));

function App() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  );
}

export default App;
