import { useState } from "react";
import Tabs from "../../components/ui/Tabs";
import PersonasPanel from "./PersonasPanel";
import StylesPanel from "./StylesPanel";
import TemplatesPanel from "./TemplatesPanel";
import FeedbackPanel from "./FeedbackPanel";

export default function ContentHub() {
  const [tab, setTab] = useState("personas");
  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { value: "personas", label: "Personas" },
            { value: "styles", label: "Styles" },
            { value: "templates", label: "Thumbnail templates" },
            { value: "feedback", label: "Feedback" },
          ]}
        />
      </div>
      {tab === "personas" && <PersonasPanel />}
      {tab === "styles" && <StylesPanel />}
      {tab === "templates" && <TemplatesPanel />}
      {tab === "feedback" && <FeedbackPanel />}
    </div>
  );
}
