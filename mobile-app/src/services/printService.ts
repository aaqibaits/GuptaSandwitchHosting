/**
 * services/printService.ts
 * ────────────────────────
 * Service utility for printing customer bills and kitchen order tickets (KOT)
 * using expo-print. Generates high-fidelity HTML/CSS structures optimized for
 * thermal receipt printing (typically 80mm format), matching target layouts.
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image, Platform } from 'react-native';
import { KotOrder, LiveOrder } from '../types';
import {
  getSavedUSBPrinters,
  requestUSBPrinter,
  sendBytesToUSBPrinter,
  formatReceiptESCPOS,
  formatKOTESCPOS,
  formatLiveOrderESCPOS,
} from '../utils/webusbPrinter';

/**
 * Format a Date input to en-IN locale format (e.g. "02 Jul 2026, 11:30 AM")
 */
const formatDateTime = (dateInput: any): string => {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return new Date().toLocaleString('en-IN');
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return String(dateInput);
  }
};

/**
 * Format date to receipt format (e.g. "23 Jun 2026")
 */
const formatReceiptDate = (dateInput: any): string => {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return '';
  }
};

/**
 * Resolve local logo asset to dev server or bundle URI
 */
const getLogoUri = (): string => {
  try {
    return Image.resolveAssetSource(require('../../assets/logo.jpeg')).uri;
  } catch (e) {
    console.warn('Failed to resolve logo image asset:', e);
    return '';
  }
};

/**
 * Get dynamic address and phone details based on outlet name
 */
const getOutletDetails = (outletName?: string) => {
  const name = outletName?.toLowerCase() || '';
  if (name.includes('nashik') || name.includes('city') || name.includes('park')) {
    return {
      name: 'NASHIK CITY PARK',
      address: 'Nashik',
      phone: '7889456125',
    };
  }
  return {
    name: outletName ? outletName.toUpperCase() : 'GUPTA SANDWICH',
    address: 'Nashik',
    phone: '7889456125',
  };
};

/**
 * Common stylesheet for print templates to ensure clean, high-contrast receipts.
 */
const thermalStyles = `
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13.5px;
    line-height: 1.35;
    color: #000000;
    margin: 0;
    padding: 10px;
    background-color: #ffffff;
  }
  .center {
    text-align: center;
  }
  .right {
    text-align: right;
  }
  .bold {
    font-weight: bold;
  }
  .dashed-divider {
    border-top: 1.5px dashed #000000;
    margin: 6px 0;
  }
  .solid-line {
    border-top: 2px solid #000000;
    margin: 6px 0;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
  }
  .meta-table td {
    padding: 2px 0;
    font-size: 13.5px;
    vertical-align: top;
  }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
  }
  .items-table th {
    border-bottom: 2px solid #000000;
    padding-bottom: 6px;
    font-size: 13.5px;
    font-weight: bold;
  }
  .items-table td {
    padding: 8px 0;
    font-size: 13.5px;
    vertical-align: middle;
  }
  .item-row-dotted {
    border-bottom: 1.2px dotted #cccccc;
  }
  .item-row-dashed {
    border-bottom: 1.5px dashed #000000;
  }
  .totals-container {
    width: 100%;
    margin-top: 6px;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 13.5px;
  }
  .grand-total {
    font-size: 16px;
    font-weight: bold;
    padding: 8px 0;
    border-top: 2px solid #000000;
    border-bottom: 2px solid #000000;
  }
  .instruction-box {
    border: 1.5px solid #000000;
    padding: 8px;
    margin: 10px 0;
    font-size: 13px;
  }
  .footer-thankyou {
    text-align: center;
    font-size: 15px;
    margin-top: 15px;
    margin-bottom: 10px;
  }
`;

/**
 * Print a customer billing receipt / invoice.
 */
export async function printCustomerReceipt(order: KotOrder, outletName?: string, staffName?: string) {
  // WebUSB or Native Android USB support check
  if ((typeof navigator !== 'undefined' && (navigator as any).usb) || Platform.OS === 'android') {
    try {
      const devices = await getSavedUSBPrinters();
      let printerDevice = devices.length > 0 ? devices[0] : null;

      if (!printerDevice) {
        console.log('[PrintService] No saved printer found. Triggering WebUSB requestDevice...');
        printerDevice = await requestUSBPrinter();
      }

      if (printerDevice) {
        console.log('[PrintService] WebUSB Printer selected:', printerDevice.productName);
        const bytes = formatReceiptESCPOS(order, outletName, staffName);
        await sendBytesToUSBPrinter(printerDevice, bytes);
        return { success: true };
      }
    } catch (usbError) {
      console.warn('[PrintService] WebUSB customer print failed:', usbError);
      return { success: false, error: usbError };
    }
  }
  return { success: false, error: 'No paired USB receipt printer detected. Please connect your printer via USB.' };
}

