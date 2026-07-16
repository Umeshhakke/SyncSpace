import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

/**
 * Custom React hook to initialize and manage Yjs real-time collaborative state.
 * Creates a Y.Doc, initializes a WebsocketProvider for the given roomId,
 * and handles proper resource cleanup on unmount or roomId change.
 * 
 * @param {string} roomId - The dynamic room identifier
 * @returns {Object} Yjs instances { doc, provider, awareness, shapesArray }
 */
const useYjs = (roomId) => {
  const [yjsInstances, setYjsInstances] = useState({
    doc: null,
    provider: null,
    awareness: null,
    shapesArray: null,
  });

  useEffect(() => {
    // If no room is active, reset instances and do not connect
    if (!roomId) {
      setYjsInstances({
        doc: null,
        provider: null,
        awareness: null,
        shapesArray: null,
      });
      return;
    }

    // 1. Create a new Yjs Document instance
    const doc = new Y.Doc();

    // 2. Read the server URL from the environment variables (Vite-specific) or fallback
    const serverUrl = import.meta.env.VITE_YJS_SERVER_URL || "ws://localhost:1234";

    // 3. Initialize the WebsocketProvider
    // Parameters: connection URL, room name (roomId), and Y.Doc instance
    const provider = new WebsocketProvider(serverUrl, roomId, doc);

    // 4. Access the shared Yjs Array for shape drawings
    const shapesArray = doc.getArray("shapes");

    // 5. Access the awareness instance for real-time cursor/user state
    const awareness = provider.awareness;

    // Update state to make these instances available to the consuming component
    setYjsInstances({
      doc,
      provider,
      awareness,
      shapesArray,
    });

    // 6. Cleanup function called on roomId change or component unmount
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
