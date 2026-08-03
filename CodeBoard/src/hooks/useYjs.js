import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

/**
 * Custom React hook to initialize and manage Yjs real-time collaborative state.
 * Exposes a Y.Doc, a WebsocketProvider, and an awareness presence instance.
 * Handles proper resource cleanup when the room changes or component unmounts.
 *
 * @param {string} roomId - The dynamic room identifier
 * @returns {Object} Yjs connection states { doc, provider, awareness, shapesArray, codeText, synced, providerStatus }
 */
const useYjs = (roomId) => {
  const [yjsInstances, setYjsInstances] = useState({
    doc: null,
    provider: null,
    awareness: null,
    shapesArray: null,
    codeText: null,
    synced: false,
    providerStatus: "connecting",
  });

  useEffect(() => {
    if (!roomId) {
      setYjsInstances({
        doc: null,
        provider: null,
        awareness: null,
        shapesArray: null,
        codeText: null,
        synced: false,
        providerStatus: "disconnected",
      });
      return;
    }

    const doc = new Y.Doc();
    const serverUrl = import.meta.env.VITE_YJS_SERVER_URL || "ws://localhost:5000";
    const provider = new WebsocketProvider(serverUrl, roomId, doc);

    const shapesArray = doc.getArray("shapes");
    const codeText = doc.getText("code");
    const awareness = provider.awareness;

    let statusHandler = null;
    let syncHandler = null;

    if (provider && provider.on) {
      statusHandler = (evt) => {
        const status = evt?.status || evt;
        setYjsInstances((prev) => ({
          ...prev,
          providerStatus: status === "connected" ? "Connected" : status === "disconnected" ? "Disconnected" : "Reconnecting",
          synced: status === "connected",
        }));
      };
      provider.on("status", statusHandler);

      syncHandler = (isSynced) => {
        setYjsInstances((prev) => ({
          ...prev,
          synced: !!isSynced,
          providerStatus: isSynced ? "Connected" : prev.providerStatus,
        }));
      };
      provider.on("sync", syncHandler);
    }

    setYjsInstances({
      doc,
      provider,
      awareness,
      shapesArray,
      codeText,
      synced: false,
      providerStatus: "Connecting",
    });

    return () => {
      try {
        if (provider && statusHandler) provider.off && provider.off("status", statusHandler);
        if (provider && syncHandler) provider.off && provider.off("sync", syncHandler);
      } catch (e) {
        // ignore cleanup errors
      }

      provider?.destroy();
      doc.destroy();
    };
  }, [roomId]);

  return yjsInstances;
};

export default useYjs;
