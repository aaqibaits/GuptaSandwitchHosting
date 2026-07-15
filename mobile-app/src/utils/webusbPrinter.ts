/**
 * utils/webusbPrinter.ts
 * ──────────────────────
 * WebUSB & Native Android USB Thermal Printer Utility for ESC/POS Printing
 */

import { Platform, NativeModules, Alert } from 'react-native';
import { KotOrder, LiveOrder } from '../types';

const { USBPrinterModule } = NativeModules;
let savedAndroidPrinterId: number | null = null;

// ESC/POS Commands
const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  INIT: new Uint8Array([ESC, 0x40]),
  ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),
  ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]),
  FONT_LARGE: new Uint8Array([GS, 0x21, 0x11]), // Double height & width
  FONT_NORMAL: new Uint8Array([GS, 0x21, 0x00]),
  BOLD_ON: new Uint8Array([ESC, 0x69, 0x01]),
  BOLD_OFF: new Uint8Array([ESC, 0x69, 0x00]),
  CUT: new Uint8Array([GS, 0x56, 0x41, 0x00]), // Feed & cut
  FEED_LINE: new Uint8Array([0x0a]),
};

// Quantity word mapping
const QUANTITY_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

/**
 * Helper to encode Uint8Array bytes to Base64 string for the React Native bridge.
 */
function uint8ArrayToBase64(uint8: Uint8Array): string {
  let binary = '';
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  let i = 0;
  while (i < len) {
    const byte1 = uint8[i++];
    const byte2 = i < len ? uint8[i++] : NaN;
    const byte3 = i < len ? uint8[i++] : NaN;

    const enc1 = byte1 >> 2;
    const enc2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
    const enc3 = isNaN(byte2) ? 64 : ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
    const enc4 = isNaN(byte3) ? 64 : byte3 & 63;

    base64 += chars.charAt(enc1) + chars.charAt(enc2) +
              (enc3 === 64 ? '=' : chars.charAt(enc3)) +
              (enc4 === 64 ? '=' : chars.charAt(enc4));
  }
  return base64;
}

/**
 * Requests a USB device matching thermal printers.
 */
export const requestUSBPrinter = async (): Promise<any> => {
  if (Platform.OS === 'android' && USBPrinterModule) {
    try {
      const list = await USBPrinterModule.listPrinters();
      if (list.length === 0) {
        throw new Error('No USB devices detected. Please connect your printer via USB.');
      }
      
      if (list.length === 1) {
        const device = list[0];
        const granted = await USBPrinterModule.requestPermission(device.deviceId);
        if (!granted) {
          throw new Error('Permission denied to access USB printer.');
        }
        savedAndroidPrinterId = device.deviceId;
        return device;
      }

      return new Promise((resolve, reject) => {
        const buttons = list.slice(0, 2).map((device: any) => ({
          text: device.productName || `USB Device ${device.deviceId}`,
          onPress: async () => {
            try {
              const granted = await USBPrinterModule.requestPermission(device.deviceId);
              if (granted) {
                savedAndroidPrinterId = device.deviceId;
                resolve(device);
              } else {
                reject(new Error('Permission denied to access USB printer.'));
              }
            } catch (e) {
              reject(e);
            }
          }
        }));

        buttons.push({
          text: 'Cancel',
          onPress: () => reject(new Error('Printer selection cancelled.')),
          style: 'cancel' as any
        });

        Alert.alert(
          '🔌 Select USB Printer',
          'Multiple USB devices detected. Please choose your receipt printer:',
          buttons,
          { cancelable: true, onDismiss: () => reject(new Error('Printer selection dismissed.')) }
        );
      });
    } catch (e: any) {
      console.error('[webusbPrinter] Android printer request failed:', e);
      throw e;
    }
  }

  // Web fallback
  if (typeof navigator === 'undefined' || !(navigator as any).usb) {
    throw new Error('WebUSB not supported in this environment');
  }
  try {
    const device = await (navigator as any).usb.requestDevice({
      filters: []
    });
    return device;
  } catch (error) {
    console.error('USB Device selection failed:', error);
    throw error;
  }
};

/**
 * Retrieves already paired/authorized USB devices.
 */
export const getSavedUSBPrinters = async (): Promise<any[]> => {
  if (Platform.OS === 'android' && USBPrinterModule) {
    try {
      const list = await USBPrinterModule.listPrinters();
      if (savedAndroidPrinterId !== null) {
        const saved = list.find((d: any) => d.deviceId === savedAndroidPrinterId);
        if (saved) return [saved];
      }
      const printers = list.filter((d: any) => d.isPrinterClass);
      if (printers.length > 0) return [printers[0]];
      if (list.length > 0) return [list[0]];
      return [];
    } catch (e) {
      console.error('[webusbPrinter] getSavedUSBPrinters failed:', e);
      return [];
    }
  }

  // Web fallback
  if (typeof navigator === 'undefined' || !(navigator as any).usb) return [];
  try {
    return await (navigator as any).usb.getDevices();
  } catch (err) {
    console.error('Error fetching paired USB devices:', err);
    return [];
  }
};

