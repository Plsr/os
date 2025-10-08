import { useState } from "react";
import "./App.css";
import { Desktop } from "./components/Desktop";
import { DesktopIcon } from "./components/DesktopIcon";
import { Window } from "./components/Window";

interface App {
  id: string;
  icon: string;
  label: string;
}

interface OpenWindow {
  id: string;
  appId: string;
  title: string;
  content: string;
  zIndex: number;
  position: { x: number; y: number };
}

const desktopApps: App[] = [
  { id: "app-1", icon: "📁", label: "Files" },
  { id: "app-2", icon: "🎵", label: "Music" },
  { id: "app-3", icon: "🖼️", label: "Photos" },
  { id: "app-4", icon: "⚙️", label: "Settings" },
  { id: "app-5", icon: "📝", label: "Notes" },
  { id: "app-6", icon: "🌐", label: "Browser" },
];

function App() {
  const [windows, setWindows] = useState<OpenWindow[]>([
    {
      id: "window-1",
      appId: "app-1",
      title: "Files",
      content:
        "Welcome to the Files application! Your documents are organized here.",
      zIndex: 2,
      position: { x: 100, y: 100 },
    },
    {
      id: "window-2",
      appId: "app-5",
      title: "Notes",
      content: "Start writing your notes here. This is a simple text editor.",
      zIndex: 1,
      position: { x: 140, y: 140 },
    },
  ]);
  const [nextZIndex, setNextZIndex] = useState(3);

  const handleIconDoubleClick = (app: App) => {
    // Check if window is already open
    const existingWindow = windows.find((w) => w.appId === app.id);
    if (existingWindow) {
      // Bring to front
      setWindows((wins) =>
        wins.map((w) =>
          w.id === existingWindow.id ? { ...w, zIndex: nextZIndex } : w
        )
      );
      setNextZIndex((z) => z + 1);
      return;
    }

    // Open new window
    const newWindow: OpenWindow = {
      id: `window-${Date.now()}`,
      appId: app.id,
      title: app.label,
      content: `This is the ${app.label} application. Double-click icons to open more windows!`,
      zIndex: nextZIndex,
      position: { x: 100 + windows.length * 40, y: 100 + windows.length * 40 },
    };
    setWindows([...windows, newWindow]);
    setNextZIndex((z) => z + 1);
  };

  const handleCloseWindow = (windowId: string) => {
    setWindows((wins) => wins.filter((w) => w.id !== windowId));
  };

  const handleWindowFocus = (windowId: string) => {
    setWindows((wins) =>
      wins.map((w) => (w.id === windowId ? { ...w, zIndex: nextZIndex } : w))
    );
    setNextZIndex((z) => z + 1);
  };

  const handleWindowDragEnd = (
    windowId: string,
    delta: { x: number; y: number }
  ) => {
    setWindows((wins) =>
      wins.map((w) =>
        w.id === windowId
          ? {
              ...w,
              position: {
                x: w.position.x + delta.x,
                y: w.position.y + delta.y,
              },
            }
          : w
      )
    );
  };

  return (
    <Desktop windows={windows} onWindowDragEnd={handleWindowDragEnd}>
      <div className="desktop-icons">
        {desktopApps.map((app) => (
          <DesktopIcon
            key={app.id}
            id={app.id}
            icon={app.icon}
            label={app.label}
            onDoubleClick={() => handleIconDoubleClick(app)}
          />
        ))}
      </div>

      {windows.map((window) => (
        <Window
          key={window.id}
          id={window.id}
          title={window.title}
          position={window.position}
          initialSize={{ width: 500, height: 350 }}
          zIndex={window.zIndex}
          onClose={() => handleCloseWindow(window.id)}
          onFocus={() => handleWindowFocus(window.id)}
        >
          <p>{window.content}</p>
        </Window>
      ))}
    </Desktop>
  );
}

export default App;
