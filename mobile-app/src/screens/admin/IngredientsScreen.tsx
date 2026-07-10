/**
 * IngredientsScreen.tsx
 * ──────────────────────
 * Ingredients Management Screen for the Admin panel.
 * Replicates the web admin Ingredients module:
 *  - View list of all ingredients (Sr. No, name, unit parameter, cost per unit)
 *  - Search and filter ingredients dynamically
 *  - Add new ingredient modal with form validation (kg, litre, pack)
 *  - Edit existing ingredient modal with validation
 *  - Delete confirmation alert
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import ScreenTitle from '../../components/common/ScreenTitle';
import {
  fetchIngredients, createIngredient, updateIngredient, deleteIngredient, Ingredient
} from '../../services/ingredientsApi';

const UNIT_OPTIONS = ['kg', 'litre', 'pack'] as const;

interface FormState {
  name: string;
  unit: 'kg' | 'litre' | 'pack';
  cost_per_unit: string;
}

const BLANK_FORM: FormState = {
  name: '',
  unit: 'kg',
  cost_per_unit: '',
};

export default function IngredientsScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(BLANK_FORM);
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addSaving, setAddSaving] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState<FormState>(BLANK_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);

  // Load ingredients from API
  const loadIngredients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchIngredients();
      setIngredients(data || []);
    } catch (err: any) {
      console.error('Failed to load ingredients:', err);
      Alert.alert('Error', err?.message || 'Failed to load ingredients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  // Form Validation
  const validateForm = (form: FormState) => {
    const errors: Record<string, string> = {};
    if (!form.name || !form.name.trim()) {
      errors.name = 'Ingredient name is required';
    }
    if (!form.unit || !UNIT_OPTIONS.includes(form.unit)) {
      errors.unit = 'Please select a valid unit';
    }
    if (form.cost_per_unit === '' || form.cost_per_unit === undefined) {
      errors.cost_per_unit = 'Cost per unit is required';
    } else {
      const num = Number(form.cost_per_unit);
      if (isNaN(num) || num < 0) {
        errors.cost_per_unit = 'Cost must be a valid positive number';
      }
    }
    return errors;
  };

  // Add Handlers
  const handleAddSubmit = async () => {
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
      setAddModalVisible(false);
      setAddForm(BLANK_FORM);
      setAddErrors({});
      flash('Ingredient created successfully!');
      await loadIngredients();
    } catch (err: any) {
      console.error('Create failed:', err);
      setAddErrors({ api: err?.message || 'Failed to create ingredient' });
    } finally {
      setAddSaving(false);
    }
  };

  // Edit Handlers
  const handleOpenEdit = (ing: Ingredient) => {
    setEditId(ing.id);
    setEditForm({
      name: ing.name,
      unit: ing.unit,
      cost_per_unit: String(ing.cost_per_unit),
    });
    setEditErrors({});
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (editId === null) return;
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
      setEditModalVisible(false);
      setEditErrors({});
      flash('Ingredient updated successfully!');
      await loadIngredients();
    } catch (err: any) {
      console.error('Update failed:', err);
      setEditErrors({ api: err?.message || 'Failed to update ingredient' });
    } finally {
      setEditSaving(false);
    }
  };

  // Delete Handler
  const handleDeletePress = (ing: Ingredient) => {
    Alert.alert(
      'Delete Ingredient?',
      `Are you sure you want to delete "${ing.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIngredient(ing.id);
              flash('Ingredient deleted successfully');
              await loadIngredients();
            } catch (err: any) {
              console.error('Delete failed:', err);
              Alert.alert('Error', err?.message || 'Failed to delete ingredient');
            }
          },
        },
      ]
    );
  };

  // Filter list by search query
  const filteredIngredients = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderIngredientItem = ({ item, index }: { item: Ingredient; index: number }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Text style={styles.indexText}>{index + 1}.</Text>
          <Text style={styles.nameText}>{item.name}</Text>
        </View>
        <Badge
          variant={item.unit === 'kg' ? 'success' : item.unit === 'litre' ? 'info' : 'warning'}
          label={item.unit}
        />
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.detailLabel}>Cost per {item.unit}:</Text>
        <Text style={styles.detailValue}>₹{item.cost_per_unit.toFixed(2)}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => handleOpenEdit(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil" size={15} color={Colors.gold} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDeletePress(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="trash" size={15} color={Colors.red} />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.root}>
      {/* Search and Add Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ingredients..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setAddForm(BLANK_FORM);
            setAddErrors({});
            setAddModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={16} color={Colors.dark} style={{ marginRight: 3 }} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading && ingredients.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading ingredients...</Text>
        </View>
      ) : filteredIngredients.length === 0 ? (
        <EmptyState
          icon="nutrition-outline"
          title="No Ingredients Found"
          subtitle={search ? "No ingredients match your search query." : "Start adding ingredients to manage costs and recipes."}
        />
      ) : (
        <FlatList
          data={filteredIngredients}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderIngredientItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={loadIngredients}
          refreshing={loading}
        />
      )}

      {/* ── Add Modal ────────────────────────────────────── */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Ingredient</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {addErrors.api && <Text style={styles.apiErrorText}>{addErrors.api}</Text>}

            <ScrollView style={styles.modalForm}>
              {/* Ingredient Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ingredient Name *</Text>
                <TextInput
                  style={[styles.input, addErrors.name && styles.inputError]}
                  placeholder="e.g. Bread"
                  placeholderTextColor={Colors.textLight}
                  value={addForm.name}
                  onChangeText={(val) => setAddForm((f) => ({ ...f, name: val }))}
                />
                {addErrors.name && <Text style={styles.errorText}>{addErrors.name}</Text>}
              </View>

              {/* Unit Dropdown / Radio selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Unit (Parameter) *</Text>
                <View style={styles.unitSelector}>
                  {UNIT_OPTIONS.map((opt) => {
                    const isSelected = addForm.unit === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.unitBtn, isSelected && styles.unitBtnActive]}
                        onPress={() => setAddForm((f) => ({ ...f, unit: opt }))}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.unitBtnText, isSelected && styles.unitBtnTextActive]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {addErrors.unit && <Text style={styles.errorText}>{addErrors.unit}</Text>}
              </View>

              {/* Cost Per Unit */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cost Per {addForm.unit} (₹) *</Text>
                <TextInput
                  style={[styles.input, addErrors.cost_per_unit && styles.inputError]}
                  placeholder="e.g. 80.00"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={addForm.cost_per_unit}
                  onChangeText={(val) => setAddForm((f) => ({ ...f, cost_per_unit: val }))}
                />
                {addErrors.cost_per_unit && <Text style={styles.errorText}>{addErrors.cost_per_unit}</Text>}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleAddSubmit}
              disabled={addSaving}
              activeOpacity={0.85}
            >
              {addSaving ? (
                <ActivityIndicator size="small" color={Colors.dark} />
              ) : (
                <Text style={styles.submitBtnText}>Add Ingredient</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Modal ───────────────────────────────────── */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Ingredient</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {editErrors.api && <Text style={styles.apiErrorText}>{editErrors.api}</Text>}

            <ScrollView style={styles.modalForm}>
              {/* Ingredient Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ingredient Name *</Text>
                <TextInput
                  style={[styles.input, editErrors.name && styles.inputError]}
                  placeholder="e.g. Bread"
                  placeholderTextColor={Colors.textLight}
                  value={editForm.name}
                  onChangeText={(val) => setEditForm((f) => ({ ...f, name: val }))}
                />
                {editErrors.name && <Text style={styles.errorText}>{editErrors.name}</Text>}
              </View>

              {/* Unit Dropdown / Radio selection */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Unit (Parameter) *</Text>
                <View style={styles.unitSelector}>
                  {UNIT_OPTIONS.map((opt) => {
                    const isSelected = editForm.unit === opt;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[styles.unitBtn, isSelected && styles.unitBtnActive]}
                        onPress={() => setEditForm((f) => ({ ...f, unit: opt }))}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.unitBtnText, isSelected && styles.unitBtnTextActive]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {editErrors.unit && <Text style={styles.errorText}>{editErrors.unit}</Text>}
              </View>

              {/* Cost Per Unit */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Cost Per {editForm.unit} (₹) *</Text>
                <TextInput
                  style={[styles.input, editErrors.cost_per_unit && styles.inputError]}
                  placeholder="e.g. 80.00"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                  value={editForm.cost_per_unit}
                  onChangeText={(val) => setEditForm((f) => ({ ...f, cost_per_unit: val }))}
                />
                {editErrors.cost_per_unit && <Text style={styles.errorText}>{editErrors.cost_per_unit}</Text>}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleEditSubmit}
              disabled={editSaving}
              activeOpacity={0.85}
            >
              {editSaving ? (
                <ActivityIndicator size="small" color={Colors.dark} />
              ) : (
                <Text style={styles.submitBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Toast Alert */}
      {toast ? <Toast message={toast} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: FontSize.sm, color: Colors.textMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: FontSize.sm, color: Colors.text, padding: 0 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtnText: { fontSize: FontSize.sm, color: Colors.dark, fontWeight: FontWeight.bold },
  listContainer: { padding: 16, gap: 12, paddingBottom: 32 },

  // Ingredient Card
  card: { padding: 16, borderRadius: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: 8 },
  indexText: { fontSize: FontSize.base, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  nameText: { fontSize: FontSize.base, color: Colors.text, fontWeight: FontWeight.bold, flex: 1 },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    marginBottom: 12,
  },
  detailLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  detailValue: { fontSize: FontSize.base, color: Colors.text, fontWeight: FontWeight.bold },

  actionRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtn: { borderColor: Colors.gold + '55', backgroundColor: Colors.gold + '11' },
  editBtnText: { fontSize: FontSize.xs, color: Colors.gold, fontWeight: FontWeight.semibold },
  deleteBtn: { borderColor: Colors.red + '55', backgroundColor: Colors.red + '11' },
  deleteBtnText: { fontSize: FontSize.xs, color: Colors.red, fontWeight: FontWeight.semibold },

  // Modals
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  apiErrorText: { color: Colors.red, fontSize: FontSize.sm, marginBottom: 12, textAlign: 'center', fontWeight: FontWeight.medium },
  modalForm: { marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.bold, marginBottom: 8 },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  inputError: { borderColor: Colors.red },
  errorText: { color: Colors.red, fontSize: FontSize.xs, marginTop: 4, fontWeight: FontWeight.medium },
  submitBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnText: { fontSize: FontSize.base, color: Colors.dark, fontWeight: FontWeight.bold },

  // Unit Selector radio buttons
  unitSelector: { flexDirection: 'row', gap: 10 },
  unitBtn: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnActive: {
    backgroundColor: Colors.gold + '11',
    borderColor: Colors.gold,
  },
  unitBtnText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.semibold },
  unitBtnTextActive: { color: Colors.gold, fontWeight: FontWeight.bold },
});