/**
 * Sends ESC/POS command bytes to a paired USB device.
 */
export const sendBytesToUSBPrinter = async (device: any, bytes: Uint8Array): Promise<void> => {
  if (Platform.OS === 'android' && USBPrinterModule) {
    try {
      const base64Bytes = uint8ArrayToBase64(bytes);
      const success = await USBPrinterModule.printRawBytes(device.deviceId, base64Bytes);
      if (!success) {
        throw new Error('Failed to print raw bytes to USB device.');
      }
      return;
    } catch (err) {
      console.error('Android native print error:', err);
      throw err;
    }
  }

  // Web fallback
  try {
    await device.open();
    await device.selectConfiguration(1);
    
    let printInterface = null;
    let outEndpoint = null;

    for (const iface of device.configuration.interfaces) {
      const alternate = iface.alternates[0];
      if (alternate.interfaceClass === 7) {
        printInterface = iface;
        outEndpoint = alternate.endpoints.find((e: any) => e.direction === 'out');
        break;
      }
    }

    if (!printInterface) {
      printInterface = device.configuration.interfaces[0];
      outEndpoint = printInterface.alternates[0].endpoints.find((e: any) => e.direction === 'out');
    }

    if (!outEndpoint) {
      throw new Error('Printer OUT endpoint not found on the selected USB device.');
    }

    await device.claimInterface(printInterface.interfaceNumber);
    await device.transferOut(outEndpoint.endpointNumber, bytes);
    await device.releaseInterface(printInterface.interfaceNumber);
    await device.close();
  } catch (err) {
    console.error('WebUSB print error:', err);
    throw err;
  }
};

/**
 * Formats order data into standard ESC/POS bytes for receipt printing.
 */
export const formatReceiptESCPOS = (order: KotOrder, outletName?: string, staffName?: string): Uint8Array => {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const addBytes = (bytes: number[] | Uint8Array) => buffer.push(...bytes);
  const addText = (text: string) => buffer.push(...encoder.encode(text + '\n'));
  const addRawText = (text: string) => buffer.push(...encoder.encode(text));

  const outletUpper = outletName ? outletName.toUpperCase() : 'GUPTA SANDWICH';

  // 1. Initialize
  addBytes(CMD.INIT);

  // 2. Header
  addBytes(CMD.ALIGN_CENTER);
  addBytes(CMD.FONT_LARGE);
  addText(outletUpper);
  addBytes(CMD.FONT_NORMAL);
  addText('Shop No. 14, Gandhi Chowk, Nashik');
  addText('Ph: +91 78894 56125');
  addText('--------------------------------');

  // 3. Metadata
  addBytes(CMD.ALIGN_LEFT);
  addText(`Receipt No: ${order.orderNumber || order.kotNumber}`);
  addText(`Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`);
  addText(`Type: ${order.orderType === 'dine-in' ? 'Dine-in' : 'Parcel'}  |  Cashier: ${staffName || 'Manager'}`);
  addText('--------------------------------');

  // 4. Items Table Header
  addRawText('ITEM             QTY  RATE   AMOUNT\n');
  addText('--------------------------------');

  // 5. Items (32 columns formatting)
  order.items.forEach((item) => {
    let name = item.name.substring(0, 15).padEnd(16, ' ');
    let qty = String(item.qty).padStart(3, ' ');
    let rate = String(Math.round(item.price)).padStart(5, ' ');
    let amount = String(Math.round(item.price * item.qty)).padStart(7, ' ');
    addRawText(`${name}${qty}${rate}${amount}\n`);
  });
  addText('--------------------------------');

  // 6. Totals
  addBytes(CMD.ALIGN_RIGHT);
  addText(`SUBTOTAL: Rs ${Math.round(order.subtotal)}`);
  const discountAmt = Math.max(0, order.subtotal - order.total);
  if (discountAmt > 0) {
    addText(`DISCOUNT: Rs ${Math.round(discountAmt)}`);
  }
  addBytes(CMD.FONT_LARGE);
  addText(`TOTAL: Rs ${Math.round(order.total)}`);
  addBytes(CMD.FONT_NORMAL);
  addText('--------------------------------');

  // 7. Footer
  addBytes(CMD.ALIGN_CENTER);
  addText('Thank you! Please visit again. 🙏');

  // Feed lines before cutting so footer isn't cut off
  addBytes(CMD.FEED_LINE);
  addBytes(CMD.FEED_LINE);
  addBytes(CMD.FEED_LINE);

  // 8. Cut paper
  addBytes(CMD.CUT);

  return new Uint8Array(buffer);
};

/**
 * Formats order data into standard ESC/POS bytes for KOT printing.
 */
