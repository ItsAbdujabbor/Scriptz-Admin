import { useState } from "react";
import Tabs from "../../components/ui/Tabs";
import StylesPanel from "./StylesPanel";
import TemplatesPanel from "./TemplatesPanel";
import FeedbackPanel from "./FeedbackPanel";

// Personas are no longer managed from the admin side. Every persona row
// is scoped to its creator via `user_id` and is only visible to that
// user inside the end-user app. Admins can run the one-shot
// `/api/admin/personas/purge-stock` endpoint from the API to wipe
// legacy `user_id IS NULL` rows.
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
            { value: "templates", label: "Thumbnail templates" },
            { value: "feedback", label: "Feedback" },
          ]}
        />
      </div>
      {tab === "styles" && <StylesPanel />}
      {tab === "templates" && <TemplatesPanel />}
      {tab === "feedback" && <FeedbackPanel />}
    </div>
  );
}
