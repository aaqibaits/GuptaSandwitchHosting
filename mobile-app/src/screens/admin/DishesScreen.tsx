/**
 * DishesScreen.tsx
 * ────────────────
 * Dish management — Offline/Online tabs, dish cards, add/delete dish modal.
 * Mirrors Dishes.jsx from the web admin panel.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, KeyboardAvoidingView, Platform,
  Switch, Alert, FlatList, Image,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ScreenTitle from '../../components/common/ScreenTitle';
import { Dish } from '../../types';
import {
  getDishes, getCategories, createDish, editDish as apiEditDish,
  removeDish, uploadDishImage, ApiDish
} from '../../services/dishesApi';
import { getAllOutlets } from '../../services/outletApi';
import * as ImagePicker from 'expo-image-picker';
import { ApiError, BASE_URL, getToken } from '../../services/api';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const OUTLETS = ['Koregaon Park', 'Baner', 'Kothrud'];
const FALLBACK_CATEGORIES = ['Sandwiches', 'Subs', 'Beverages', 'Snacks', 'Pizza', 'Burgers'];

// Map API dish → local Dish type
function apiToLocalDish(d: ApiDish): Dish {
  return {
    id: d.id,
    name: d.name,
    cat: d.category,
    dine: d.dine_price,
    parcel: d.parcel_price,
    swiggy: d.swiggy_price ?? null,
    zomato: d.zomato_price ?? null,
    ingredients: d.ingredients ?? [],
    outlets: d.outlets?.length ? d.outlets : ['All'],
    image_url: d.image_url ?? null,
  };
}

const BLANK_FORM = {
  name: '', cat: 'Sandwiches',
  dine: '', parcel: '', swiggy: '', zomato: '',
  ingredients: '', allOutlets: true,
  outlets: { 'Koregaon Park': false, Baner: false, Kothrud: false } as Record<string, boolean>,
};

export default function DishesScreen() {
  const [tab, setTab] = useState<'offline' | 'online'>('offline');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [catFilter, setCatFilter] = useState('All');
  const [dynamicOutlets, setDynamicOutlets] = useState<string[]>(['Koregaon Park', 'Baner', 'Kothrud']);
  const [editDish, setEditDish] = useState<Dish | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<any | null>(null);
  const [deleteWarningDish, setDeleteWarningDish] = useState<Dish | null>(null);

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          setSelectedImageFile(file);
          setSelectedImageUri(URL.createObjectURL(file));
        }
      };
      input.click();
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access gallery is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setSelectedImageUri(result.assets[0].uri);
        setSelectedImageFile(null);
      }
    }
  };

  // ── Fetch dishes on mount ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dishRes, catRes, outletRes] = await Promise.all([
        getDishes(),
        getCategories(),
        getAllOutlets()
      ]);
      setDishes(dishRes.dishes.map(apiToLocalDish));
      if (catRes.categories?.length) {
        setCategories(catRes.categories.map((c) => c.name));
      }
      if (outletRes.outlets?.length) {
        setDynamicOutlets(outletRes.outlets.map((o) => o.name));
      }
    } catch {
      // Keep empty — show EmptyState
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const list = (() => {
    let filtered = tab === 'online' ? dishes.filter((d) => d.swiggy !== null) : dishes;
    if (catFilter !== 'All') filtered = filtered.filter((d) => d.cat === catFilter);
    return filtered;
  })();

  const allCats = ['All', ...Array.from(new Set(dishes.map((d) => d.cat)))];

  const handleDelete = (dish: Dish) => {
    setDeleteWarningDish(dish);
  };

  const handleEditPress = (d: Dish) => {
    setEditDish(d);
    setForm({
      name: d.name,
      cat: d.cat,
      dine: String(d.dine),
      parcel: String(d.parcel),
      swiggy: d.swiggy !== null ? String(d.swiggy) : '',
      zomato: d.zomato !== null ? String(d.zomato) : '',
      ingredients: d.ingredients.join(', '),
      allOutlets: d.outlets.includes('All'),
      outlets: dynamicOutlets.reduce((acc, o) => {
        acc[o] = d.outlets.includes(o);
        return acc;
      }, {} as Record<string, boolean>),
    });
    setSelectedImageUri(d.image_url ? `${BASE_URL}${d.image_url}` : null);
    setSelectedImageFile(null);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const selectedOutlets = form.allOutlets
        ? ['All']
        : dynamicOutlets.filter((o) => form.outlets[o]);

      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('category', form.cat);
      fd.append('dine_price', form.dine);
      fd.append('parcel_price', form.parcel);
      fd.append('swiggy_price', form.swiggy || '');
      fd.append('zomato_price', form.zomato || '');
      fd.append('ingredients', form.ingredients);
      fd.append('outlets', JSON.stringify(selectedOutlets.length ? selectedOutlets : ['All']));

      if (selectedImageFile) {
        fd.append('image', selectedImageFile);
      } else if (selectedImageUri && !selectedImageUri.startsWith('http') && !selectedImageUri.startsWith('/uploads')) {
        const filename = selectedImageUri.split('/').pop() || 'dish.jpg';
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;
        fd.append('image', {
          uri: selectedImageUri,
          name: filename,
          type: type,
        } as any);
      }

      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = editDish
        ? `${BASE_URL}/api/dishes/${editDish.id}`
        : `${BASE_URL}/api/dishes`;

      const method = editDish ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: fd,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to save dish');
      }

      fetchData();
      setForm({ ...BLANK_FORM });
      setSelectedImageUri(null);
      setSelectedImageFile(null);
      setEditDish(null);
      setModal(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save dish.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top area */}
      <View style={styles.topArea}>
        <ScreenTitle title="Dishes" />
        {/* Subtitle + Add button row */}
        <View style={styles.subRow}>
          <Text style={styles.subtitle}>
            {loading ? 'Loading…' : `${dishes.length} dishes total`}
          </Text>
          <TouchableOpacity style={styles.addDishBtn} onPress={() => { setForm({ ...BLANK_FORM }); setSelectedImageUri(null); setSelectedImageFile(null); setEditDish(null); setModal(true); }} activeOpacity={0.8}>
            <Text style={styles.addDishBtnText}>+ Add dish</Text>
          </TouchableOpacity>
        </View>

        {/* Offline / Online tabs */}
        <View style={styles.tabRow}>
          {(['offline', 'online'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <View style={styles.tabBtnInner}>
                {t === 'offline' ? (
                  <Ionicons name="storefront-outline" size={14} color={tab === t ? Colors.gold : Colors.textMuted} style={{ marginRight: 5 }} />
                ) : (
                  <Ionicons name="phone-portrait-outline" size={14} color={tab === t ? Colors.gold : Colors.textMuted} style={{ marginRight: 5 }} />
                )}
                <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                  {t === 'offline' ? 'Offline' : 'Online (Swiggy / Zomato)'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {allCats.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.catPill, catFilter === c && styles.catPillActive]}
              onPress={() => setCatFilter(c)}
            >
              <Text style={[styles.catPillText, catFilter === c && styles.catPillTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dish list */}
      {loading ? (
        <EmptyState icon="time-outline" message="Loading dishes…" sub="Fetching from server" />
      ) : list.length === 0 ? (
        <EmptyState icon="restaurant-outline" message="No dishes found" sub="Try a different filter or add a dish." />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: d }) => (
            <Card style={styles.dishCard}>
              <View style={styles.dishRow}>
                {d.image_url ? (
                  <Image
                    source={{ uri: `${BASE_URL}${d.image_url}` }}
                    style={styles.dishImage}
                  />
                ) : (
                  <View style={styles.dishImagePlaceholder}>
                    <Ionicons name="fast-food-outline" size={22} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.dishInfo}>
                  <Text style={styles.dishName}>{d.name}</Text>
                  <Badge label={d.cat} variant="info" style={{ marginVertical: 4 }} />
                  {tab === 'offline' ? (
                    <View style={styles.priceRow}>
                      <View style={styles.priceTag}>
                        <Text style={styles.priceTagText}>Dine-in ₹{d.dine}</Text>
                      </View>
                      <View style={styles.priceTag}>
                        <Text style={styles.priceTagText}>Parcel ₹{d.parcel}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.priceRow}>
                      <View style={[styles.priceTag, { backgroundColor: '#FFF1E6' }]}>
                        <Text style={[styles.priceTagText, { color: '#C2410C' }]}>Swiggy ₹{d.swiggy}</Text>
                      </View>
                      <View style={[styles.priceTag, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.priceTagText, { color: '#B91C1C' }]}>Zomato ₹{d.zomato}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.ingredientsRow}>
                    <MaterialCommunityIcons name="shaker-outline" size={12} color={Colors.textMuted} style={{ marginRight: 3 }} />
                    <Text style={styles.ingredients} numberOfLines={1}>
                      {d.ingredients.join(', ')}
                    </Text>
                  </View>
                  <View style={styles.chipRow}>
                    {d.outlets.map((o) => (
                      <View key={o} style={styles.chip}>
                        <Text style={styles.chipText}>{o}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleEditPress(d)}
                  >
                    <Ionicons name="pencil-outline" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(d)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* Delete Warning Modal */}
      <Modal visible={deleteWarningDish !== null} transparent animationType="fade">
        <View style={styles.deleteModalBg}>
          <Card style={styles.deleteModalCard}>
            <View style={styles.deleteWarningIconBg}>
              <Ionicons name="warning-outline" size={32} color={Colors.red} />
            </View>
            <Text style={styles.deleteModalTitle}>Delete {deleteWarningDish?.name}?</Text>
            <Text style={styles.deleteModalDesc}>
              If you delete this dish, changes cannot be undone. All linked data will be lost.
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteWarningDish(null)}
              >
                <Text style={styles.deleteCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={async () => {
                  if (!deleteWarningDish) return;
                  const targetId = deleteWarningDish.id;
                  setDeleteWarningDish(null);
                  try {
                    await removeDish(targetId);
                    setDishes((prev) => prev.filter((x) => x.id !== targetId));
                  } catch (err: any) {
                    const errMsg = err?.data?.message ?? err?.data?.error ?? err?.message ?? 'Could not delete dish.';
                    if (Platform.OS === 'web') {
                      alert(`Error: ${errMsg}`);
                    } else {
                      Alert.alert('Error', errMsg);
                    }
                  }
                }}
              >
                <Text style={styles.deleteConfirmBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Add Dish Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBg}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>{editDish ? `Edit — ${editDish.name}` : 'Add New Dish'}</Text>
              <TouchableOpacity onPress={() => { setModal(false); setEditDish(null); setSelectedImageUri(null); setSelectedImageFile(null); }}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <View style={{ marginBottom: 14 }}>
                <Text style={fieldStyles.label}>Dish Image</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage} activeOpacity={0.8}>
                  {selectedImageUri ? (
                    <Image source={{ uri: selectedImageUri }} style={styles.imagePickerPreview} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color={Colors.textMuted} style={{ marginBottom: 6 }} />
                      <Text style={styles.imagePickerPlaceholderText}>Select Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <FieldRow label="Dish name *">
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Paneer Club Sandwich"
                  placeholderTextColor={Colors.textLight}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </FieldRow>

              <FieldRow label="Category">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catPill, form.cat === c && styles.catPillActive, { marginRight: 6 }]}
                      onPress={() => setForm((f) => ({ ...f, cat: c }))}
                    >
                      <Text style={[styles.catPillText, form.cat === c && styles.catPillTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </FieldRow>

              <FieldRow label="Offline pricing">
                <View style={styles.twoInputs}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="Dine-in (₹)"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="numeric"
                    value={form.dine}
                    onChangeText={(v) => setForm((f) => ({ ...f, dine: v }))}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Parcel (₹)"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="numeric"
                    value={form.parcel}
                    onChangeText={(v) => setForm((f) => ({ ...f, parcel: v }))}
                  />
                </View>
              </FieldRow>

              <FieldRow label="Online pricing">
                <View style={styles.twoInputs}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                    placeholder="Swiggy (₹)"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="numeric"
                    value={form.swiggy}
                    onChangeText={(v) => setForm((f) => ({ ...f, swiggy: v }))}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Zomato (₹)"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="numeric"
                    value={form.zomato}
                    onChangeText={(v) => setForm((f) => ({ ...f, zomato: v }))}
                  />
                </View>
              </FieldRow>

              <FieldRow label="Ingredients (comma separated)">
                <TextInput
                  style={styles.input}
                  placeholder="Bread, Paneer, Mayo, Capsicum"
                  placeholderTextColor={Colors.textLight}
                  value={form.ingredients}
                  onChangeText={(v) => setForm((f) => ({ ...f, ingredients: v }))}
                />
              </FieldRow>

              <FieldRow label="Outlets">
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Add to all outlets</Text>
                  <Switch
                    value={form.allOutlets}
                    onValueChange={(v) => setForm((f) => ({ ...f, allOutlets: v }))}
                    trackColor={{ true: Colors.dark }}
                    thumbColor={Colors.gold}
                  />
                </View>
                {!form.allOutlets && (
                  <View style={styles.outletCheckRow}>
                    {dynamicOutlets.map((o) => (
                      <TouchableOpacity
                        key={o}
                        style={[styles.outletCheck, form.outlets[o] && styles.outletCheckActive]}
                        onPress={() =>
                          setForm((f) => ({
                            ...f,
                            outlets: { ...f.outlets, [o]: !f.outlets[o] },
                          }))
                        }
                      >
                        <Text style={[styles.outletCheckText, form.outlets[o] && styles.outletCheckTextActive]}>
                          {form.outlets[o] ? <Ionicons name="checkmark" size={12} color={Colors.gold} /> : null}{o}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </FieldRow>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Dish'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// Helper sub-component
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 6,
  },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  topArea: { paddingHorizontal: 16, paddingTop: 16 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  addDishBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addDishBtnText: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  tabRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  tabBtnActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  tabBtnText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  tabBtnTextActive: { color: Colors.gold },
  tabBtnInner: { flexDirection: 'row', alignItems: 'center' },

  catRow: { marginBottom: 12, flexGrow: 0 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginRight: 6,
  },
  catPillActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  catPillText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  catPillTextActive: { color: Colors.gold },

  dishCard: { marginBottom: 10 },
  dishRow: { flexDirection: 'row', alignItems: 'center' },
  dishImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  dishImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ingredientsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ingredients: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1, marginTop: 4 },
  dishInfo: { flex: 1 },
  dishName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  priceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  priceTag: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  chip: {
    backgroundColor: Colors.blueLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: { fontSize: FontSize.xs, color: Colors.blue, fontWeight: FontWeight.medium },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },

  // Modal
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '92%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  closeX: { fontSize: 18, color: Colors.textMuted, paddingHorizontal: 4 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  twoInputs: { flexDirection: 'row' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  switchLabel: { fontSize: FontSize.base, color: Colors.text, fontWeight: FontWeight.medium },
  outletCheckRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  outletCheck: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  outletCheckActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  outletCheckText: { fontSize: FontSize.sm, color: Colors.textMuted },
  outletCheckTextActive: { color: Colors.gold },
  saveBtn: {
    backgroundColor: Colors.dark,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveBtnText: { color: Colors.gold, fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Edit / Image Picker styles
  editBtn: { padding: 6 },
  editBtnText: { fontSize: 18 },
  imagePickerBtn: {
    width: '100%',
    height: 140,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePickerPreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerPlaceholderText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontWeight: FontWeight.medium,
  },

  // Delete Warning Custom Modal styles
  deleteModalBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    padding: 24,
  },
  deleteModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  deleteWarningIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  deleteModalDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  deleteCancelBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textOnDark,
  },
});