export const formatKOTESCPOS = (kot: KotOrder, staffName?: string): Uint8Array => {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const addBytes = (bytes: number[] | Uint8Array) => buffer.push(...bytes);
  const addText = (text: string) => buffer.push(...encoder.encode(text + '\n'));
  const addRawText = (text: string) => buffer.push(...encoder.encode(text));

  // 1. Initialize
  addBytes(CMD.INIT);

  // 2. Header
  addBytes(CMD.ALIGN_CENTER);
  addBytes(CMD.FONT_LARGE);
  addText('KITCHEN ORDER TICKET');
  addBytes(CMD.FONT_NORMAL);
  addText(`Receipt No: ${kot.orderNumber || kot.kotNumber}`);
  addText(`Date: ${new Date(kot.createdAt).toLocaleString('en-IN')}`);
  addText(`Type: ${kot.orderType === 'dine-in' ? 'Dine-in' : 'Parcel'}`);
  if (kot.isUrgent) {
    addText('⚠️ URGENT ORDER ⚠️');
  }
  addText('--------------------------------');

  // 3. Items (32 columns formatting)
  addBytes(CMD.ALIGN_LEFT);
  addRawText('ITEM                           QTY\n');
  addText('--------------------------------');
  kot.items.forEach((item) => {
    let name = item.name.substring(0, 26).padEnd(28, ' ');
    let qty = String(item.qty).padStart(4, ' ');
    addRawText(`${name}${qty}\n`);
  });
  addText('--------------------------------');

  // 4. Footer
  addBytes(CMD.ALIGN_CENTER);
  addText('*** FOR KITCHEN USE ONLY ***');

  // Feed lines before cutting so footer isn't cut off
  addBytes(CMD.FEED_LINE);
  addBytes(CMD.FEED_LINE);
  addBytes(CMD.FEED_LINE);

  // 5. Cut paper
  addBytes(CMD.CUT);

  return new Uint8Array(buffer);
};

/**
 * Formats live order data into standard ESC/POS bytes.
 */
export const formatLiveOrderESCPOS = (order: LiveOrder, outletName?: string, staffName?: string): Uint8Array => {
  const encoder = new TextEncoder();
  const buffer: number[] = [];

  const addBytes = (bytes: number[] | Uint8Array) => buffer.push(...bytes);
  const addText = (text: string) => buffer.push(...encoder.encode(text + '\n'));
  const addRawText = (text: string) => buffer.push(...encoder.encode(text));

  const outletUpper = outletName ? outletName.toUpperCase() : 'GUPTA SANDWICH';

  // 1. Initialize
  addBytes(CMD.INIT);

  // 2. Header
  addBytes(CMD.ALIGN_CENTER);
  addBytes(CMD.FONT_LARGE);
  addText(`${order.platform.toUpperCase()} ORDER`);
  addBytes(CMD.FONT_NORMAL);
  addText(outletUpper);
  addText('Shop No. 14, Gandhi Chowk, Nashik');
  addText('--------------------------------');

  // 3. Metadata & Customer info
  addBytes(CMD.ALIGN_LEFT);
  addText(`Order ID: ${order.orderId}`);
  addText(`Date: ${new Date(order.createdAt).toLocaleString('en-IN')}`);
  addText(`Customer: ${order.customerName}`);
  addText(`Phone: ${order.customerPhone}`);
  if (order.etaMinutes) {
    addText(`ETA: ${order.etaMinutes} mins`);
  }
  addText('--------------------------------');

  // 4. Items Table Header
  addRawText('ITEM                     QTY  AMOUNT\n');
  addText('--------------------------------');

  // 5. Items (32 columns formatting)
  order.items.forEach((item) => {
    let name = item.name.substring(0, 21).padEnd(22, ' ');
    let qty = String(item.qty).padStart(3, ' ');
    let amount = String(Math.round(item.price * item.qty)).padStart(7, ' ');
    addRawText(`${name}${qty}${amount}\n`);
  });
  addText('--------------------------------');

  // 6. Totals
  addBytes(CMD.ALIGN_RIGHT);
  addBytes(CMD.FONT_LARGE);
  addText(`TOTAL: Rs ${Math.round(order.total)}`);
  addBytes(CMD.FONT_NORMAL);
  addText('--------------------------------');

  if (order.specialInstructions) {
    addBytes(CMD.ALIGN_LEFT);
    addText(`Instructions: ${order.specialInstructions}`);
    addText('--------------------------------');
  }

  // 7. Footer
  addBytes(CMD.ALIGN_CENTER);
  addText('Thank you');

  // Feed lines before cutting so footer isn't cut off
  addBytes(CMD.FEED_LINE);
  addBytes(CMD.FEED_LINE);
  addBytes(CMD.FEED_LINE);

  // 8. Cut paper
  addBytes(CMD.CUT);

  return new Uint8Array(buffer);
};
