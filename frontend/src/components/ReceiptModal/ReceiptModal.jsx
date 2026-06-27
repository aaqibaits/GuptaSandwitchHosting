import React, { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import './ReceiptModal.css';
import {
  requestUSBPrinter,
  getSavedUSBPrinters,
  formatCanvasToESCPOS,
  sendBytesToUSBPrinter
} from '../../utils/webusbPrinter';

const numberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const numVal = Math.floor(Number(num));
  if (numVal === 0) return 'Rupees Zero Only';

  if (numVal.toString().length > 9) return 'Rupees Large Amount Only';
  let n = ('000000000' + numVal).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? a[Number(n[4])] + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str ? 'Rupees ' + str.trim() + ' Only' : 'Rupees Zero Only';
};

const formatDate = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const ReceiptModal = ({ data, onClose }) => {
  const {
    orderNumber,
    date,
    cashier,
    roleLabel = 'Cashier',
    outletName = 'Gupta Sandwich',
    outletAddress = '',
    outletPhone = '',
    orderTypeLabel = 'Dine-in',
    items = [],
    subtotal = 0,
    discountAmount = 0,
    total = 0,
    method = 'Cash'
  } = data;

  const [needsPairing, setNeedsPairing] = useState(false);
  const [printImages, setPrintImages] = useState({ receiptImage: null, kotImage: null });

  const printReceiptAndKOT = async (printerDevice) => {
    const receiptElement = document.getElementById('receipt-card-container');
    const kotElement = document.getElementById('kot-card-container');

    if (receiptElement) {
      console.log('Generating ESC/POS canvas for receipt...');
      const canvas1 = await html2canvas(receiptElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        width: 280,
        height: receiptElement.scrollHeight,
        windowWidth: 280,
        onclone: (document) => {
          const element = document.getElementById('receipt-card-container');
          if (element) {
            element.style.height = 'auto';
            element.style.overflow = 'visible';
            element.style.width = '280px';
          }
        }
      });
      const receiptBytes = formatCanvasToESCPOS(canvas1);
      console.log('Sending receipt graphics to USB printer...');
      await sendBytesToUSBPrinter(printerDevice, receiptBytes);
    }

    if (kotElement) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log('Generating ESC/POS canvas for KOT...');
      const canvas2 = await html2canvas(kotElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        width: 280,
        height: kotElement.scrollHeight,
        windowWidth: 280,
        onclone: (document) => {
          const element = document.getElementById('kot-card-container');
          if (element) {
            element.style.height = 'auto';
            element.style.overflow = 'visible';
            element.style.width = '280px';
          }
        }
      });
      const kotBytes = formatCanvasToESCPOS(canvas2);
      console.log('Sending KOT graphics to USB printer...');
      await sendBytesToUSBPrinter(printerDevice, kotBytes);
    }
  };

  const handleSilentPrint = async () => {
    const receiptElement = document.getElementById('receipt-card-container');
    const kotElement = document.getElementById('kot-card-container');

    let receiptImg = null;
    let kotImg = null;

    try {
      if (receiptElement) {
        const canvas1 = await html2canvas(receiptElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
          width: 280,
          height: receiptElement.scrollHeight,
          windowWidth: 280,
          onclone: (document) => {
            const element = document.getElementById('receipt-card-container');
            if (element) {
              element.style.height = 'auto';
              element.style.overflow = 'visible';
              element.style.width = '280px';
            }
          }
        });
        receiptImg = canvas1.toDataURL('image/png');
      }

      if (kotElement) {
        const canvas2 = await html2canvas(kotElement, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
          width: 280,
          height: kotElement.scrollHeight,
          windowWidth: 280,
          onclone: (document) => {
            const element = document.getElementById('kot-card-container');
            if (element) {
              element.style.height = 'auto';
              element.style.overflow = 'visible';
              element.style.width = '280px';
            }
          }
        });
        kotImg = canvas2.toDataURL('image/png');
      }

      setPrintImages({ receiptImage: receiptImg, kotImage: kotImg });

      if (navigator.usb) {
        console.log('WebUSB supported. Checking for saved printers...');
        const devices = await getSavedUSBPrinters();
        if (devices && devices.length > 0) {
          const printerDevice = devices[0];
          console.log('Found saved printer:', printerDevice.productName);

          await printReceiptAndKOT(printerDevice);
          onClose();
          return;
        } else {
          console.log('No saved printers found. Prompting for pairing.');
          setNeedsPairing(true);
        }
      } else {
        console.warn('WebUSB not supported, falling back to server print/download.');
        await handleFallbackPrint(receiptImg, kotImg);
      }
    } catch (e) {
      console.error('Error in print flow:', e);
      setNeedsPairing(true);
    }
  };

  const handleManualPairAndPrint = async () => {
    try {
      const printerDevice = await requestUSBPrinter();
      if (printerDevice) {
        console.log('Printer paired successfully:', printerDevice.productName);
        await printReceiptAndKOT(printerDevice);
        onClose();
      }
    } catch (err) {
      alert(`USB Pairing/Printing failed: ${err.message}`);
    }
  };

  const handleFallbackPrint = async (receiptImg = null, kotImg = null) => {
    const finalReceiptImage = receiptImg || printImages.receiptImage;
    const finalKotImage = kotImg || printImages.kotImage;

    try {
      // Send to backend for silent OS-level printing
      const printUrl = 'https://guptasandwich.work-desk.tech/api/print/receipt';
      const response = await fetch(printUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ receiptImage: finalReceiptImage, kotImage: finalKotImage })
      });

      if (!response.ok) {
        fallbackDownload(finalReceiptImage, finalKotImage);
      }
    } catch (e) {
      console.error('Hosted print request failed, downloading receipt locally:', e);
      fallbackDownload(finalReceiptImage, finalKotImage);
    } finally {
      onClose();
    }
  };

  const fallbackDownload = (receiptImage, kotImage) => {
    if (receiptImage) {
      const link1 = document.createElement('a');
      link1.download = `Receipt_${orderNumber || 'invoice'}.png`;
      link1.href = receiptImage;
      link1.click();
    }
    setTimeout(() => {
      if (kotImage) {
        const link2 = document.createElement('a');
        link2.download = `KOT_${orderNumber || 'kot'}.png`;
        link2.href = kotImage;
        link2.click();
      }
    }, 200);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSilentPrint();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {needsPairing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          pointerEvents: 'auto',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#1a1d24',
            color: '#fff',
            padding: '24px',
            borderRadius: '12px',
            width: '380px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid #2d3139'
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#4facfe' }}>🔌 USB Receipt Printer</h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#a0aec0', lineHeight: 1.5 }}>
              No paired USB thermal printer detected. Please connect your printer via USB and pair it below.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                onClick={handleManualPairAndPrint}
                style={{
                  backgroundColor: '#4facfe',
                  color: '#fff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
              >
                Pair & Print Receipt
              </button>
              <button 
                onClick={() => handleFallbackPrint(null, null)}
                style={{
                  backgroundColor: '#2d3139',
                  color: '#e2e8f0',
                  border: '1px solid #4a5568',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Skip & Download Receipt
              </button>
              <button 
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#a0aec0',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline'
                }}
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="receipt-overlay">
      <div className="receipt-modal-wrapper">
        {/* Printable/Downloadable Receipt Card */}
        <div id="receipt-card-container" className="receipt-card">
          <div className="receipt-content">
            {/* Header Block: Dark Banner */}
            <div className="receipt-dark-header">
              <div className="header-top-row">
                <div className="header-left">
                  <img src="/logo.jpeg" alt="Gupta Sandwich Logo" className="receipt-logo" />
                </div>
                <div className="header-right">
                  <h2 className="receipt-outlet-name">{outletName || 'Gupta Sandwich'}</h2>
                  <p className="receipt-header-detail">{outletAddress || 'Shop No. 14, Gandhi Chowk, Pune'}</p>
                  <p className="receipt-header-detail">Ph: {outletPhone || '+91 98765 43210'}</p>
                </div>
              </div>
              <div className="receipt-slogan">
                "Every bite tells a story"
              </div>
            </div>

            {/* Metadata Section */}
            <div className="receipt-meta-grid">
              <div className="meta-col">
                <p><span>Receipt No:</span> {orderNumber}</p>
                {/* <p><span>Customer:</span> {customer || 'Walk-in Customer'}</p> */}
                {orderTypeLabel && <p><span>Order Type:</span> {orderTypeLabel}</p>}
              </div>
              <div className="meta-col text-right">
                <p><span>Date:</span> {formatDate(date)}</p>
                <p><span>{roleLabel}:</span> {cashier}</p>
              </div>
            </div>

            {/* Ledger Title */}
            <div className="ledger-title-band">
              SALES LEDGER
            </div>

            {/* Items Table */}
            <table className="receipt-items-table">
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th className="text-right">QTY</th>
                  <th className="text-right">RATE</th>
                  <th className="text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td className="text-right">{item.qty}</td>
                    <td className="text-right">₹{Number(item.price).toFixed(2)}</td>
                    <td className="text-right">₹{(item.price * item.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Grand Total Band */}
            <div className="receipt-total-band">
              <span>GRAND TOTAL</span>
              <span>₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            {/* Footer Area */}
            <div className="stamp-footer-container">
              <div className="footer-greeting">
                <p>Thank you</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kitchen Order Ticket (KOT) Card */}
        <div id="kot-card-container" className="receipt-card kot-card">
          <div className="receipt-content">
            {/* Header Block: Dark Banner */}
            {/* <div className="receipt-dark-header">
              <div className="header-top-row">
                <div className="header-left">
                  <img src="/logo.jpeg" alt="Gupta Sandwich Logo" className="receipt-logo" />
                </div>
                <div className="header-right">
                  <h2 className="receipt-outlet-name">{outletName || 'Gupta Sandwich'}</h2>
                  <p className="receipt-header-detail">{outletAddress || 'Shop No. 14, Gandhi Chowk, Pune'}</p>
                  <p className="receipt-header-detail">Ph: {outletPhone || '+91 98765 43210'}</p>
                </div>
              </div>
              <div className="receipt-slogan">
                "Every bite tells a story"
              </div>
            </div> */}

            <div className="kot-title-section">
              <h1 className="kot-title">KOT</h1>
            </div>
            <div className="receipt-meta-grid">
              <div className="meta-col">
                <p><span>KOT / Receipt No:</span> {orderNumber}</p>
                {orderTypeLabel && <p><span>Order Type:</span> {orderTypeLabel}</p>}
              </div>
              <div className="meta-col text-right">
                <p><span>Date:</span> {formatDate(date)}</p>
                <p><span>{roleLabel}:</span> {cashier}</p>
              </div>
            </div>
            {/* <div className="receipt-divider"></div> */}
            <div className="ledger-title-band">
              ITEMS LIST
            </div>

            <table className="kot-items-table">
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th className="text-right">QTY</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.name}</td>
                    <td className="text-right">{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* <div className="receipt-divider"></div> */}

            <div className="kot-footer">
              <p>*** FOR KITCHEN USE ONLY ***</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
  );
};

export default ReceiptModal;