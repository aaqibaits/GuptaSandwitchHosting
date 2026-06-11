/**
 * OutletsScreen.tsx
 * ─────────────────
 * Full outlet & user management panel.
 * Mirrors Outlets.jsx from the web admin panel exactly:
 *  - Outlet cards (name, manager, address, phone, email, username, status)
 *  - Nested user management per outlet (add/edit/delete users)
 *  - Role preset picker (Manager / Cashier / Kitchen Staff / Custom)
 *  - Screen permission grid (Admin + Staff screens)
 *  - Add/Edit outlet modals with validation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, Alert, Switch, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight } from '../../constants/typography';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import Toast from '../../components/common/Toast';
import ScreenTitle from '../../components/common/ScreenTitle';
import { Outlet, OutletUser, ScreenPermissions, AppRole } from '../../types';
import {
  getAllOutlets, addOutlet as apiAddOutlet, updateOutlet as apiUpdateOutlet,
  deleteOutlet as apiDeleteOutlet, toggleOutletStatus as apiToggleOutletStatus,
  addUserToOutlet, updateOutletUser as apiUpdateUser, deleteOutletUser as apiDeleteUser,
  toggleOutletUserStatus as apiToggleUserStatus, uploadOutletImage, ApiOutlet, ApiOutletUser,
} from '../../services/outletApi';
import { ApiError, BASE_URL } from '../../services/api';

// Map API outlet → local Outlet type
function apiToLocalOutlet(o: ApiOutlet): Outlet {
  return {
    id: o.id,
    name: o.name,
    address: o.address,
    phone: o.phone,
    manager: o.manager,
    email: o.email,
    username: o.username,
    password: '',
    status: o.status,
    users: (o.users ?? []).map(apiToLocalUser),
    image_url: o.image_url ?? null,
  };
}

function apiToLocalUser(u: ApiOutletUser): OutletUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username,
    password: '',
    roleLabel: u.role_label,
    appRole: u.app_role,
    permissions: u.permissions ?? { admin: [], staff: [] },
    status: u.status,
  };
}

// ── Screen definitions ───────────────────────────────────────────────────────
const ADMIN_SCREENS = [
  { key: 'dashboard',  label: 'Dashboard' },
  { key: 'dishes',     label: 'Dishes' },
  { key: 'reports',    label: 'Reports' },
  { key: 'accounting', label: 'Accounting' },
  { key: 'outlets',    label: 'Outlets' },
];

const STAFF_SCREENS = [
  { key: 'pos',         label: 'POS' },
  { key: 'kot',         label: 'KOT' },
  { key: 'reports',     label: 'Reports' },
  { key: 'live-orders', label: 'Live Orders' },
];

const PRESET_ROLES = [
  { label: 'Manager',       appRole: 'Admin' as const, desc: 'Full admin access',    permissions: { admin: ['dashboard','dishes','reports','accounting','outlets'], staff: [] } },
  { label: 'Cashier',       appRole: 'Staff' as const, desc: 'POS + Reports',        permissions: { admin: [], staff: ['pos','reports'] } },
  { label: 'Kitchen Staff', appRole: 'Staff' as const, desc: 'KOT + Live Orders',    permissions: { admin: [], staff: ['kot','live-orders'] } },
  { label: 'Custom',        appRole: 'Staff' as const, desc: 'Pick any screens',     permissions: { admin: [], staff: [] } },
];

// ── Seed data ────────────────────────────────────────────────────────────────
const INITIAL_OUTLETS: Outlet[] = [
  {
    id: 1, name: 'Koregaon Park',
    address: 'Shop 12, Lane 5, Koregaon Park, Pune - 411001',
    phone: '9876543210', manager: 'Ramesh Gupta',
    email: 'kp@guptasandwich.in', username: 'outlet_kp', password: 'kp@1234',
    status: 'active',
    users: [
      { id: 101, name: 'Ankit Sharma', email: 'ankit@guptasandwich.in', username: 'ankit_kp',
        password: 'ankit@123', roleLabel: 'Cashier', appRole: 'Staff',
        permissions: { admin: [], staff: ['pos','reports'] }, status: 'active' },
    ],
  },
  {
    id: 2, name: 'Baner',
    address: 'Plot 8, Baner Road, Baner, Pune - 411045',
    phone: '9876543211', manager: 'Suresh Sharma',
    email: 'baner@guptasandwich.in', username: 'outlet_baner', password: 'baner@1234',
    status: 'active', users: [],
  },
  {
    id: 3, name: 'Kothrud',
    address: 'Near Vanaz, Kothrud, Pune - 411038',
    phone: '9876543212', manager: 'Dinesh Patil',
    email: 'kothrud@guptasandwich.in', username: 'outlet_kothrud', password: 'kothrud@1234',
    status: 'inactive', users: [],
  },
];

const BLANK_OUTLET = { name: '', address: '', phone: '', manager: '', email: '', username: '', password: '', confirmPassword: '', status: 'active' as const };
const BLANK_USER   = { name: '', email: '', username: '', password: '', confirmPassword: '', roleLabel: 'Cashier', appRole: 'Staff' as const, permissions: { admin: [], staff: ['pos','reports'] } as ScreenPermissions, status: 'active' as const };

// ── Main component ───────────────────────────────────────────────────────────
export default function OutletsScreen() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setSelectedImageUri(reader.result as string);
          };
          reader.readAsDataURL(file);
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
      }
    }
  };

  // ── Fetch outlets on mount ────────────────────────────────────────────
  const fetchOutlets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllOutlets();
      setOutlets(res.outlets.map(apiToLocalOutlet));
    } catch {
      // Keep empty list
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOutlets(); }, [fetchOutlets]);

  // Outlet modal state
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [editOutlet, setEditOutlet]       = useState<Outlet | null>(null);
  const [outletForm, setOutletForm]       = useState<{ name: string; address: string; phone: string; manager: string; email: string; username: string; password: string; confirmPassword: string; status: 'active' | 'inactive' }>({ ...BLANK_OUTLET });
  const [outletErrors, setOutletErrors]   = useState<Record<string, string>>({});

  // User modal state
  const [userModalOutlet, setUserModalOutlet] = useState<Outlet | null>(null);
  const [editUser, setEditUser]               = useState<OutletUser | null>(null);
  const [userForm, setUserForm]               = useState<{ name: string; email: string; username: string; password: string; confirmPassword: string; roleLabel: string; appRole: AppRole; permissions: ScreenPermissions; status: 'active' | 'inactive' }>({ ...BLANK_USER });
  const [userErrors, setUserErrors]           = useState<Record<string, string>>({});
  const [showPass, setShowPass]               = useState({ o: false, oc: false, u: false, uc: false });

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };
  const togglePass = (k: keyof typeof showPass) => setShowPass(p => ({ ...p, [k]: !p[k] }));

  // ── Outlet CRUD ────────────────────────────────────────────────────────────
  const validateOutlet = (isEdit = false) => {
    const e: Record<string, string> = {};
    if (!outletForm.name.trim())    e.name    = 'Required';
    if (!outletForm.address.trim()) e.address = 'Required';
    if (!outletForm.phone.trim())   e.phone   = 'Required';
    if (!outletForm.manager.trim()) e.manager = 'Required';
    if (!outletForm.username.trim()) e.username = 'Required';
    if (!isEdit || outletForm.password) {
      if (!outletForm.password)                                          e.password = 'Required';
      else if (outletForm.password.length < 6)                          e.password = 'Min 6 chars';
      if (outletForm.password !== outletForm.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    return e;
  };

  const handleAddOutlet = async () => {
    const errs = validateOutlet(false);
    if (Object.keys(errs).length) { setOutletErrors(errs); return; }
    try {
      const res = await apiAddOutlet({
        name: outletForm.name,
        address: outletForm.address,
        phone: outletForm.phone,
        manager: outletForm.manager,
        email: outletForm.email,
        username: outletForm.username,
        password: outletForm.password,
      });
      
      let localOutlet = apiToLocalOutlet(res.outlet);
      if (selectedImageUri) {
        try {
          const uploadRes = await uploadOutletImage(res.outlet.id, selectedImageUri);
          localOutlet = apiToLocalOutlet(uploadRes.outlet);
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
        }
      }

      setOutlets(o => [...o, localOutlet]);
      setShowAddOutlet(false);
      setOutletForm({ ...BLANK_OUTLET });
      setSelectedImageUri(null);
      flash(`Outlet "${outletForm.name}" added!`);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message ?? 'Could not add outlet.');
    }
  };

  const handleEditOutletSave = async () => {
    const errs = validateOutlet(true);
    if (Object.keys(errs).length) { setOutletErrors(errs); return; }
    try {
      const res = await apiUpdateOutlet(editOutlet!.id, {
        name: outletForm.name,
        address: outletForm.address,
        phone: outletForm.phone,
        manager: outletForm.manager,
        email: outletForm.email,
        username: outletForm.username,
        status: outletForm.status,
      });
      
      let localOutlet = apiToLocalOutlet(res.outlet);
      if (selectedImageUri && !selectedImageUri.startsWith('http') && !selectedImageUri.startsWith('/uploads')) {
        try {
          const uploadRes = await uploadOutletImage(editOutlet!.id, selectedImageUri);
          localOutlet = apiToLocalOutlet(uploadRes.outlet);
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
        }
      }

      setOutlets(prev => prev.map(o => o.id === editOutlet!.id ? localOutlet : o));
      setEditOutlet(null);
      setSelectedImageUri(null);
      flash('Outlet updated!');
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message ?? 'Could not update outlet.');
    }
  };

  const toggleOutletStatus = async (id: number) => {
    try {
      await apiToggleOutletStatus(id);
      setOutlets(prev => prev.map(o => o.id === id
        ? { ...o, status: o.status === 'active' ? 'inactive' : 'active' } : o));
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message ?? 'Could not toggle status.');
    }
  };

  const handleDeleteOutlet = (id: number) => {
    const performDelete = async () => {
      try {
        await apiDeleteOutlet(id);
        setOutlets(o => o.filter(x => x.id !== id));
        flash('Outlet deleted.');
      } catch (err: any) {
        const errMsg = err?.data?.message ?? err?.data?.error ?? err?.message ?? 'Could not delete outlet.';
        if (Platform.OS === 'web') {
          alert(`Error: ${errMsg}`);
        } else {
          Alert.alert('Error', errMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Delete outlet?\nThis cannot be undone.');
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert('Delete outlet?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  // ── User CRUD ───────────────────────────────────────────────────────────────
  const applyPreset = (label: string) => {
    const p = PRESET_ROLES.find(r => r.label === label);
    if (!p) return;
    setUserForm(f => ({ ...f, roleLabel: p.label, appRole: p.appRole,
      permissions: label === 'Custom' ? { admin: [], staff: [] } : { ...p.permissions } }));
  };

  const toggleScreen = (section: 'admin' | 'staff', key: string) => {
    setUserForm(f => {
      const list = f.permissions[section];
      const updated = list.includes(key) ? list.filter(k => k !== key) : [...list, key];
      return { ...f, permissions: { ...f.permissions, [section]: updated } };
    });
  };

  const validateUser = (isEdit = false) => {
    const e: Record<string, string> = {};
    if (!userForm.name.trim())     e.name     = 'Required';
    if (!userForm.username.trim()) e.username = 'Required';
    if (!isEdit || userForm.password) {
      if (!userForm.password)                                       e.password = 'Required';
      else if (userForm.password.length < 6)                       e.password = 'Min 6 chars';
      if (userForm.password !== userForm.confirmPassword) e.confirmPassword = 'Mismatch';
    }
    const hasAny = userForm.permissions.admin.length + userForm.permissions.staff.length > 0;
    if (!hasAny) e.permissions = 'Select at least one screen';
    return e;
  };

  const handleAddUser = async () => {
    const errs = validateUser(false);
    if (Object.keys(errs).length) { setUserErrors(errs); return; }
    try {
      const res = await addUserToOutlet(userModalOutlet!.id, {
        name: userForm.name,
        email: userForm.email,
        username: userForm.username,
        password: userForm.password,
        role_label: userForm.roleLabel,
        app_role: userForm.appRole,
        permissions: userForm.permissions,
      });
      const newUser = apiToLocalUser(res.user);
      setOutlets(prev => prev.map(o => o.id === userModalOutlet!.id
        ? { ...o, users: [...o.users, newUser] } : o));
      setUserModalOutlet(null);
      flash(`User "${userForm.name}" added to ${userModalOutlet!.name}!`);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message ?? 'Could not add user.');
    }
  };

  const handleEditUserSave = async () => {
    const errs = validateUser(true);
    if (Object.keys(errs).length) { setUserErrors(errs); return; }
    try {
      const res = await apiUpdateUser(userModalOutlet!.id, editUser!.id, {
        name: userForm.name,
        email: userForm.email,
        username: userForm.username,
        role_label: userForm.roleLabel,
        app_role: userForm.appRole,
        permissions: userForm.permissions,
        status: userForm.status,
        ...(userForm.password ? { password: userForm.password } : {}),
      });
      const updated = apiToLocalUser(res.user);
      setOutlets(prev => prev.map(o => o.id === userModalOutlet!.id
        ? { ...o, users: o.users.map(u => u.id === editUser!.id ? updated : u) } : o));
      setEditUser(null);
      setUserModalOutlet(null);
      flash('User updated!');
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message ?? 'Could not update user.');
    }
  };

  const toggleUserStatus = async (outletId: number, userId: number) => {
    try {
      await apiToggleUserStatus(outletId, userId);
      setOutlets(prev => prev.map(o => o.id === outletId
        ? { ...o, users: o.users.map(u => u.id === userId
            ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u) } : o));
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message ?? 'Could not toggle user status.');
    }
  };

  const handleDeleteUser = (outletId: number, userId: number) => {
    const performDelete = async () => {
      try {
        await apiDeleteUser(outletId, userId);
        setOutlets(prev => prev.map(o => o.id === outletId
          ? { ...o, users: o.users.filter(u => u.id !== userId) } : o));
        flash('User deleted.');
      } catch (err: any) {
        const errMsg = err?.data?.message ?? err?.data?.error ?? err?.message ?? 'Could not delete user.';
        if (Platform.OS === 'web') {
          alert(`Error: ${errMsg}`);
        } else {
          Alert.alert('Error', errMsg);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Delete user?\nThis cannot be undone.');
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert('Delete user?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete },
      ]);
    }
  };

  const isCustom = userForm.roleLabel === 'Custom';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenTitle title="Outlets" subtitle="Manage outlets & staff users" />
        <View style={styles.subRow}>
          <Text style={styles.subtitle}>{outlets.length} outlets total</Text>
          <TouchableOpacity style={styles.addOutletBtn} onPress={() => { setOutletForm({ ...BLANK_OUTLET }); setOutletErrors({}); setSelectedImageUri(null); setShowAddOutlet(true); }} activeOpacity={0.8}>
            <Text style={styles.addOutletBtnText}>+ Add outlet</Text>
          </TouchableOpacity>
        </View>

        {outlets.map((o) => (
          <Card key={o.id} style={o.status === 'inactive' ? styles.inactiveCard : undefined}>
            {o.image_url ? (
              <Image
                source={{ uri: `${BASE_URL}${o.image_url}` }}
                style={styles.outletCardImage}
              />
            ) : (
              <View style={styles.outletCardImagePlaceholder}>
                <MaterialCommunityIcons name="store-outline" size={36} color={Colors.textMuted} />
              </View>
            )}

            {/* Outlet header */}
            <View style={styles.outletHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.outletName}>{o.name}</Text>
                <View style={styles.managerRow}>
                  <Ionicons name="person-outline" size={13} color={Colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={styles.outletManager}>{o.manager}</Text>
                </View>
              </View>
              <Badge label={o.status} variant={o.status === 'active' ? 'success' : 'muted'} />
            </View>

            {/* Outlet details */}
            <View style={styles.detailsBlock}>
              <DetailRow icon="location-outline" text={o.address} />
              <DetailRow icon="call-outline" text={o.phone} />
              {o.email ? <DetailRow icon="mail-outline" text={o.email} /> : null}
              <DetailRow icon="person-outline" text={o.username} mono />
            </View>

            {/* Users section */}
            <View style={styles.usersSection}>
              <View style={styles.usersSectionHeader}>
                <View style={styles.usersSectionTitleRow}>
                  <Ionicons name="people-outline" size={15} color={Colors.text} style={{ marginRight: 5 }} />
                  <Text style={styles.usersSectionTitle}>Staff Users ({o.users.length})</Text>
                </View>
                <TouchableOpacity
                  style={styles.addUserBtn}
                  onPress={() => { setUserModalOutlet(o); setUserForm({ ...BLANK_USER }); setUserErrors({}); setEditUser(null); }}
                >
                  <Text style={styles.addUserBtnText}>+ Add user</Text>
                </TouchableOpacity>
              </View>

              {o.users.length === 0 ? (
                <Text style={styles.noUsers}>No users added yet</Text>
              ) : (
                o.users.map((u) => (
                  <View key={u.id} style={[styles.userRow, u.status === 'inactive' && styles.userRowInactive]}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{u.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.name}</Text>
                      <Text style={styles.userMeta}>{u.roleLabel} · {[...u.permissions.admin, ...u.permissions.staff].join(', ') || '—'}</Text>
                    </View>
                    <View style={styles.userActions}>
                      <TouchableOpacity onPress={() => { setUserModalOutlet(o); setEditUser(u); setUserForm({ ...u, password: '', confirmPassword: '' }); setUserErrors({}); }}>
                        <Ionicons name="pencil-outline" size={18} color={Colors.textMuted} style={styles.iconBtn} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => toggleUserStatus(o.id, u.id)}>
                        <Ionicons
                          name={u.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                          size={18}
                          color={u.status === 'active' ? Colors.orange : Colors.green}
                          style={styles.iconBtn}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteUser(o.id, u.id)}>
                        <Ionicons name="trash-outline" size={18} color={Colors.red} style={styles.iconBtn} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Outlet actions */}
            <View style={styles.outletActions}>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => { setEditOutlet(o); setOutletForm({ ...o, password: '', confirmPassword: '' }); setOutletErrors({}); setSelectedImageUri(o.image_url ? `${BASE_URL}${o.image_url}` : null); }}
              >
                <Ionicons name="pencil-outline" size={14} color={Colors.text} style={{ marginRight: 4 }} />
                <Text style={styles.outlineBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.outlineBtn, o.status === 'active' ? styles.outlineBtnWarn : styles.outlineBtnSuccess]}
                onPress={() => toggleOutletStatus(o.id)}
              >
                <Ionicons
                  name={o.status === 'active' ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={14}
                  color={o.status === 'active' ? Colors.orange : Colors.green}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.outlineBtnText, o.status === 'active' ? { color: Colors.orange } : { color: Colors.green }]}>
                  {o.status === 'active' ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.outlineBtn, styles.outlineBtnDanger]} onPress={() => handleDeleteOutlet(o.id)}>
                <Ionicons name="trash-outline" size={16} color={Colors.red} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* ── Add / Edit Outlet Modal ───────────────────────────────────────── */}
      <Modal visible={showAddOutlet || !!editOutlet} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>{editOutlet ? `Edit — ${editOutlet.name}` : 'Add New Outlet'}</Text>
              <TouchableOpacity onPress={() => { setShowAddOutlet(false); setEditOutlet(null); }}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Picker Option */}
              <View style={{ marginBottom: 14 }}>
                <Text style={fi.label}>Outlet Image</Text>
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

              <FormInput label="Outlet name *"   value={outletForm.name}     error={outletErrors.name}     onChangeText={v => { setOutletForm(f => ({...f, name: v}));     setOutletErrors(e => ({...e, name: ''})); }}    placeholder="e.g. Koregaon Park" />
              <FormInput label="Address *"        value={outletForm.address}  error={outletErrors.address}  onChangeText={v => { setOutletForm(f => ({...f, address: v}));  setOutletErrors(e => ({...e, address: ''})); }} placeholder="Full address with pin" multiline />
              <FormInput label="Phone *"          value={outletForm.phone}    error={outletErrors.phone}    onChangeText={v => { setOutletForm(f => ({...f, phone: v}));    setOutletErrors(e => ({...e, phone: ''})); }}   placeholder="10-digit number" keyboardType="phone-pad" />
              <FormInput label="Manager name *"   value={outletForm.manager}  error={outletErrors.manager}  onChangeText={v => { setOutletForm(f => ({...f, manager: v}));  setOutletErrors(e => ({...e, manager: ''})); }} placeholder="Full name" />
              <FormInput label="Email"            value={outletForm.email}    onChangeText={v => setOutletForm(f => ({...f, email: v}))}    placeholder="outlet@guptasandwich.in" keyboardType="email-address" />
              <FormInput label="Username / ID *"  value={outletForm.username} error={outletErrors.username} onChangeText={v => { setOutletForm(f => ({...f, username: v})); setOutletErrors(e => ({...e, username: ''})); }} placeholder="e.g. outlet_kp" />
              <FormInput label="Password *"       value={outletForm.password} error={outletErrors.password} onChangeText={v => { setOutletForm(f => ({...f, password: v})); setOutletErrors(e => ({...e, password: ''})); }} placeholder="Min 6 chars" secureTextEntry={!showPass.o} eyeToggle={() => togglePass('o')} showPass={showPass.o} />
              <FormInput label="Confirm password *" value={outletForm.confirmPassword} error={outletErrors.confirmPassword} onChangeText={v => { setOutletForm(f => ({...f, confirmPassword: v})); setOutletErrors(e => ({...e, confirmPassword: ''})); }} placeholder="Re-enter" secureTextEntry={!showPass.oc} eyeToggle={() => togglePass('oc')} showPass={showPass.oc} />

              <TouchableOpacity style={styles.saveBtn} onPress={editOutlet ? handleEditOutletSave : handleAddOutlet} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>{editOutlet ? 'Save changes' : 'Add Outlet'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add / Edit User Modal ─────────────────────────────────────────── */}
      <Modal visible={!!userModalOutlet} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBg}>
          <View style={[styles.modalSheet, { maxHeight: '95%' }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>
                {editUser ? `Edit — ${editUser.name}` : `Add user to ${userModalOutlet?.name}`}
              </Text>
              <TouchableOpacity onPress={() => { setUserModalOutlet(null); setEditUser(null); }}>
                <Ionicons name="close" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FormInput label="Full name *"   value={userForm.name}     error={userErrors.name}     onChangeText={v => { setUserForm(f=>({...f,name:v}));     setUserErrors(e=>({...e,name:''})); }}    placeholder="e.g. Ankit Sharma" />
              <FormInput label="Email"         value={userForm.email}    onChangeText={v => setUserForm(f=>({...f,email:v}))}    placeholder="user@guptasandwich.in" keyboardType="email-address" />
              <FormInput label="Username *"    value={userForm.username} error={userErrors.username} onChangeText={v => { setUserForm(f=>({...f,username:v})); setUserErrors(e=>({...e,username:''})); }} placeholder="e.g. ankit_kp" />
              <FormInput label={editUser ? 'New password' : 'Password *'} value={userForm.password} error={userErrors.password} onChangeText={v => { setUserForm(f=>({...f,password:v})); setUserErrors(e=>({...e,password:''})); }} placeholder={editUser ? 'Leave blank to keep' : 'Min 6 chars'} secureTextEntry={!showPass.u} eyeToggle={() => togglePass('u')} showPass={showPass.u} />
              <FormInput label="Confirm password" value={userForm.confirmPassword} error={userErrors.confirmPassword} onChangeText={v => { setUserForm(f=>({...f,confirmPassword:v})); setUserErrors(e=>({...e,confirmPassword:''})); }} placeholder="Re-enter" secureTextEntry={!showPass.uc} eyeToggle={() => togglePass('uc')} showPass={showPass.uc} />

              {/* Role presets */}
              <Text style={styles.sectionLabel}>Role & Screen Access</Text>
              <View style={styles.presetRow}>
                {PRESET_ROLES.map(p => (
                  <TouchableOpacity
                    key={p.label}
                    style={[styles.presetBtn, userForm.roleLabel === p.label && styles.presetBtnActive]}
                    onPress={() => applyPreset(p.label)}
                  >
                    <Text style={[styles.presetBtnName, userForm.roleLabel === p.label && styles.presetBtnNameActive]}>{p.label}</Text>
                    <Text style={styles.presetBtnDesc}>{p.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Permissions grid */}
              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Admin Screens</Text>
              <View style={styles.permGrid}>
                {ADMIN_SCREENS.map(s => {
                  const checked = userForm.permissions.admin.includes(s.key);
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.permChip, checked && styles.permChipOn, !isCustom && styles.permChipLocked]}
                      onPress={() => isCustom && toggleScreen('admin', s.key)}
                    >
                      <Text style={[styles.permChipText, checked && styles.permChipTextOn]}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Staff Screens</Text>
              <View style={styles.permGrid}>
                {STAFF_SCREENS.map(s => {
                  const checked = userForm.permissions.staff.includes(s.key);
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.permChip, checked && styles.permChipOn, !isCustom && styles.permChipLocked]}
                      onPress={() => isCustom && toggleScreen('staff', s.key)}
                    >
                      <Text style={[styles.permChipText, checked && styles.permChipTextOn]}>{s.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {userErrors.permissions && <Text style={styles.errText}>{userErrors.permissions}</Text>}

              <TouchableOpacity style={styles.saveBtn} onPress={editUser ? handleEditUserSave : handleAddUser} activeOpacity={0.85}>
                <Text style={styles.saveBtnText}>{editUser ? 'Save changes' : 'Add User'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Toast message={toast} />
    </View>
  );
}

// ── Helper sub-components ────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
function DetailRow({ icon, text, mono = false }: { icon: IoniconName; text: string; mono?: boolean }) {
  return (
    <View style={detailStyles.row}>
      <Ionicons name={icon} size={14} color={Colors.textMuted} style={detailStyles.icon} />
      <Text style={[detailStyles.text, mono && detailStyles.mono]} numberOfLines={2}>{text}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  icon: { marginRight: 6, marginTop: 1 },
  text: { flex: 1, fontSize: FontSize.sm, color: Colors.textMuted },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: Colors.blue },
});

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: any;
  secureTextEntry?: boolean;
  eyeToggle?: () => void;
  showPass?: boolean;
}

function FormInput({ label, value, onChangeText, placeholder, error, multiline, keyboardType, secureTextEntry, eyeToggle, showPass }: FormInputProps) {
  return (
    <View style={fi.group}>
      <Text style={fi.label}>{label}</Text>
      <View style={fi.inputRow}>
        <TextInput
          style={[fi.input, error && fi.inputError, multiline && fi.inputMulti, eyeToggle && fi.inputWithEye]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
        />
        {eyeToggle && (
          <TouchableOpacity style={fi.eyeBtn} onPress={eyeToggle}>
            <Ionicons
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={fi.error}>{error}</Text>}
    </View>
  );
}

const fi = StyleSheet.create({
  group: { marginBottom: 12 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text, marginBottom: 5 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  inputError: { borderColor: Colors.red },
  inputMulti: { height: 72, textAlignVertical: 'top' },
  inputWithEye: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
  eyeBtn: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1, borderLeftWidth: 0,
    borderColor: Colors.border,
    borderTopRightRadius: 8, borderBottomRightRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  error: { fontSize: FontSize.xs, color: Colors.red, marginTop: 3 },
});

// ── Main styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  addOutletBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addOutletBtnText: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },

  inactiveCard: { opacity: 0.65 },
  outletHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  outletName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  managerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  outletManager: { fontSize: FontSize.sm, color: Colors.textMuted },

  detailsBlock: { marginBottom: 12 },

  usersSection: {
    borderTopWidth: 0.5, borderTopColor: Colors.border,
    paddingTop: 12, marginBottom: 12,
  },
  usersSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  usersSectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  usersSectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  addUserBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6,
  },
  addUserBtnText: { fontSize: FontSize.xs, color: Colors.gold, fontWeight: FontWeight.semibold },
  noUsers: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },

  userRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 8, padding: 10,
    marginBottom: 6,
  },
  userRowInactive: { opacity: 0.5 },
  userAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.gradientStart,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  userInfo: { flex: 1 },
  userName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  userMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  userActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  iconBtn: { padding: 2 },

  outletActions: {
    flexDirection: 'row', gap: 8,
    borderTopWidth: 0.5, borderTopColor: Colors.border, paddingTop: 12,
  },
  outlineBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 7,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  outlineBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.text },
  outlineBtnWarn: { borderColor: Colors.orange, backgroundColor: Colors.orangeLight },
  outlineBtnSuccess: { borderColor: Colors.green, backgroundColor: Colors.greenLight },
  outlineBtnDanger: { borderColor: Colors.red, backgroundColor: Colors.redLight, flex: 0, paddingHorizontal: 14 },

  // Modals
  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '92%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, flex: 1, marginRight: 8 },
  closeX: { fontSize: 18, color: Colors.textMuted },
  sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  presetBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  presetBtnActive: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  presetBtnName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.text },
  presetBtnNameActive: { color: Colors.gold },
  presetBtnDesc: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  permGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  permChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  permChipOn: { backgroundColor: Colors.dark, borderColor: Colors.dark },
  permChipLocked: { opacity: 0.55 },
  permChipText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  permChipTextOn: { color: Colors.gold },

  errText: { fontSize: FontSize.xs, color: Colors.red, marginTop: 4 },
  saveBtn: {
    backgroundColor: Colors.dark, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
    marginTop: 12, marginBottom: 20,
  },
  saveBtnText: { color: Colors.gold, fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Image styles
  outletCardImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },
  outletCardImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  outletPlaceholderText: {
    fontSize: 40,
  },
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
});
