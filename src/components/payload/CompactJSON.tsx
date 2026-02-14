"use client";

import React from "react";
import { useField } from "@payloadcms/ui";

export const CompactJSON: React.FC<{ path: string }> = ({ path }) => {
  const { value } = useField<Record<string, unknown>>({ path });

  if (!value) return null;

  const content = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);

  return (
    <div className="compact-json-wrapper">
      <label className="field-label" style={{ marginBottom: "5px", display: "block", fontSize: "13px", fontWeight: "bold" }}>
        JSON Data
      </label>
      <pre
        style={{
          maxHeight: "150px",
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: "12px",
          padding: "10px",
          backgroundColor: "#f3f4f6",
          borderRadius: "6px",
          border: "1px solid #e5e7eb",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          color: "#1f2937",
        }}
      >
        {content}
      </pre>
    </div>
  );
};

export default CompactJSON;
