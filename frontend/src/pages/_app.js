
import "@/bones/registry";
import "@/styles/globals.css";
import { Provider } from "react-redux";
import { store } from "../config/redux/store";
import "@/styles/tokens.css";
import "@/styles/globals.css";


export default function App({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Component {...pageProps} />
    </Provider>
  );
}

