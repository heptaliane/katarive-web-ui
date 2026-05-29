import { AppProvider } from "./store/AppContext";
import { Header } from "./components/Header";
import { SourceCollections } from "./components/SourceCollections";
import { SourceCollectionDetail } from "./components/SourceCollectionDetail";
import { SourceItemNarration } from "./components/SourceItemNarration";
import "./App.css";

function Layout() {
  return (
    <div className="app-layout">
      <Header />
      <div className="app-main">
        <SourceCollections />
        <SourceCollectionDetail />
        <SourceItemNarration />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
