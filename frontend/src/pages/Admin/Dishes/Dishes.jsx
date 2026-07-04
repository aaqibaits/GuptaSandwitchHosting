import React, { useState, useEffect } from "react";
import {
  fetchDishes,
  fetchCategories,
  fetchOutlets,
  createDish,
  updateDish,
  deleteDish,
  createCategory
} from "../../../services/dishesApi";
import { fetchIngredients, fetchDishIngredients } from "../../../services/ingredientsApi";
import "./Dishes.css";

// const OUTLETS = ["Koregaon Park", "Baner", "Kothrud"];

const BLANK_FORM = {
  name: "",
  cat: "",
  dine: "",
  parcel: "",
  swiggy: "",
  zomato: "",
  recipe: [],          // [{ ingredient_id, ingredient_name, unit, quantity_required }]
  allOutlets: true,
  outlets: {},
  image: null,
};

export default function Dishes({ selectedOutlet = "All Outlets" }) {
  const [tab, setTab] = useState("offline");
  const [outlets, setOutlets] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]); // all ingredients from DB
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dishErrors, setDishErrors] = useState({});
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState(BLANK_FORM);
  const [editId, setEditId] = useState(null);
  const [deleteWarning, setDeleteWarning] = useState(null);
  const [showAddCat, setShowAddCat] = useState(false);   // Add modal: show inline input
  const [newCatName, setNewCatName] = useState("");       // Add modal: new category text
  const [catSaving, setCatSaving] = useState(false);   // Add modal: saving spinner
  const [catError, setCatError] = useState("");       // Add modal: inline error
  const [showEditCat, setShowEditCat] = useState(false);   // Edit modal: show inline input
  const [newEditCatName, setNewEditCatName] = useState("");     // Edit modal: new category text
  const [editCatSaving, setEditCatSaving] = useState(false);   // Edit modal: saving spinner
  const [editCatError, setEditCatError] = useState("");       // Edit modal: inline error
  const [showAddRecipe, setShowAddRecipe] = useState(false);   // Add modal: view ingredients toggle
  const [showEditRecipe, setShowEditRecipe] = useState(false); // Edit modal: view ingredients toggle

  // Clear errors and toggle views when modals open/close
  useEffect(() => {
    setDishErrors({});
    setShowAddRecipe(false);
    setShowEditRecipe(false);
  }, [modal, editModal]);

  // ── Load dishes and categories from backend on mount ─────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load categories first
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        // ADD after: const categoriesData = await fetchCategories();
        const outletsData = await fetchOutlets();
        setOutlets(outletsData.map(o => o.name));

        // Load all ingredients for recipe dropdowns
        const ingsData = await fetchIngredients();
        setIngredientsList(ingsData || []);

        // Load dishes
        const dishesData = await fetchDishes();

        setDishes(
          dishesData.map((d) => ({
            id: d.id,
            name: d.name,
            cat: d.cat,
            category_id: d.category_id,
            dine: d.dine_price,
            parcel: d.parcel_price,
            swiggy: d.swiggy_price,
            zomato: d.zomato_price,
            ingredients: d.ingredients
              ? (typeof d.ingredients === "string"
                ? d.ingredients.split(",").map((s) => s.trim())
                : d.ingredients)
              : [],
            outlets: Array.isArray(d.outlets) ? d.outlets : [d.outlets || "All"],
            image_url: d.image_url,
          }))
        );
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ── Filtered list based on tab ─────────────────────────
  // const list = tab === "online"Delete this dish?
  //   ? dishes.filter((d) => d.swiggy !== null && d.swiggy !== undefined)
  //   : dishes;


  const outletFiltered = selectedOutlet === "All Outlets"
    ? dishes
    : dishes.filter((d) =>
      d.outlets?.includes("All") || d.outlets?.includes(selectedOutlet)
    );

  const list = tab === "online"
    ? outletFiltered.filter((d) => d.swiggy !== null && d.swiggy !== undefined)
    : outletFiltered;

  // ── Form field change handler ──────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "allOutlets") {
      setForm((f) => ({ ...f, allOutlets: checked }));
    } else if (outlets.includes(name)) {
      setForm((f) => ({ ...f, outlets: { ...f.outlets, [name]: checked } }));
    } else {
      setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    }
    // Clear specific field errors on edit
    setDishErrors((errs) => ({ ...errs, [name]: "", general: "" }));
  };

  // ── Image file handler ─────────────────────────────────
  const handleFileChange = (e) => {
    setForm((f) => ({ ...f, image: e.target.files[0] }));
  };

  // ── Edit handlers ──────────────────────────────────────
  const handleEditOpen = async (d) => {
    setDishErrors({});
    setEditId(d.id);
    setEditForm({
      name: d.name,
      cat: d.cat,
      dine: d.dine,
      parcel: d.parcel,
      swiggy: d.swiggy || "",
      zomato: d.zomato || "",
      recipe: [],   // will be loaded from API below
      allOutlets: d.outlets?.includes("All"),
      outlets: Object.fromEntries(
        outlets.map(o => [o, d.outlets?.includes(o)])
      ),
      image: null,
    });
    setEditModal(true);
    // Load existing recipe rows from dish_ingredients table
    try {
      const rows = await fetchDishIngredients(d.id);
      setEditForm(f => ({ ...f, recipe: rows || [] }));
    } catch (err) {
      console.error("Failed to load dish recipe:", err);
    }
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) return;

    const selectedOutlets = editForm.allOutlets
      ? ["All"]
      : outlets.filter((o) => editForm.outlets[o]);

    const fd = new FormData();
    fd.append("name", editForm.name);
    fd.append("category", editForm.cat);
    fd.append("dine_price", editForm.dine);
    fd.append("parcel_price", editForm.parcel);
    fd.append("swiggy_price", editForm.swiggy);
    fd.append("zomato_price", editForm.zomato);
    fd.append("recipe", JSON.stringify(editForm.recipe || []));
    fd.append("outlets", JSON.stringify(selectedOutlets.length ? selectedOutlets : ["All"]));
    if (editForm.image) fd.append("image", editForm.image);

    try {
      setSaving(true);
      const updated = await updateDish(editId, fd);

      setDishes((prev) => prev.map((d) =>
        d.id === editId ? {
          id: updated.id,
          name: updated.name,
          cat: updated.category_name || updated.cat,
          dine: updated.dine_price,
          parcel: updated.parcel_price,
          swiggy: updated.swiggy_price,
          zomato: updated.zomato_price,
          ingredients: Array.isArray(updated.ingredients)
            ? updated.ingredients
            : updated.ingredients?.split(",").map((s) => s.trim()) || [],
          outlets: updated.outlets || ["All"],
          image_url: updated.image_url,
        } : d
      ));

      setEditModal(false);
      setEditId(null);
    } catch (err) {
      console.error("Failed to update dish:", err);
      const backendErrors = err.response?.data?.errors || {};
      if (Object.keys(backendErrors).length > 0) {
        const mappedErrors = {};
        if (backendErrors.name) mappedErrors.name = backendErrors.name;
        if (backendErrors.category) mappedErrors.cat = backendErrors.category;
        if (backendErrors.dine_price) mappedErrors.dine = backendErrors.dine_price;
        if (backendErrors.parcel_price) mappedErrors.parcel = backendErrors.parcel_price;
        if (backendErrors.swiggy_price) mappedErrors.swiggy = backendErrors.swiggy_price;
        if (backendErrors.zomato_price) mappedErrors.zomato = backendErrors.zomato_price;
        setDishErrors(mappedErrors);
      } else {
        const errorMsg = err.response?.data?.message || "Failed to update dish";
        setDishErrors({ general: errorMsg });
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Add new category (Add modal) ──────────────────────
  const handleAddCategory = async () => {
    if (!newCatName.trim()) { setCatError("Please enter a category name"); return; }
    try {
      setCatSaving(true);
      setCatError("");
      const cat = await createCategory(newCatName.trim());
      setCategories((prev) => [...prev, cat]);
      setForm((f) => ({ ...f, cat: cat.name }));
      setNewCatName("");
      setShowAddCat(false);
    } catch (err) {
      setCatError(err.response?.data?.error || err.message || "Failed to create category");
    } finally {
      setCatSaving(false);
    }
  };

  // ── Add new category (Edit modal) ─────────────────────
  const handleAddEditCategory = async () => {
    if (!newEditCatName.trim()) { setEditCatError("Please enter a category name"); return; }
    try {
      setEditCatSaving(true);
      setEditCatError("");
      const cat = await createCategory(newEditCatName.trim());
      setCategories((prev) => [...prev, cat]);
      setEditForm((f) => ({ ...f, cat: cat.name }));
      setNewEditCatName("");
      setShowEditCat(false);
    } catch (err) {
      setEditCatError(err.response?.data?.error || err.message || "Failed to create category");
    } finally {
      setEditCatSaving(false);
    }
  };

  // ── Save dish to backend ───────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) return;

    const selectedOutlets = form.allOutlets
      ? ["All"]
      : outlets.filter((o) => form.outlets[o]);

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("category", form.cat);
    fd.append("dine_price", form.dine);
    fd.append("parcel_price", form.parcel);
    fd.append("swiggy_price", form.swiggy);
    fd.append("zomato_price", form.zomato);
    fd.append("recipe", JSON.stringify(form.recipe || []));
    fd.append("outlets", JSON.stringify(selectedOutlets.length ? selectedOutlets : ["All"]));
    if (form.image) fd.append("image", form.image);

    try {
      setSaving(true);
      const dish = await createDish(fd);

      setDishes((d) => [
        ...d,
        {
          id: dish.id,
          name: dish.name,
          cat: dish.category_name || dish.cat,
          dine: dish.dine_price,
          parcel: dish.parcel_price,
          swiggy: dish.swiggy_price,
          zomato: dish.zomato_price,
          ingredients: dish.ingredients
            ? (typeof dish.ingredients === "string"
              ? dish.ingredients.split(",").map((s) => s.trim())
              : dish.ingredients)
            : [],
          outlets: dish.outlets || ["All"],
          image_url: dish.image_url,
        },
      ]);

      setForm(BLANK_FORM);
      setModal(false);
    } catch (err) {
      console.error("Failed to save dish:", err);
      const backendErrors = err.response?.data?.errors || {};
      if (Object.keys(backendErrors).length > 0) {
        const mappedErrors = {};
        if (backendErrors.name) mappedErrors.name = backendErrors.name;
        if (backendErrors.category) mappedErrors.cat = backendErrors.category;
        if (backendErrors.dine_price) mappedErrors.dine = backendErrors.dine_price;
        if (backendErrors.parcel_price) mappedErrors.parcel = backendErrors.parcel_price;
        if (backendErrors.swiggy_price) mappedErrors.swiggy = backendErrors.swiggy_price;
        if (backendErrors.zomato_price) mappedErrors.zomato = backendErrors.zomato_price;
        setDishErrors(mappedErrors);
      } else {
        const errorMsg = err.response?.data?.message || "Failed to save dish";
        setDishErrors({ general: errorMsg });
      }
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (dish) => {
    setDeleteWarning({
      id: dish.id,
      name: dish.name,
    });
  };

  const cancelDelete = () => {
    setDeleteWarning(null);
  };

  // ── Delete dish from backend + UI ──────────────────────
  const handleDelete = async () => {
    if (!deleteWarning) return;

    try {
      await deleteDish(deleteWarning.id);
      setDishes((d) => d.filter((x) => x.id !== deleteWarning.id));
    } catch (err) {
      console.error("Failed to delete dish:", err);
      alert(`Error: ${err.response?.data?.message || "Failed to delete dish."}`);
    } finally {
      setDeleteWarning(null);
    }
  };

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="dishes">

      {/* Header row */}
      <div className="dishes-header">
        <div className="tab-row">
          {["offline", "online"].map((t) => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "offline" ? "Offline" : "Online (Swiggy / Zomato)"}
            </button>
          ))}
        </div>
        <button className="add-btn" onClick={() => setModal(true)}>
          <i className="ti ti-plus" /> Add dish
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
          Loading dishes...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ textAlign: "center", padding: 40, color: "red" }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && list.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "#888" }}>
          No dishes found. Click "Add dish" to get started.
        </div>
      )}

      {deleteWarning && (
        <div className="delete-warning-overlay">
          <div className="delete-warning-toast">
            <div className="delete-warning-toast__icon">⚠️</div>
            <h3 className="delete-warning-toast__title">Delete dish?</h3>
            <p className="delete-warning-toast__message">
              Deleting <strong>{deleteWarning.name}</strong> will remove all linked data for this dish.
            </p>
            <div className="delete-warning-toast__actions">
              <button className="delete-warning-toast__cancel" onClick={cancelDelete}>Cancel</button>
              <button className="delete-warning-toast__confirm" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Dish grid */}
      {!loading && !error && (
        <div className="dish-grid">
          {list.map((d) => (
            <div key={d.id} className="dish-card">

              {/* Dish image */}
              <div className="dish-card__img-wrap">
                {d.image_url
                  ? <img src={`http://localhost:5000${d.image_url}`} alt={d.name} />
                  : <div className="dish-card__img-placeholder">🍽️</div>
                }
              </div>

              {/* Dish body */}
              <div className="dish-card__body">
                <div className="dish-name">{d.name}</div>
                <div className="dish-cat">{d.cat}</div>

                {tab === "offline" ? (
                  <div className="price-row">
                    <span className="ptag">Dine-in ₹{d.dine}</span>
                    <span className="ptag">Parcel ₹{d.parcel}</span>
                  </div>
                ) : (
                  <div className="price-row">
                    <span className="ptag ptag--swiggy">Swiggy ₹{d.swiggy}</span>
                    <span className="ptag ptag--zomato">Zomato ₹{d.zomato}</span>
                  </div>
                )}

                <div className="dish-ingredients">
                  {Array.isArray(d.ingredients) ? d.ingredients.join(", ") : d.ingredients}
                </div>

                <div className="outlet-chips">
                  {(Array.isArray(d.outlets) ? d.outlets : [d.outlets]).map((o) => (
                    <span key={o} className="chip">{o}</span>
                  ))}
                </div>

                <div className="dish-actions">
                  <button className="icon-btn" onClick={() => handleEditOpen(d)}>
                    <i className="ti ti-edit" />
                  </button>
                  <button
                    className="icon-btn icon-btn--danger"
                    onClick={() => requestDelete(d)}
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Add Dish Modal */}
      {modal && (
        <div
          className="modal-bg"
          onClick={(e) => e.target.className === "modal-bg" && setModal(false)}
        >
          <div className="modal">
            <div className="modal-title">Add New Dish</div>
            <button className="modal-close" onClick={() => setModal(false)}>
              <i className="ti ti-x" />
            </button>

            {dishErrors.general && (
              <div className="form-error-banner" style={{ padding: '8px 12px', background: '#ffebeb', color: '#d93025', borderRadius: '4px', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" /> {dishErrors.general}
              </div>
            )}

            {/* Dish name */}
            <div className="form-row">
              <label className="form-label">Dish name</label>
              <input
                className={`form-input ${dishErrors.name ? "form-input--error" : ""}`}
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Chicken Club Sandwich"
              />
              {dishErrors.name && <div className="form-error">{dishErrors.name}</div>}
            </div>

            {/* Category - Now populated from categories table */}
            <div className="form-row">
              <label className="form-label">Category</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  className={`form-input ${dishErrors.cat ? "form-input--error" : ""}`}
                  name="cat"
                  value={form.cat}
                  onChange={handleChange}
                  style={{ flex: 1 }}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  title="Add new category"
                  onClick={() => { setShowAddCat((v) => !v); setCatError(""); setNewCatName(""); }}
                  style={{
                    padding: "0 12px", borderRadius: 8, border: "1px solid #d1d5db",
                    background: showAddCat ? "#f3f4f6" : "#fff", cursor: "pointer",
                    fontSize: 18, lineHeight: 1, color: "#374151", flexShrink: 0
                  }}
                >
                  {showAddCat ? "−" : "+"}
                </button>
              </div>
              {dishErrors.cat && <div className="form-error">{dishErrors.cat}</div>}

              {/* Inline add-category input */}
              {showAddCat && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="form-input"
                      placeholder="New category name"
                      value={newCatName}
                      onChange={(e) => { setNewCatName(e.target.value); setCatError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={catSaving}
                      style={{
                        padding: "0 14px", borderRadius: 8, border: "none",
                        background: "#2563eb", color: "#fff", cursor: "pointer",
                        fontWeight: 500, fontSize: 13, flexShrink: 0,
                        opacity: catSaving ? 0.6 : 1
                      }}
                    >
                      {catSaving ? "Adding..." : "Add"}
                    </button>
                  </div>
                  {catError && <div className="form-error">{catError}</div>}
                </div>
              )}
            </div>

            {/* Offline pricing */}
            <div className="form-row">
              <label className="form-label">Offline pricing</label>
              <div className="two-inputs">
                <div>
                  <input
                    className={`form-input ${dishErrors.dine ? "form-input--error" : ""}`}
                    name="dine"
                    type="number"
                    value={form.dine}
                    onChange={handleChange}
                    placeholder="Dine-in (₹)"
                  />
                  {dishErrors.dine && <div className="form-error">{dishErrors.dine}</div>}
                </div>
                <div>
                  <input
                    className={`form-input ${dishErrors.parcel ? "form-input--error" : ""}`}
                    name="parcel"
                    type="number"
                    value={form.parcel}
                    onChange={handleChange}
                    placeholder="Parcel (₹)"
                  />
                  {dishErrors.parcel && <div className="form-error">{dishErrors.parcel}</div>}
                </div>
              </div>
            </div>

            {/* Online pricing */}
            <div className="form-row">
              <label className="form-label">Online pricing</label>
              <div className="two-inputs">
                <div>
                  <input
                    className={`form-input ${dishErrors.swiggy ? "form-input--error" : ""}`}
                    name="swiggy"
                    type="number"
                    value={form.swiggy}
                    onChange={handleChange}
                    placeholder="Swiggy (₹)"
                  />
                  {dishErrors.swiggy && <div className="form-error">{dishErrors.swiggy}</div>}
                </div>
                <div>
                  <input
                    className={`form-input ${dishErrors.zomato ? "form-input--error" : ""}`}
                    name="zomato"
                    type="number"
                    value={form.zomato}
                    onChange={handleChange}
                    placeholder="Zomato (₹)"
                  />
                  {dishErrors.zomato && <div className="form-error">{dishErrors.zomato}</div>}
                </div>
              </div>
            </div>

            {/* Recipe Builder / Table Viewer */}
            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Recipe Ingredients:</span>
                <button
                  type="button"
                  onClick={() => setShowAddRecipe(!showAddRecipe)}
                  style={{
                    padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #1a1208",
                    background: "#fffbee", color: "#1a1208", cursor: "pointer", fontWeight: 600
                  }}
                >
                  Manage Ingredients
                </button>
              </label>
              
              <div style={{ fontSize: 13, color: "#555", padding: "6px 8px", background: "#fcfcfc", borderRadius: 6, border: "0.5px dashed #ccc", marginBottom: 8 }}>
                {(form.recipe || []).map(r => r.ingredient_name).filter(Boolean).join(", ") || "No ingredients added yet."}
              </div>

              {showAddRecipe && (
                <div style={{ border: "1px solid #e5e5e3", borderRadius: 8, overflow: "hidden", marginTop: 8, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f8f6", padding: "6px 12px", borderBottom: "1px solid #e5e5e3" }}>
                    <span style={{ fontWeight: 600, fontSize: 11, color: "#666" }}>Recipe Mappings Table</span>
                    <button
                      type="button"
                      onClick={() => setShowAddRecipe(false)}
                      style={{ border: "none", background: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}
                    >
                      ✕ Close Table
                    </button>
                  </div>
                  <table className="recipe-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#fcfcfc", borderBottom: "1px solid #e5e5e3" }}>
                        <th style={{ width: 40, padding: 8, textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              recipe: [...(f.recipe || []), { ingredient_id: "", ingredient_name: "", unit: "", quantity_required: "" }]
                            }))}
                            style={{
                              border: "none", background: "#1a1208", color: "#f5c842",
                              borderRadius: 4, width: 22, height: 22, cursor: "pointer", fontSize: 13, fontWeight: "bold"
                            }}
                            title="Add Row"
                          >
                            +
                          </button>
                        </th>
                        <th style={{ width: 30, padding: 8, textAlign: "left" }}>No.</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Name</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Quantity</th>
                        <th style={{ width: 40, padding: 8, textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.recipe || []).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f0f0ee" }}>
                          <td style={{ textAlign: "center", padding: 6 }}>
                            <span style={{ color: "#aaa" }}>•</span>
                          </td>
                          <td style={{ padding: 6 }}>{idx + 1}</td>
                          <td style={{ padding: 6 }}>
                            <select
                              className="form-input"
                              style={{ width: "100%", padding: "4px 8px", boxSizing: "border-box", fontSize: 12 }}
                              value={row.ingredient_id || ""}
                              onChange={(e) => {
                                const ing = ingredientsList.find(i => String(i.id) === e.target.value);
                                const updated = [...(form.recipe || [])];
                                updated[idx] = {
                                  ...updated[idx],
                                  ingredient_id: e.target.value,
                                  ingredient_name: ing?.name || "",
                                  unit: ing?.unit || "",
                                };
                                setForm(f => ({ ...f, recipe: updated }));
                              }}
                            >
                              <option value="">Select ingredient</option>
                              {ingredientsList.map(ing => {
                                const isAlreadySelected = (form.recipe || []).some(
                                  (r, rIdx) => rIdx !== idx && String(r.ingredient_id) === String(ing.id)
                                );
                                return (
                                  <option key={ing.id} value={ing.id} disabled={isAlreadySelected}>
                                    {ing.name} ({ing.unit}){isAlreadySelected ? " — (Already Added)" : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td style={{ padding: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                className="form-input"
                                style={{ flex: 1, padding: "4px 8px", boxSizing: "border-box", fontSize: 12 }}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Qty"
                                value={row.quantity_required || ""}
                                onChange={(e) => {
                                  const updated = [...(form.recipe || [])];
                                  updated[idx] = { ...updated[idx], quantity_required: e.target.value };
                                  setForm(f => ({ ...f, recipe: updated }));
                                }}
                              />
                              <span style={{ fontSize: 11, color: "#666", minWidth: 30 }}>{row.unit || "unit"}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center", padding: 6 }}>
                            <button
                              type="button"
                              title="Remove row"
                              onClick={() => {
                                const updated = (form.recipe || []).filter((_, i) => i !== idx);
                                setForm(f => ({ ...f, recipe: updated }));
                              }}
                              style={{
                                border: "none", background: "none", color: "#c0392b", cursor: "pointer", fontSize: 13
                              }}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(form.recipe || []).length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, textAlign: "center", color: "#aaa" }}>
                            No ingredients. Click the '+' header button to add.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Image upload */}
            <div className="form-row">
              <label className="form-label">Dish image</label>
              <input
                className="form-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
              {form.image && (
                <img
                  src={URL.createObjectURL(form.image)}
                  alt="preview"
                  style={{
                    marginTop: 8, width: "100%", maxHeight: 160,
                    objectFit: "cover", borderRadius: 8,
                  }}
                />
              )}
            </div>

            {/* Outlets */}
            <div className="form-row">
              <label className="form-label">Outlets</label>
              <label className="cb-row">
                <input
                  type="checkbox"
                  name="allOutlets"
                  checked={form.allOutlets}
                  onChange={handleChange}
                />
                Add to all outlets
              </label>
              <div className="outlet-check-row">
                {outlets.map((o) => (
                  <label key={o} className="cb-row">
                    <input
                      type="checkbox"
                      name={o}
                      checked={form.outlets[o]}
                      onChange={handleChange}
                      disabled={form.allOutlets}
                    />
                    {o}
                  </label>
                ))}
              </div>
            </div>

            <button
              className="submit-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Dish"}
            </button>

          </div>
        </div>
      )}

      {/* Edit Dish Modal */}
      {editModal && (
        <div
          className="modal-bg"
          onClick={(e) => e.target.className === "modal-bg" && setEditModal(false)}
        >
          <div className="modal">
            <div className="modal-title">Edit Dish</div>
            <button className="modal-close" onClick={() => setEditModal(false)}>
              <i className="ti ti-x" />
            </button>

            {dishErrors.general && (
              <div className="form-error-banner" style={{ padding: '8px 12px', background: '#ffebeb', color: '#d93025', borderRadius: '4px', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-alert-circle" /> {dishErrors.general}
              </div>
            )}

            <div className="form-row">
              <label className="form-label">Dish name</label>
              <input className={`form-input ${dishErrors.name ? "form-input--error" : ""}`}
                value={editForm.name}
                onChange={(e) => {
                  setEditForm(f => ({ ...f, name: e.target.value }));
                  setDishErrors(errs => ({ ...errs, name: "" }));
                }}
                placeholder="e.g. Chicken Club Sandwich"
              />
              {dishErrors.name && <div className="form-error">{dishErrors.name}</div>}
            </div>

            <div className="form-row">
              <label className="form-label">Category</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select className={`form-input ${dishErrors.cat ? "form-input--error" : ""}`}
                  value={editForm.cat}
                  onChange={(e) => {
                    setEditForm(f => ({ ...f, cat: e.target.value }));
                    setDishErrors(errs => ({ ...errs, cat: "" }));
                  }}
                  style={{ flex: 1 }}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  title="Add new category"
                  onClick={() => { setShowEditCat((v) => !v); setEditCatError(""); setNewEditCatName(""); }}
                  style={{
                    padding: "0 12px", borderRadius: 8, border: "1px solid #d1d5db",
                    background: showEditCat ? "#f3f4f6" : "#fff", cursor: "pointer",
                    fontSize: 18, lineHeight: 1, color: "#374151", flexShrink: 0
                  }}
                >
                  {showEditCat ? "−" : "+"}
                </button>
              </div>
              {dishErrors.cat && <div className="form-error">{dishErrors.cat}</div>}

              {/* Inline add-category input */}
              {showEditCat && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexDirection: "column" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="form-input"
                      placeholder="New category name"
                      value={newEditCatName}
                      onChange={(e) => { setNewEditCatName(e.target.value); setEditCatError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleAddEditCategory()}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddEditCategory}
                      disabled={editCatSaving}
                      style={{
                        padding: "0 14px", borderRadius: 8, border: "none",
                        background: "#2563eb", color: "#fff", cursor: "pointer",
                        fontWeight: 500, fontSize: 13, flexShrink: 0,
                        opacity: editCatSaving ? 0.6 : 1
                      }}
                    >
                      {editCatSaving ? "Adding..." : "Add"}
                    </button>
                  </div>
                  {editCatError && <div className="form-error">{editCatError}</div>}
                </div>
              )}
            </div>

            <div className="form-row">
              <label className="form-label">Offline pricing</label>
              <div className="two-inputs">
                <div>
                  <input className={`form-input ${dishErrors.dine ? "form-input--error" : ""}`} type="number" placeholder="Dine-in (₹)"
                    value={editForm.dine}
                    onChange={(e) => {
                      setEditForm(f => ({ ...f, dine: e.target.value }));
                      setDishErrors(errs => ({ ...errs, dine: "" }));
                    }}
                  />
                  {dishErrors.dine && <div className="form-error">{dishErrors.dine}</div>}
                </div>
                <div>
                  <input className={`form-input ${dishErrors.parcel ? "form-input--error" : ""}`} type="number" placeholder="Parcel (₹)"
                    value={editForm.parcel}
                    onChange={(e) => {
                      setEditForm(f => ({ ...f, parcel: e.target.value }));
                      setDishErrors(errs => ({ ...errs, parcel: "" }));
                    }}
                  />
                  {dishErrors.parcel && <div className="form-error">{dishErrors.parcel}</div>}
                </div>
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">Online pricing</label>
              <div className="two-inputs">
                <div>
                  <input className={`form-input ${dishErrors.swiggy ? "form-input--error" : ""}`} type="number" placeholder="Swiggy (₹)"
                    value={editForm.swiggy}
                    onChange={(e) => {
                      setEditForm(f => ({ ...f, swiggy: e.target.value }));
                      setDishErrors(errs => ({ ...errs, swiggy: "" }));
                    }}
                  />
                  {dishErrors.swiggy && <div className="form-error">{dishErrors.swiggy}</div>}
                </div>
                <div>
                  <input className={`form-input ${dishErrors.zomato ? "form-input--error" : ""}`} type="number" placeholder="Zomato (₹)"
                    value={editForm.zomato}
                    onChange={(e) => {
                      setEditForm(f => ({ ...f, zomato: e.target.value }));
                      setDishErrors(errs => ({ ...errs, zomato: "" }));
                    }}
                  />
                  {dishErrors.zomato && <div className="form-error">{dishErrors.zomato}</div>}
                </div>
              </div>
            </div>

            {/* Recipe Builder / Table Viewer */}
            <div className="form-row" style={{ marginTop: 12 }}>
              <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Recipe Ingredients:</span>
                <button
                  type="button"
                  onClick={() => setShowEditRecipe(!showEditRecipe)}
                  style={{
                    padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #1a1208",
                    background: "#fffbee", color: "#1a1208", cursor: "pointer", fontWeight: 600
                  }}
                >
                  Manage Ingredients
                </button>
              </label>

              <div style={{ fontSize: 13, color: "#555", padding: "6px 8px", background: "#fcfcfc", borderRadius: 6, border: "0.5px dashed #ccc", marginBottom: 8 }}>
                {(editForm.recipe || []).map(r => r.ingredient_name).filter(Boolean).join(", ") || "No ingredients added yet."}
              </div>

              {showEditRecipe && (
                <div style={{ border: "1px solid #e5e5e3", borderRadius: 8, overflow: "hidden", marginTop: 8, background: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8f8f6", padding: "6px 12px", borderBottom: "1px solid #e5e5e3" }}>
                    <span style={{ fontWeight: 600, fontSize: 11, color: "#666" }}>Recipe Mappings Table</span>
                    <button
                      type="button"
                      onClick={() => setShowEditRecipe(false)}
                      style={{ border: "none", background: "none", color: "#c0392b", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}
                    >
                      ✕ Close Table
                    </button>
                  </div>
                  <table className="recipe-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#fcfcfc", borderBottom: "1px solid #e5e5e3" }}>
                        <th style={{ width: 40, padding: 8, textAlign: "center" }}>
                          <button
                            type="button"
                            onClick={() => setEditForm(f => ({
                              ...f,
                              recipe: [...(f.recipe || []), { ingredient_id: "", ingredient_name: "", unit: "", quantity_required: "" }]
                            }))}
                            style={{
                              border: "none", background: "#1a1208", color: "#f5c842",
                              borderRadius: 4, width: 22, height: 22, cursor: "pointer", fontSize: 13, fontWeight: "bold"
                            }}
                            title="Add Row"
                          >
                            +
                          </button>
                        </th>
                        <th style={{ width: 30, padding: 8, textAlign: "left" }}>No.</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Name</th>
                        <th style={{ padding: 8, textAlign: "left" }}>Quantity</th>
                        <th style={{ width: 40, padding: 8, textAlign: "center" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editForm.recipe || []).map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f0f0ee" }}>
                          <td style={{ textAlign: "center", padding: 6 }}>
                            <span style={{ color: "#aaa" }}>•</span>
                          </td>
                          <td style={{ padding: 6 }}>{idx + 1}</td>
                          <td style={{ padding: 6 }}>
                            <select
                              className="form-input"
                              style={{ width: "100%", padding: "4px 8px", boxSizing: "border-box", fontSize: 12 }}
                              value={row.ingredient_id || ""}
                              onChange={(e) => {
                                const ing = ingredientsList.find(i => String(i.id) === String(e.target.value));
                                const updated = [...(editForm.recipe || [])];
                                updated[idx] = {
                                  ...updated[idx],
                                  ingredient_id: e.target.value,
                                  ingredient_name: ing?.name || "",
                                  unit: ing?.unit || "",
                                };
                                setEditForm(f => ({ ...f, recipe: updated }));
                              }}
                            >
                              <option value="">Select ingredient</option>
                              {ingredientsList.map(ing => {
                                const isAlreadySelected = (editForm.recipe || []).some(
                                  (r, rIdx) => rIdx !== idx && String(r.ingredient_id) === String(ing.id)
                                );
                                return (
                                  <option key={ing.id} value={ing.id} disabled={isAlreadySelected}>
                                    {ing.name} ({ing.unit}){isAlreadySelected ? " — (Already Added)" : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td style={{ padding: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                className="form-input"
                                style={{ flex: 1, padding: "4px 8px", boxSizing: "border-box", fontSize: 12 }}
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Qty"
                                value={row.quantity_required || ""}
                                onChange={(e) => {
                                  const updated = [...(editForm.recipe || [])];
                                  updated[idx] = { ...updated[idx], quantity_required: e.target.value };
                                  setEditForm(f => ({ ...f, recipe: updated }));
                                }}
                              />
                              <span style={{ fontSize: 11, color: "#666", minWidth: 30 }}>{row.unit || "unit"}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center", padding: 6 }}>
                            <button
                              type="button"
                              title="Remove row"
                              onClick={() => {
                                const updated = (editForm.recipe || []).filter((_, i) => i !== idx);
                                setEditForm(f => ({ ...f, recipe: updated }));
                              }}
                              style={{
                                border: "none", background: "none", color: "#c0392b", cursor: "pointer", fontSize: 13
                              }}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(editForm.recipe || []).length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: 12, textAlign: "center", color: "#aaa" }}>
                            No ingredients. Click the '+' header button to add.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="form-row">
              <label className="form-label">Dish image (leave blank to keep current)</label>
              <input className="form-input" type="file" accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setEditForm(f => ({ ...f, image: e.target.files[0] }))}
              />
              {editForm.image && (
                <img src={URL.createObjectURL(editForm.image)} alt="preview"
                  style={{ marginTop: 8, width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8 }}
                />
              )}
            </div>

            <div className="form-row">
              <label className="form-label">Outlets</label>
              <label className="cb-row">
                <input type="checkbox" checked={editForm.allOutlets}
                  onChange={(e) => setEditForm(f => ({ ...f, allOutlets: e.target.checked }))}
                />
                Add to all outlets
              </label>
              <div className="outlet-check-row">
                {outlets.map((o) => (
                  <label key={o} className="cb-row">
                    <input type="checkbox" checked={editForm.outlets[o]}
                      disabled={editForm.allOutlets}
                      onChange={(e) => setEditForm(f => ({ ...f, outlets: { ...f.outlets, [o]: e.target.checked } }))}
                    />
                    {o}
                  </label>
                ))}
              </div>
            </div>

            <button className="submit-btn" onClick={handleEditSave} disabled={saving}>
              {saving ? "Saving..." : "Update Dish"}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}