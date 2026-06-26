import React from "react";
import { Button, Tooltip, Space, ButtonProps } from "antd";

export interface FloatingMenuAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  type?: "default" | "primary" | "dashed" | "link" | "text";
  danger?: boolean;
  style?: React.CSSProperties;
  buttonProps?: ButtonProps;
  iconOnly?: boolean; // New property to indicate if only the icon should be displayed
}

interface FloatingMenuProps {
  actions: FloatingMenuAction[];
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ actions }) => {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] flex items-center p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 transition-all duration-300 opacity-30 hover:opacity-100 hover:shadow-xl hover:scale-105">
      <Space size={10}>
        {actions.map((action) => (
          <Tooltip key={action.key} title={action.label} placement="top">
            <Button
              // shape="circle"
              size="small"
              shape="round"
              type={action.type}
              danger={action.danger}
              icon={action.icon}
              onClick={action.onClick}
              style={action.style}
              className="flex items-center justify-center transition-transform hover:scale-110"
              {...action.buttonProps}
            >
              {action.iconOnly ? null : action.label}
            </Button>
          </Tooltip>
        ))}
      </Space>
    </div>
  );
};
