import { useEffect, useMemo, useRef, useState } from "react";
import type { Step } from "../types/steps";
import { getStepSummary } from "../utils/stepSummary";

interface StepPickerModalProps {
  isOpen: boolean;
  phaseLabel: string;
  steps: Step[];
  currentStepIndex: number;
  onClose: () => void;
  onSelectStep: (stepIndex: number) => void;
}

const StepPickerModal = ({
  isOpen,
  phaseLabel,
  steps,
  currentStepIndex,
  onClose,
  onSelectStep,
}: StepPickerModalProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeStepRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSteps = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return steps
      .map((step, index) => {
        const summary = getStepSummary(step);
        const stepNumber = index + 1;
        const searchText = `${stepNumber} ${step.type} ${summary}`.toLowerCase();

        return {
          index,
          stepNumber,
          step,
          summary,
          searchText,
        };
      })
      .filter((entry) => {
        if (!normalizedQuery) return true;
        return entry.searchText.includes(normalizedQuery);
      });
  }, [query, steps]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      activeStepRef.current?.scrollIntoView({
        block: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentStepIndex, filteredSteps, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="phase-modal-overlay" onClick={onClose}>
      <div
        className="step-picker-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="step-picker-modal__header">
          <div>
            <h2 className="phase-modal__title">Jump To Step</h2>
            <p className="phase-modal__body">{phaseLabel} phase steps</p>
          </div>
          <button
            type="button"
            className="phase-modal__button phase-modal__button--secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by step number or step name"
          className="step-picker-modal__search"
        />

        <div className="step-picker-modal__list">
          {filteredSteps.length === 0 ? (
            <div className="step-picker-modal__empty">
              No steps match your search.
            </div>
          ) : (
            filteredSteps.map((entry) => {
              const isActive = entry.index === currentStepIndex;

              return (
                <button
                  key={`${entry.step.type}-${entry.index}`}
                  ref={isActive ? activeStepRef : null}
                  type="button"
                  className={`step-picker-modal__item ${
                    isActive ? "step-picker-modal__item--active" : ""
                  }`}
                  onClick={() => {
                    onSelectStep(entry.index);
                    onClose();
                  }}
                >
                  <span className="step-picker-modal__item-index">
                    STEP {entry.stepNumber}
                  </span>
                  <span className="step-picker-modal__item-type">
                    {entry.step.type}
                  </span>
                  <span className="step-picker-modal__item-summary">
                    {entry.summary}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StepPickerModal;
