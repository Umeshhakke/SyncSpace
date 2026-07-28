import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const YjsContext = createContext(null);

export const useYjs = () => {
  const context = useContext(YjsContext);
  // Throw only if there is no Provider (context is undefined)
  if (context === undefined) {
    throw new Error('useYjs must be used within a YjsProvider');
  }
  return context; // could be null (loading) or the actual Yjs instance
};

export const YjsProvider = ({ roomId, children }) => {
  const [yjs, setYjs] = useState(null);

  useEffect(() => {
    if (!roomId) {
      setYjs(null);
      return;
    }

    const doc = new Y.Doc();
    const serverUrl = import.meta.env.VITE_YJS_SERVER_URL || 'ws://localhost:5000';
    const provider = new WebsocketProvider(serverUrl, roomId, doc);
    const awareness = provider.awareness;
    const shapesArray = doc.getArray('shapes');

    setYjs({ doc, provider, awareness, shapesArray });

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [roomId]);

  return <YjsContext.Provider value={yjs}>{children}</YjsContext.Provider>;
};