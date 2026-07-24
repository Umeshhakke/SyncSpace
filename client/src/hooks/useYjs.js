import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

/**
 * Custom React hook to initialize and manage Yjs real-time collaborative state.
 * Exposes a Y.Doc, a WebsocketProvider, an awareness presence instance, and shared structures.
 * Handles proper resource cleanup when the room changes or component unmounts.
 * 
 * @param {string} roomId - The dynamic room identifier
 * @returns {Object} Yjs connection states { doc, provider, awareness, shapesArray, metaMap, codeText }
 */
const useYjs = (roomId) => {
  const [yjsInstances, setYjsInstances] = useState({
    doc: null,
    provider: null,
    awareness: null,
    shapesArray: null,
    metaMap: null,
    codeText: null,
  });

  useEffect(() => {
    // If no room is active, reset instances and do not connect
    if (!roomId) {
      setYjsInstances({
        doc: null,
        provider: null,
        awareness: null,
        shapesArray: null,
        metaMap: null,
        codeText: null,
      });
      return;
    }

    // 1. Create a new Yjs Document instance (Stores collaborative structures)
    const doc = new Y.Doc();

    // 2. Read the server URL from Vite environment variables (VITE_YJS_SERVER_URL)
    // Fallback to local default port 1234
    const serverUrl = import.meta.env.VITE_YJS_SERVER_URL || "ws://localhost:1234";

    // 3. Initialize the WebsocketProvider to handle connection & state sync
    const provider = new WebsocketProvider(serverUrl, roomId, doc);

    // 4. Access the shared Yjs Array for shape drawings (named "shapes" as required)
    const shapesArray = doc.getArray("shapes");

    // 5. Access the shared Yjs Map for editor metadata (named "meta")
    const metaMap = doc.getMap("meta");

    // PART 1: Access the shared Yjs Text for real-time code editing (named "code")
    const codeText = doc.getText("code");

    // 6. Access the awareness instance for user cursor/state sharing
    const awareness = provider.awareness;

    // Save the created instances to React state to share with consuming hooks/components
    setYjsInstances({
      doc,
      provider,
      awareness,
      shapesArray,
      metaMap,
      codeText,
    });

    // 7. Cleanup function to close connections and prevent memory leaks
    return () => {
      if (provider) {
        provider.destroy();
      }
      if (doc) {
        doc.destroy();
      }
    };
  }, [roomId]);

  return yjsInstances;
};

export default useYjs;
