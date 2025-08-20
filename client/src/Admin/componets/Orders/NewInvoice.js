import { jsPDF } from 'jspdf';

// Simple invoice generator
const generateInvoice = (order) => {
  try {
    // Basic validation
    if (!order || !order._id) {
      console.error('Invalid order data');
      alert('Cannot generate invoice: Missing order data');
      return null;
    }

    // Format order number
    const orderNumber = order.formattedOrderId || `2505${order._id.substring(0, 8)}`.toUpperCase();
    
    // Create PDF
    const doc = new jsPDF();
    
    // Get page dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Add content
    doc.setFontSize(22);
    doc.text("TWEEST", pageWidth/2, 20, { align: 'center' });
    
    doc.setFontSize(18);
    doc.text("INVOICE", pageWidth/2, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Order Number: ${orderNumber}`, 20, 50);
    doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 20, 60);
    doc.text(`Customer: ${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`, 20, 70);
    
    // Items table
    doc.setFontSize(14);
    doc.text("Order Items", 20, 90);
    
    let yPos = 100;
    order.orderItems.forEach((item, index) => {
      doc.setFontSize(10);
      const itemText = `${index + 1}. ${item.product?.title || 'Product'} (${item.size || ''}, ${item.color || ''})`;
      const qtyText = `${item.quantity} × ${item.price} = TK.${item.discountedPrice}`;
      
      doc.text(itemText, 20, yPos);
      doc.text(qtyText, pageWidth - 20, yPos, { align: 'right' });
      yPos += 8;
    });
    
    // Totals
    yPos += 10;
    doc.line(20, yPos - 5, pageWidth - 20, yPos - 5); // Divider line
    
    doc.setFontSize(12);
    doc.text("Subtotal:", 120, yPos);
    doc.text(`TK.${order.totalPrice}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 8;
    
    if (order.discounte) {
      doc.text("Discount:", 120, yPos);
      doc.text(`-TK.${order.discounte}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 8;
    }
    
    if (order.deliveryCharge) {
      doc.text("Delivery Charge:", 120, yPos);
      doc.text(`TK.${order.deliveryCharge}`, pageWidth - 20, yPos, { align: 'right' });
      yPos += 8;
    }
    
    doc.setFontSize(14);
    doc.text("Total Amount:", 120, yPos);
    doc.text(`TK.${order.totalDiscountedPrice}`, pageWidth - 20, yPos, { align: 'right' });
    
    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for shopping with TWEEST!", pageWidth/2, pageHeight - 20, { align: 'center' });
    doc.text("www.tweestbd.com", pageWidth/2, pageHeight - 10, { align: 'center' });
    
    // Save PDF
    const fileName = `TweestBD_Invoice_${orderNumber}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error('Error generating simple invoice:', error);
    alert(`Invoice generation failed: ${error.message || 'Unknown error'}`);
    return null;
  }
};

export default generateInvoice; 