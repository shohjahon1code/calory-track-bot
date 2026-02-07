import React from "react";
import { motion } from "framer-motion";

interface Segment {
  id: string;
  label: string;
}

interface SegmentedControlBaseProps {
  onChange: (id: string) => void;
}

interface SegmentedControlSegmentsProps extends SegmentedControlBaseProps {
  segments: Segment[];
  active: string;
  options?: never;
  selected?: never;
}

interface SegmentedControlOptionsProps {
  options: string[];
  selected: number;
  onChange: (index: number) => void;
  segments?: never;
  active?: never;
}

type SegmentedControlProps = SegmentedControlSegmentsProps | SegmentedControlOptionsProps;

const SegmentedControl: React.FC<SegmentedControlProps> = (props) => {
  // Normalize to segments format
  const segments: Segment[] = props.segments
    ? props.segments
    : (props.options || []).map((label, i) => ({ id: String(i), label }));

  const activeId = props.segments
    ? props.active
    : String(props.selected ?? 0);

  const handleChange = (id: string) => {
    if (props.segments) {
      (props.onChange as (id: string) => void)(id);
    } else {
      (props.onChange as (index: number) => void)(Number(id));
    }
  };

  return (
    <div className="relative flex bg-slate-100 rounded-xl p-1">
      {segments.map((segment) => {
        const isActive = segment.id === activeId;
        return (
          <button
            key={segment.id}
            onClick={() => handleChange(segment.id)}
            className={`relative z-10 flex-1 py-2 text-xs font-bold text-center transition-colors duration-200 rounded-lg ${
              isActive ? "text-slate-900" : "text-slate-400"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="segment-indicator"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