/**
 * Generate HTML string for customer bill.
 */
export function generateCustomerReceiptHTML(order: KotOrder, outletName?: string, staffName?: string): string {
  const details = getOutletDetails(outletName);
  const logoUri = getLogoUri();
  
  // Calculate discount value if available
  const hasDiscount = order.subtotal - order.total > 0;
  const discountAmt = Math.max(0, order.subtotal - order.total);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Receipt ${order.kotNumber}</title>
        <style>
          ${thermalStyles}
        </style>
      </head>
      <body>
        <!-- Header: Logo left, details right -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
          <div style="width: 25%; text-align: left;">
            ${logoUri ? `<img src="${logoUri}" style="width: 65px; height: 65px; object-fit: contain;" />` : ''}
          </div>
          <div style="width: 75%; text-align: right;">
            <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
              ${details.name}
            </div>
            <div style="font-size: 13.5px; margin-top: 2px;">${details.address}</div>
            <div style="font-size: 13.5px; margin-top: 2px;">Ph: ${details.phone}</div>
          </div>
        </div>

        <div class="center" style="font-style: italic; font-size: 14px; margin-top: 8px; margin-bottom: 8px;">
          "Every bite tells a story"
        </div>

        <div class="dashed-divider"></div>

        <table class="meta-table">
          <tr>
            <td style="width: 60%;"><strong>Receipt No:</strong> ${order.orderNumber || order.kotNumber}</td>
            <td style="width: 40%; text-align: right;"><strong>Date:</strong> ${formatReceiptDate(order.createdAt)}</td>
          </tr>
          <tr>
            <td><strong>Order Type:</strong> ${order.orderType === 'dine-in' ? 'Dine-in' : 'Parcel'}</td>
            <td style="text-align: right;"><strong>Manager:</strong> ${staffName || 'Pavan'}</td>
          </tr>
        </table>

        <div class="dashed-divider"></div>

        <div class="center" style="font-size: 15px; font-weight: 800; letter-spacing: 0.5px; padding: 2px 0;">
          SALES LEDGER
        </div>

        <div class="dashed-divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 45%;">ITEM</th>
              <th style="text-align: right; width: 15%;">QTY</th>
              <th style="text-align: right; width: 20%;">RATE</th>
              <th style="text-align: right; width: 20%;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              .map(
                (item) => `
              <tr class="item-row-dotted">
                <td style="text-align: left;">${item.name}</td>
                <td style="text-align: right;">${item.qty}</td>
                <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
                <td style="text-align: right;">₹${(item.price * item.qty).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals-container">
          ${hasDiscount ? `
          <div class="totals-row">
            <span>Subtotal</span>
            <span>₹${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Discount</span>
            <span>-₹${discountAmt.toFixed(2)}</span>
          </div>
          ` : ''}

          <div class="totals-row grand-total">
            <span>GRAND TOTAL</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer-thankyou">
          Thank you
        </div>
      </body>
    </html>
  `;
}

/**
 * Print a Kitchen Order Ticket (KOT).
 */
export async function printKotReceipt(kot: KotOrder, staffName?: string) {
  // WebUSB or Native Android USB support check
  if ((typeof navigator !== 'undefined' && (navigator as any).usb) || Platform.OS === 'android') {
    try {
      const devices = await getSavedUSBPrinters();
      let printerDevice = devices.length > 0 ? devices[0] : null;

      if (!printerDevice) {
        console.log('[PrintService] No saved printer found. Triggering WebUSB requestDevice...');
        printerDevice = await requestUSBPrinter();
      }

      if (printerDevice) {
        console.log('[PrintService] WebUSB Printer selected for KOT:', printerDevice.productName);
        const bytes = formatKOTESCPOS(kot, staffName);
        await sendBytesToUSBPrinter(printerDevice, bytes);
        return { success: true };
      }
    } catch (usbError) {
      console.warn('[PrintService] WebUSB KOT print failed:', usbError);
      return { success: false, error: usbError };
    }
  }
  return { success: false, error: 'No paired USB receipt printer detected. Please connect your printer via USB.' };
}

/**
 * Generate HTML string for kitchen KOT receipt.
 */
export function generateKotHTML(kot: KotOrder, staffName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>KOT ${kot.kotNumber}</title>
        <style>
          ${thermalStyles}
        </style>
      </head>
      <body>
        <div class="center" style="font-size: 26px; font-weight: 800; margin-bottom: 10px; letter-spacing: 1px;">
          KOT
        </div>

        <table class="meta-table">
          <tr>
            <td style="width: 60%;"><strong>KOT / Receipt No:</strong> ${kot.orderNumber || kot.kotNumber}</td>
            <td style="width: 40%; text-align: right;"><strong>Date:</strong> ${formatReceiptDate(kot.createdAt)}</td>
          </tr>
          <tr>
            <td><strong>Order Type:</strong> ${kot.orderType === 'dine-in' ? 'Dine-in' : 'Parcel'}</td>
            <td style="text-align: right;"><strong>Manager:</strong> ${staffName || 'Ashok'}</td>
          </tr>
          ${kot.isUrgent ? `
          <tr>
            <td colspan="2" class="center bold" style="color: #ff0000; background-color: #fee2e2; border: 1.5px solid #ff0000; padding: 4px; font-size: 14px; margin-top: 4px;">
              ⚠️ URGENT ORDER ⚠️
            </td>
          </tr>
          ` : ''}
        </table>

        <div class="dashed-divider"></div>

        <div class="center" style="font-size: 15px; font-weight: 800; letter-spacing: 0.5px; padding: 2px 0;">
          ITEMS LIST
        </div>

        <div class="dashed-divider"></div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 80%;">ITEM</th>
              <th style="text-align: right; width: 20%;">QTY</th>
            </tr>
          </thead>
          <tbody>
            ${kot.items
              .map(
                (item) => `
              <tr class="item-row-dashed">
                <td style="text-align: left; font-weight: 700; text-transform: uppercase;">${item.name}</td>
                <td style="text-align: right; font-weight: 700; font-size: 16px;">${item.qty}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="center" style="font-size: 13.5px; font-weight: 800; margin-top: 15px; margin-bottom: 10px; letter-spacing: 0.5px;">
          *** FOR KITCHEN USE ONLY ***
        </div>
      </body>
    </html>
  `;
}

/**
 * Export and share both Customer Bill and KOT as separate PDF files at the same time.
 */
export async function downloadReceiptsPDF(order: KotOrder, outletName?: string, staffName?: string) {
  const billHtml = generateCustomerReceiptHTML(order, outletName, staffName);
  const kotHtml = generateKotHTML(order, staffName);

  try {
    const { uri: billUri } = await Print.printToFileAsync({ html: billHtml });
    const { uri: kotUri } = await Print.printToFileAsync({ html: kotHtml });

    if (await Sharing.isAvailableAsync()) {
      // Share Customer Bill PDF
      await Sharing.shareAsync(billUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Bill PDF',
        UTI: 'com.adobe.pdf',
      });
      
      // Share KOT PDF
      await Sharing.shareAsync(kotUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download KOT PDF',
        UTI: 'com.adobe.pdf',
      });
      
      return { success: true };
    } else {
      return { success: false, error: 'Sharing is not available on this device' };
    }
  } catch (err) {
    console.error('[PrintService] Failed to generate/share PDF files:', err);
    return { success: false, error: err };
  }
}

/**
 * Print a customer receipt / ticket for a third-party platform order (Swiggy/Zomato).
 */
export async function printLiveOrderReceipt(order: LiveOrder, outletName?: string, staffName?: string) {
  // WebUSB or Native Android USB support check
  if ((typeof navigator !== 'undefined' && (navigator as any).usb) || Platform.OS === 'android') {
    try {
      const devices = await getSavedUSBPrinters();
      let printerDevice = devices.length > 0 ? devices[0] : null;

      if (!printerDevice) {
        console.log('[PrintService] No saved printer found. Triggering WebUSB requestDevice...');
        printerDevice = await requestUSBPrinter();
      }

      if (printerDevice) {
        console.log('[PrintService] WebUSB Printer selected for Live Order:', printerDevice.productName);
        const bytes = formatLiveOrderESCPOS(order, outletName, staffName);
        await sendBytesToUSBPrinter(printerDevice, bytes);
        return { success: true };
      }
    } catch (usbError) {
      console.warn('[PrintService] WebUSB Live Order print failed:', usbError);
      return { success: false, error: usbError };
    }
  }
  return { success: false, error: 'No paired USB receipt printer detected. Please connect your printer via USB.' };
}
