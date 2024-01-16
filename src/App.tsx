import { Sidebar } from "./components/sidebar";
import { Editor } from "./pages/editor";
import { PackagePlus } from "./assets/package-plus";
import { Provider, createStore, useAtom } from "jotai";
import { store } from "./store";
import { DevTools } from "jotai-devtools";

const _store = createStore();

export default function App() {
  return (
    <Provider store={_store}>
      <InternalApp />
    </Provider>
  );
};

const InternalApp = () => {
  const [toggled, toggleTile] = useAtom(store.editor.newtile);

  return (
    <>
      <DevTools theme="dark"/> 
      <Editor />
      <Sidebar>
        <Sidebar.Item 
          Icon={PackagePlus} 
          active={toggled} 
          onClick={() => toggleTile()} 
          identifier="sidebar/toggle-tile" 
        />
      </Sidebar>
    </>
  );
}
