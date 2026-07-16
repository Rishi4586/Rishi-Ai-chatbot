import { useEffect } from "react";
import { appMarkup } from "./appMarkup";

export default function App() {
  useEffect(() => {
    if (window.__chatbotLegacyScriptLoaded) {
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "/script.js";
    script.defer = true;
    window.__chatbotLegacyScriptLoaded = true;
    document.body.appendChild(script);

    return undefined;
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: appMarkup }} />;
}
