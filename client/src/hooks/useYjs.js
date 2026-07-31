import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

/**
 * Custom React hook to initialize and manage Yjs real-time collaborative state.
 * Exposes a Y.Doc, a WebsocketProvider, and an awareness presence instance.
 * Handles proper resource cleanup when the room changes or component unmounts.
 * 
 * @param {string} roomId - The dynamic room identifier
 * @returns {Object} Yjs connection states { doc, provider, awareness, shapesArray }
 */
const useYjs = (roomId) => {
  const [yjsInstances, setYjsInstances] = useState({
    doc: null,
    provider: null,
    awareness: null,
    shapesArray: null,
    codeText: null,
    synced: false,
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

    // 1. Create a new Yjs Document instance (Stores collaborative structures)
    const doc = new Y.Doc();

    // 2. Read the server URL from Vite environment variables (VITE_YJS_SERVER_URL)
    // Fallback to local default port 1234
    // 2. Read the server URL from Vite environment variables
const serverUrl = import.meta.env.VITE_YJS_SERVER_URL || "ws://localhost:5000";

console.log("Connecting to:", serverUrl, "Room:", roomId);

// 3. Initialize the WebsocketProvider
const provider = new WebsocketProvider(serverUrl, roomId, doc);

    // 4. Access shared Yjs structures
    const shapesArray = doc.getArray("shapes");
    // Shared text for collaborative code editor
    const codeText = doc.getText("code");

    // 5. Access the awareness instance for user cursor/state sharing
    const awareness = provider.awareness;

    // Listen to provider connection status to help debugging/syncing
    let statusHandler = null;
    let syncHandler = null;
    try {
      if (provider && provider.on) {
        statusHandler = (evt) => {
          // evt.status is 'connected' or 'disconnected' for older versions; adapt flexibly
          console.log('[useYjs] provider status:', evt && (evt.status || evt));
          setYjsInstances((prev) => ({ ...prev, synced: evt.status === 'connected' || evt === 'connected' }));
        };
        provider.on('status', statusHandler);

        // provider emits 'sync' event when initial sync completes in some versions
        syncHandler = (isSynced) => {
          console.log('[useYjs] provider sync event. synced=', isSynced);
          setYjsInstances((prev) => ({ ...prev, synced: !!isSynced }));
        };
        provider.on && provider.on('sync', syncHandler);
      }
    } catch (e) {
      // ignore
      console.warn('[useYjs] provider event wiring failed', e);
    }

    // Save the created instances to React state to share with consuming hooks/components
    setYjsInstances({
      doc,
      provider,
      awareness,
      shapesArray,
      codeText,
      synced: false,
    });

    // 6. Cleanup function to close connections and prevent memory leaks
    return () => {
      try {
        if (provider && statusHandler) provider.off && provider.off('status', statusHandler);
        if (provider && syncHandler) provider.off && provider.off('sync', syncHandler);
      } catch (e) {}

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
