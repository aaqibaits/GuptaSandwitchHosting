import React, { useState, useEffect } from "react";
import {
  fetchIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../../../services/ingredientsApi";
import "./Ingredients.css";

const UNIT_OPTIONS = ["kg", "litre", "pack"];

const BLANK_FORM = {
  name: "",
  unit: "kg",
  cost_per_unit: "",
};

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add modal state
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState(BLANK_FORM);
  const [addErrors, setAddErrors] = useState({});
  const [addSaving, setAddSaving] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(BLANK_FORM);
  const [editId, setEditId] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load ingredients on mount ────────────────────────────
  const loadIngredients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchIngredients();
      setIngredients(data);
    } catch (err) {
      console.error("Failed to load ingredients:", err);
      setError("Failed to load ingredients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  // ── Form Validation ──────────────────────────────────────
  const validateForm = (form) => {
    const errors = {};
    if (!form.name || !form.name.trim()) {
      errors.name = "Ingredient name is required";
    }
    if (!form.unit || !UNIT_OPTIONS.includes(form.unit)) {
      errors.unit = "Please select a valid unit";
    }
    if (form.cost_per_unit === "" || form.cost_per_unit === undefined) {
      errors.cost_per_unit = "Cost per unit is required";
    } else if (isNaN(Number(form.cost_per_unit)) || Number(form.cost_per_unit) < 0) {
      errors.cost_per_unit = "Cost must be a valid positive number";
    }
    return errors;
  };

  // ── Add Modal Handlers ───────────────────────────────────
  const openAddModal = () => {
    setAddForm(BLANK_FORM);
    setAddErrors({});
    setAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(addForm);
    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    try {
      setAddSaving(true);
      await createIngredient({
        name: addForm.name.trim(),
        unit: addForm.unit,
        cost_per_unit: parseFloat(addForm.cost_per_unit),
      });
      setAddModal(false);
      setAddForm(BLANK_FORM);
      await loadIngredients();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to create ingredient";
      setAddErrors({ api: msg });
    } finally {
      setAddSaving(false);
    }
  };

  // ── Edit Modal Handlers ──────────────────────────────────
  const openEditModal = (ingredient) => {
    setEditId(ingredient.id);
    setEditForm({
      name: ingredient.name,
      unit: ingredient.unit,
      cost_per_unit: String(ingredient.cost_per_unit),
    });
    setEditErrors({});
    setEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    try {
      setEditSaving(true);
      await updateIngredient(editId, {
        name: editForm.name.trim(),
        unit: editForm.unit,
        cost_per_unit: parseFloat(editForm.cost_per_unit),
      });
      setEditModal(false);
      await loadIngredients();
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to update ingredient";
      setEditErrors({ api: msg });
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete Handlers ──────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await deleteIngredient(deleteTarget.id);
      setDeleteTarget(null);
      await loadIngredients();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="ingredients-page">
      {/* Header */}
      <div className="ingredients-header">
        <h2><i className="ti ti-salt"></i> Ingredients</h2>
        <button className="ing-add-btn" onClick={openAddModal}>
          <i className="ti ti-plus"></i> Add Ingredient
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="ing-loading">Loading ingredients…</div>
      ) : error ? (
        <div className="ing-error">{error}</div>
      ) : (
        <div className="ing-table-wrap">
          <table className="ing-table">
            <thead>
              <tr>
                <th>Sr. No.</th>
                <th>Ingredient Name</th>
                <th>Unit</th>
                <th>Cost Per Unit (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="ing-empty">
                      <div className="ing-empty-icon"><i className="ti ti-salt"></i></div>
                      No ingredients added yet. Click "Add Ingredient" to get started.
                    </div>
                  </td>
                </tr>
              ) : (
                ingredients.map((ing, idx) => (
                  <tr key={ing.id}>
                    <td>{idx + 1}</td>
                    <td>{ing.name}</td>
                    <td>
                      <span className="unit-badge">{ing.unit}</span>
                    </td>
                    <td>₹{Number(ing.cost_per_unit).toFixed(2)}</td>
                    <td>
                      <div className="ing-actions">
                        <button
                          className="icon-btn"
                          title="Edit"
                          onClick={() => openEditModal(ing)}
                        >
                          <i className="ti ti-edit"></i>
                        </button>
                        <button
                          className="icon-btn icon-btn--danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(ing)}
                        >
                          <i className="ti ti-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Modal ────────────────────────────────────── */}
      {addModal && (
        <div className="modal-bg" onClick={() => setAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add Ingredient</div>
            <button className="modal-close" onClick={() => setAddModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <form onSubmit={handleAddSubmit}>
              {addErrors.api && (
                <span className="form-error" style={{ marginBottom: 10, display: "block" }}>
                  {addErrors.api}
                </span>
              )}

              {/* Ingredient Name */}
              <div className="form-row">
                <label className="form-label">Ingredient Name *</label>
                <input
                  className={`form-input${addErrors.name ? " form-input--error" : ""}`}
                  type="text"
                  placeholder="e.g. Bread"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                {addErrors.name && (
                  <span className="form-error">{addErrors.name}</span>
                )}
              </div>

              {/* Unit / Parameter */}
              <div className="form-row">
                <label className="form-label">Unit (Parameter) *</label>
                <select
                  className={`form-input${addErrors.unit ? " form-input--error" : ""}`}
                  value={addForm.unit}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, unit: e.target.value }))
                  }
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {addErrors.unit && (
                  <span className="form-error">{addErrors.unit}</span>
                )}
              </div>

              {/* Cost Per Unit */}
              <div className="form-row">
                <label className="form-label">Cost Per {addForm.unit} (₹) *</label>
                <input
                  className={`form-input${addErrors.cost_per_unit ? " form-input--error" : ""}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 80.00"
                  value={addForm.cost_per_unit}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, cost_per_unit: e.target.value }))
                  }
                />
                {addErrors.cost_per_unit && (
                  <span className="form-error">{addErrors.cost_per_unit}</span>
                )}
              </div>

              <button className="submit-btn" type="submit" disabled={addSaving}>
                {addSaving ? "Saving…" : "Add Ingredient"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────── */}
      {editModal && (
        <div className="modal-bg" onClick={() => setEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Edit Ingredient</div>
            <button className="modal-close" onClick={() => setEditModal(false)}>
              <i className="ti ti-x"></i>
            </button>
            <form onSubmit={handleEditSubmit}>
              {editErrors.api && (
                <span className="form-error" style={{ marginBottom: 10, display: "block" }}>
                  {editErrors.api}
                </span>
              )}

              {/* Ingredient Name */}
              <div className="form-row">
                <label className="form-label">Ingredient Name *</label>
                <input
                  className={`form-input${editErrors.name ? " form-input--error" : ""}`}
                  type="text"
                  placeholder="e.g. Bread"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
                {editErrors.name && (
                  <span className="form-error">{editErrors.name}</span>
                )}
              </div>

              {/* Unit / Parameter */}
              <div className="form-row">
                <label className="form-label">Unit (Parameter) *</label>
                <select
                  className={`form-input${editErrors.unit ? " form-input--error" : ""}`}
                  value={editForm.unit}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, unit: e.target.value }))
                  }
                >
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {editErrors.unit && (
                  <span className="form-error">{editErrors.unit}</span>
                )}
              </div>

              {/* Cost Per Unit */}
              <div className="form-row">
                <label className="form-label">Cost Per {editForm.unit} (₹) *</label>
                <input
                  className={`form-input${editErrors.cost_per_unit ? " form-input--error" : ""}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 80.00"
                  value={editForm.cost_per_unit}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, cost_per_unit: e.target.value }))
                  }
                />
                {editErrors.cost_per_unit && (
                  <span className="form-error">{editErrors.cost_per_unit}</span>
                )}
              </div>

              <button className="submit-btn" type="submit" disabled={editSaving}>
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ──────────────────────────── */}
      {deleteTarget && (
        <div className="delete-warning-overlay">
          <div className="delete-warning-toast">
            <div className="delete-warning-toast__icon"><i className="ti ti-alert-triangle"></i></div>
            <h3 className="delete-warning-toast__title">Delete Ingredient?</h3>
            <p className="delete-warning-toast__message">
              Are you sure you want to delete{" "}
              <strong>"{deleteTarget.name}"</strong>? This cannot be undone.
            </p>
            <div className="delete-warning-toast__actions">
              <button
                className="delete-warning-toast__cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="delete-warning-toast__confirm"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
