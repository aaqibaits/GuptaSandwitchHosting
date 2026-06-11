/**
 * Opens the browser print dialog with a receipt (no on-screen modal).
 */
export const printReceipt = ({
  orderNumber,
  order = [],
  total = 0,
  method = 'cash',
  orderType = 'dine',
}) => {
  const itemsHtml = order
    .map(
      (item) => `
      <tr>
        <td>${item.emoji || ''} ${item.name} × ${item.qty}</td>
        <td style="text-align:right">₹${(item.price || 0) * (item.qty || 1)}</td>
      </tr>`
    )
    .join('');

  const methodLabel = method === 'online' ? 'Online' : 'Cash';
  const typeLabel = orderType === 'parcel' ? 'Parcel' : 'Dine-in';
  const now = new Date().toLocaleString('en-IN');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${orderNumber || ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; font-size: 12px; padding: 16px; width: 280px; }
    h1 { font-size: 16px; text-align: center; margin-bottom: 4px; }
    .meta { text-align: center; font-size: 10px; color: #666; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 4px 0; border-bottom: 1px dashed #ddd; vertical-align: top; }
    .total-row td { border-top: 2px solid #000; border-bottom: none; font-weight: 700; font-size: 14px; padding-top: 8px; }
    .thanks { text-align: center; margin-top: 14px; font-size: 11px; color: #666; }
    @media print { body { padding: 8px; } }
  </style>
</head>
<body>
  <h1>Gupta Sandwich</h1>
  <p class="meta">MG Road, Pune · +91 98765 43210<br/>${now}</p>
  <p class="meta">Order #${orderNumber || '—'} · ${typeLabel} · ${methodLabel}</p>
  <table>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr class="total-row">
        <td>TOTAL</td>
        <td style="text-align:right">₹${Number(total).toFixed(0)}</td>
      </tr>
    </tfoot>
  </table>
  <p class="thanks">Thank you! 🙏</p>
  <script>
    window.onload = function() {
      window.focus();
      window.print();
      setTimeout(function() { window.close(); }, 300);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=320,height=520');
  if (!printWindow) {
    return false;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};

export default printReceipt;
