import React, { useState } from "react";
import {
  BUILT_IN_TRANSFORMATIONS,
  getTransformationById,
  serializeTransformationPipeline,
  deserializeTransformationPipeline,
} from "../../utils/transformations";
import useMedia from "../../hooks/useMedia";
/**

 * TransformationPanel for MemeMaker
 * Lets user:
 *  - Select a transformation (from built-in list)
 *  - Configure its options/parameters
 *  - Sequence multiple transformations
 *  - Reorder/remove/edit configurations in sequence
 *  - (For now, just manages the transformation list in context, not previewing)
 *
 * Future extension: audio synchronization and "apply" previews.
 */
// PUBLIC_INTERFACE
function TransformationPanel() {
  // Move useMedia call into component body for hook rules compliance
  const { transformations, setTransformations } = useMedia();

  // Local editing state for UI
  // Format: [{ id, config }, ...]
  const [editList, setEditList] = useState(
    Array.isArray(transformations) ? transformations : []
  );
  const [adding, setAdding] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(""); // id of new
  const [editingIndex, setEditingIndex] = useState(null);

  // Basic, non-destructive sync to context
  React.useEffect(() => {
    setTransformations(editList);
    // eslint-disable-next-line
  }, [editList]);

  // Helpers - manage pipeline
  function handleAdd() {
    if (!selectedPreset) return;
    const def = getTransformationById(selectedPreset);
    if (!def) return;
    setEditList(list =>
      list.concat([
        { id: def.id, config: { ...def.config } }
      ])
    );
    setSelectedPreset("");
    setAdding(false);
    setEditingIndex(editList.length); // Open config popup for editing if wanted
  }

  function handleRemove(idx) {
    setEditList(list => list.filter((_, i) => i !== idx));
    if (editingIndex === idx) setEditingIndex(null);
  }

  function handleEdit(idx) {
    setEditingIndex(idx);
  }
  function handleMove(idx, dir) {
    if (
      (idx === 0 && dir === -1) ||
      (idx === editList.length - 1 && dir === 1)
    )
      return;
    const newList = [...editList];
    const [removed] = newList.splice(idx, 1);
    newList.splice(idx + dir, 0, removed);
    setEditList(newList);
  }

  function handleConfigChange(idx, name, value) {
    setEditList(list =>
      list.map((item, i) =>
        i === idx
          ? {
              ...item,
              config: {
                ...item.config,
                [name]: value
              }
            }
          : item
      )
    );
  }

  // --- UI Form controls ---
  function renderConfigForm(def, idx, cfg, onChange) {
    if (!def.configSpec || def.configSpec.length === 0) {
      return <div style={{ fontSize: 13, color: "#AAA" }}>No options</div>;
    }
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {def.configSpec.map(spec => {
          const key = spec.name;
          switch (spec.type) {
            case "slider":
              return (
                <label key={key} style={{ display: "flex", flexDirection: "column", marginBottom: 5 }}>
                  <span style={{ fontWeight: 500, marginBottom: 2 }}>{spec.label}</span>
                  <input
                    type="range"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={cfg[key] ?? spec.default}
                    onChange={e => onChange(idx, key, Number(e.target.value))}
                  />
                  <span style={{ fontSize: 12 }}>{cfg[key] ?? spec.default}</span>
                </label>
              );
            case "text":
              return (
                <label key={key} style={{ display: "flex", flexDirection: "column", marginBottom: 5 }}>
                  <span style={{ fontWeight: 500, marginBottom: 2 }}>{spec.label}</span>
                  <input
                    type="text"
                    value={cfg[key] ?? spec.default}
                    onChange={e => onChange(idx, key, e.target.value)}
                    style={{ padding: "4px 6px", fontSize: 15, borderRadius: 2 }}
                  />
                </label>
              );
            case "color":
              return (
                <label key={key} style={{ display: "flex", flexDirection: "column", marginBottom: 5 }}>
                  <span style={{ fontWeight: 500, marginBottom: 2 }}>{spec.label}</span>
                  <input
                    type="color"
                    value={cfg[key] ?? spec.default}
                    onChange={e => onChange(idx, key, e.target.value)}
                  />
                </label>
              );
            case "select":
              return (
                <label key={key} style={{ display: "flex", flexDirection: "column", marginBottom: 5 }}>
                  <span style={{ fontWeight: 500, marginBottom: 2 }}>{spec.label}</span>
                  <select
                    value={cfg[key] ?? spec.default}
                    onChange={e => onChange(idx, key, e.target.value)}
                  >
                    {spec.options.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div
      style={{
        background: "rgba(24,24,24,0.98)",
        border: "1px solid var(--border-color, #272727)",
        borderRadius: 8,
        margin: "20px 0 34px 0",
        padding: "22px 20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.09)",
        maxWidth: 540,
        width: "100%"
      }}
    >
      <h3 style={{ margin: 0, color: "var(--kavia-orange,#E87A41)", fontSize: "1.22rem" }}>
        Transformations
      </h3>
      <div style={{ fontSize: "1.01rem", color: "var(--text-secondary)", marginBottom: 16 }}>
        Select and order the visual effects you want to apply to your meme!
      </div>
      {/* List of applied transformations */}
      <ol style={{ padding: 0, margin: 0, marginBottom: 18 }}>
        {editList.length === 0 && (
          <div
            style={{
              fontSize: 14,
              color: "#b99",
              margin: "7px 0 12px 0",
              background: "rgba(255,200,128,0.04)",
              padding: "10px",
              borderRadius: 4
            }}
          >
            No transformations in your sequence yet.
          </div>
        )}
        {editList.map((tr, idx) => {
          const def = getTransformationById(tr.id);
          return (
            <li
              key={idx}
              style={{
                background: editingIndex === idx ? "rgba(255,170,80,0.07)" : "#181818",
                border: "1px solid #262627",
                borderRadius: 6,
                margin: "0 0 13px 0",
                padding: "11px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 7
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontWeight: 600, color: "#fff" }}>{def?.label || tr.id}</span>
                  <span style={{ fontSize: 12, marginLeft: 6, color: "#888" }}>
                    ({def?.type})
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn" style={{ padding: "2px 10px" }} type="button" onClick={() => handleEdit(idx)}>
                    Edit
                  </button>
                  <button className="btn" style={{ padding: "2px 10px" }} type="button" onClick={() => handleRemove(idx)}>
                    Delete
                  </button>
                  <button
                    className="btn"
                    style={{ padding: "2px 8px" }}
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                  >
                    ↑
                  </button>
                  <button
                    className="btn"
                    style={{ padding: "2px 8px" }}
                    type="button"
                    disabled={idx === editList.length - 1}
                    onClick={() => handleMove(idx, 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
              {/* Config UI */}
              {editingIndex === idx && def ? (
                <div
                  style={{
                    background: "#212127",
                    border: "1px solid #282829",
                    borderRadius: 4,
                    marginTop: 5,
                    padding: "10px 8px 11px 12px"
                  }}
                >
                  {renderConfigForm(def, idx, tr.config, handleConfigChange)}
                  <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                    <button
                      className="btn"
                      style={{ fontSize: 14, padding: "3px 14px" }}
                      type="button"
                      onClick={() => setEditingIndex(null)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                def?.description && (
                  <div style={{ fontSize: 13, color: "#888", marginLeft: 2 }}>{def.description}</div>
                )
              )}
            </li>
          );
        })}
      </ol>

      {/* Add transformation */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {!adding && (
          <button
            className="btn"
            type="button"
            style={{ padding: "4px 18px" }}
            onClick={() => setAdding(true)}
          >
            + Add Effect
          </button>
        )}
        {adding && (
          <>
            <select
              value={selectedPreset}
              onChange={e => setSelectedPreset(e.target.value)}
              style={{
                padding: "7px 12px",
                fontSize: 14,
                borderRadius: 4,
                marginRight: 8
              }}
            >
              <option value="">-- Select Effect --</option>
              {BUILT_IN_TRANSFORMATIONS.map(tr => (
                <option key={tr.id} value={tr.id}>
                  {tr.label} {tr.type === "filter" ? "🌈" : tr.type === "caption" ? "💬" : ""}
                </option>
              ))}
            </select>
            <button
              className="btn"
              type="button"
              style={{ padding: "5px 19px" }}
              disabled={!selectedPreset}
              onClick={handleAdd}
            >
              Add
            </button>
            <button
              className="btn"
              type="button"
              style={{ padding: "4px 12px", marginLeft: 5 }}
              onClick={() => {
                setAdding(false);
                setSelectedPreset("");
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default TransformationPanel;
