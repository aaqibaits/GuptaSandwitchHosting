/**
 * WebUSB Thermal Printer Utility for ESC/POS Printing
 */

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

/**
 * Requests a USB device matching typical vendor IDs or prompts the user to select any USB device.
 */
export const requestUSBPrinter = async () => {
  try {
    const device = await navigator.usb.requestDevice({
      filters: [] // Empty filters allows selecting any USB device (useful for generic printers)
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
export const getSavedUSBPrinters = async () => {
  if (!navigator.usb) return [];
  try {
    return await navigator.usb.getDevices();
  } catch (err) {
    console.error('Error fetching paired USB devices:', err);
    return [];
  }
};

/**
 * Formats order data into standard ESC/POS bytes for receipt printing.
 */
export const formatReceiptESCPOS = (data) => {
  const encoder = new TextEncoder('utf-8');
  const buffer = [];

  const addBytes = (bytes) => buffer.push(...bytes);
  const addText = (text) => buffer.push(...encoder.encode(text + '\n'));
  const addRawText = (text) => buffer.push(...encoder.encode(text));

  // 1. Initialize
  addBytes(CMD.INIT);

  // 2. Header
  addBytes(CMD.ALIGN_CENTER);
  addBytes(CMD.FONT_LARGE);
  addText(data.outletName || 'Gupta Sandwich');
  addBytes(CMD.FONT_NORMAL);
  addText(data.outletAddress || 'Shop No. 14, Gandhi Chowk, Pune');
  addText(`Ph: ${data.outletPhone || '+91 98765 43210'}`);
  addText('--------------------------------');

  // 3. Metadata
  addBytes(CMD.ALIGN_LEFT);
  addText(`Receipt No: ${data.orderNumber}`);
  addText(`Date: ${new Date(data.date).toLocaleString('en-IN')}`);
  addText(`Type: ${data.orderTypeLabel || 'Dine-in'}  |  Cashier: ${data.cashier}`);
  addText('--------------------------------');

  // 4. Items Table Header
  addRawText('ITEM             QTY  RATE   AMOUNT\n');
  addText('--------------------------------');

  // 5. Items (32 columns formatting)
  data.items.forEach((item) => {
    // Truncate item name if too long
    let name = item.name.substring(0, 15).padEnd(16, ' ');
    let qty = String(item.qty).padStart(3, ' ');
    let rate = String(Math.round(item.price)).padStart(5, ' ');
    let amount = String(Math.round(item.price * item.qty)).padStart(7, ' ');
    addRawText(`${name}${qty}${rate}${amount}\n`);
  });
  addText('--------------------------------');

  // 6. Totals
  addBytes(CMD.ALIGN_RIGHT);
  addText(`SUBTOTAL: Rs ${Math.round(data.subtotal)}`);
  if (data.discountAmount > 0) {
    addText(`DISCOUNT: Rs ${Math.round(data.discountAmount)}`);
  }
  addBytes(CMD.FONT_LARGE);
  addText(`TOTAL: Rs ${Math.round(data.total)}`);
  addBytes(CMD.FONT_NORMAL);
  addText('--------------------------------');

  // 7. Footer
  addBytes(CMD.ALIGN_CENTER);
  addText('Thank you! Please visit again. 🙏');

  // 8. Cut paper
  addBytes(CMD.CUT);

  return new Uint8Array(buffer);
};

/**
 * Formats order data into standard ESC/POS bytes for KOT printing.
 */
export const formatKOTESCPOS = (data) => {
  const encoder = new TextEncoder('utf-8');
  const buffer = [];

  const addBytes = (bytes) => buffer.push(...bytes);
  const addText = (text) => buffer.push(...encoder.encode(text + '\n'));
  const addRawText = (text) => buffer.push(...encoder.encode(text));

  // 1. Initialize
  addBytes(CMD.INIT);

  // 2. Header
  addBytes(CMD.ALIGN_CENTER);
  addBytes(CMD.FONT_LARGE);
  addText('KITCHEN ORDER TICKET');
  addBytes(CMD.FONT_NORMAL);
  addText(`Receipt No: ${data.orderNumber}`);
  addText(`Date: ${new Date(data.date).toLocaleString('en-IN')}`);
  addText(`Type: ${data.orderTypeLabel || 'Dine-in'}`);
  addText('--------------------------------');

  // 3. Items (32 columns formatting)
  addBytes(CMD.ALIGN_LEFT);
  addRawText('ITEM                           QTY\n');
  addText('--------------------------------');
  data.items.forEach((item) => {
    let name = item.name.substring(0, 26).padEnd(28, ' ');
    let qty = String(item.qty).padStart(4, ' ');
    addRawText(`${name}${qty}\n`);
  });
  addText('--------------------------------');

  // 4. Footer
  addBytes(CMD.ALIGN_CENTER);
  addText('*** FOR KITCHEN USE ONLY ***');

  // 5. Cut paper
  addBytes(CMD.CUT);

  return new Uint8Array(buffer);
};

/**
 * Sends ESC/POS command bytes to a paired USB device.
 */
export const sendBytesToUSBPrinter = async (device, bytes) => {
  try {
    await device.open();
    await device.selectConfiguration(1);
    
    // Find the print interface (usually subclass 1, protocol 2 or interface 0)
    let printInterface = null;
    let outEndpoint = null;

    for (const iface of device.configuration.interfaces) {
      const alternate = iface.alternates[0];
      // Check interface class 7 (Printers)
      if (alternate.interfaceClass === 7) {
        printInterface = iface;
        // Find OUT endpoint
        outEndpoint = alternate.endpoints.find(e => e.direction === 'out');
        break;
      }
    }

    // Fallback to first interface if printer class not explicitly set
    if (!printInterface) {
      printInterface = device.configuration.interfaces[0];
      outEndpoint = printInterface.alternates[0].endpoints.find(e => e.direction === 'out');
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
 * Converts a HTML canvas element into raw ESC/POS raster graphic bytes.
 * This prints the canvas exactly as it looks (fonts, images, logo, layout).
 */
export const formatCanvasToESCPOS = (canvas) => {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const width = canvas.width;
  const height = canvas.height;
  const widthBytes = Math.ceil(width / 8);

  const buffer = [];
  const addBytes = (bytes) => buffer.push(...bytes);

  // 1. Initialize
  addBytes(CMD.INIT);

  // Center align the image print
  addBytes(CMD.ALIGN_CENTER);

  // 2. Command: GS v 0 (Print raster bit image)
  // GS v 0 m xL xH yL yH d1...dk
  const m = 0; // normal mode
  const xL = widthBytes & 0xff;
  const xH = (widthBytes >> 8) & 0xff;
  const yL = height & 0xff;
  const yH = (height >> 8) & 0xff;

  addBytes([GS, 0x76, 0x30, m, xL, xH, yL, yH]);

  // 3. Pixel translation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < widthBytes; x++) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const pixelX = x * 8 + bit;
        if (pixelX < width) {
          const idx = (y * width + pixelX) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Calculate brightness (grayscale luminosity formula)
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
          
          // Transparent or light pixels are white (0), dark pixels are black (1)
          const isBlack = (a > 50 && brightness < 180) ? 1 : 0;

          if (isBlack) {
            byteVal |= (1 << (7 - bit));
          }
        }
      }
      buffer.push(byteVal);
    }
  }

  // 4. Feed paper and cut (GS V 66 0)
  addBytes(CMD.CUT);

  return new Uint8Array(buffer);
};
