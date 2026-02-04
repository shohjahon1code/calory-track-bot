import React from "react";
import "./ProgressBar.css";

interface ProgressBarProps {
  current: number;
  goal: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, goal }) => {
  const percentage = Math.min(Math.round((current / goal) * 100), 100);
  const remaining = Math.max(goal - current, 0);

  const getStatusColor = () => {
    if (percentage >= 100) return "#ff3b30";
    if (percentage >= 90) return "#ff9500";
    return "#34c759";
  };

  return (
    <div className="progress-bar-container">
      <div className="progress-header">
        <h3>📊 Today's Progress</h3>
        <div className="progress-numbers">
          <span className="current">{current}</span>
          <span className="separator">/</span>
          <span className="goal">{goal}</span>
          <span className="unit">kcal</span>
        </div>
      </div>

      <div className="progress-bar-wrapper">
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{
              width: `${percentage}%`,
              backgroundColor: getStatusColor(),
            }}
          />
        </div>
        <div
          className="progress-percentage"
          style={{ color: getStatusColor() }}
        >
          {percentage}%
        </div>
      </div>

      <div className="progress-footer">
        {remaining > 0 ? (
          <span className="remaining">📉 {remaining} kcal remaining</span>
        ) : (
          <span className="exceeded">
            ⚠️ Goal exceeded by {Math.abs(remaining)} kcal
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
