"use client";

import React, { useEffect } from "react";
import { TemplateEditorProvider } from "./TemplateEditorContext";
import EditorLayout from "./EditorLayout";
import { Recipe } from "@/types/video";
// import { useAuth } from "../../lib/contexts/AuthContext"; // Path to actual AuthContext - commented out for now

interface TemplateEditorV2Props {
  templateId?: string;
  className?: string;
  initialRecipe?: Recipe;
}

export const TemplateEditorV2: React.FC<TemplateEditorV2Props> = ({ 
  templateId, 
  className = "",
  initialRecipe 
}) => {
  // const { user } = useAuth(); // Use the auth context - commented out for now

  return (
    <div 
      className={`h-full flex flex-col ${className}`}
      data-testid="template-editor-v2"
    >
      {/* {user && <div data-testid="user-id-display">{user.id}</div>} Display user ID - commented out for now */}
      <TemplateEditorProvider initialRecipe={initialRecipe}>
        <EditorLayout />
      </TemplateEditorProvider>
    </div>
  );
};

export default TemplateEditorV2; 