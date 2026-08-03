import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from "react-router-dom";
import { WhiteboardProvider } from "./components/whiteboard/context/WhiteboardContext";
import Header from "./components/layout/Header";
import Workspace from "./components/layout/Workspace";
import StatusBar from "./components/layout/StatusBar";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import Home from "./pages/Home";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/Joinroom";

/** The main collaborative workspace page, mounted at /room/:roomId */
function RoomPage() {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();

    // Username from URL query param (set by Create/Join pages)
    const username = searchParams.get("username") || undefined;

    // Guard: redirect to home if no roomId provided
    if (!roomId) {
        return <Navigate to="/" replace />;
    }

    return (
        <WorkspaceProvider roomId={roomId} username={username}>
            <WhiteboardProvider>
                <div className="h-screen bg-slate-100 p-1">
                    <div className="h-full flex flex-col gap-2">
                        <Header />
                        <Workspace />
                        <StatusBar />
                    </div>
                </div>
            </WhiteboardProvider>
        </WorkspaceProvider>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Classic Landing page */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/home" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Create a new room (generates unique room code) */}
                <Route path="/create" element={<CreateRoom />} />

                {/* Join an existing room by code */}
                <Route path="/join" element={<JoinRoom />} />

                {/* The actual collaborative workspace */}
                <Route path="/room/:roomId" element={<RoomPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
