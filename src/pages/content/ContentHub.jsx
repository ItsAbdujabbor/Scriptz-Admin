import { useState } from "react";
import Tabs from "../../components/ui/Tabs";
import StylesPanel from "./StylesPanel";
import PersonasPanel from "./PersonasPanel";
import FeedbackPanel from "./FeedbackPanel";

// Thumbnail templates were retired — the user-facing app no longer
// surfaces them, so the admin tab was dropped from this hub. Demo
// characters (admin-curated personas) and stock styles ARE shared
// across all users; both are managed here.
export default function ContentHub() {
  const [tab, setTab] = useState("styles");
  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "styles", label: "Styles" },
            { value: "characters", label: "Characters" },
            { value: "feedback", label: "Feedback" },
          ]}
        />
      </div>
      {tab === "styles" && <StylesPanel />}
      {tab === "characters" && <PersonasPanel />}
      {tab === "feedback" && <FeedbackPanel />}
    </div>
  );
}
