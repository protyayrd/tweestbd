import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

console.log('InvoiceImage loaded with proper imports');

// Add Bangla font loading function - simplified approach
const loadBanglaFont = async () => {
  try {
    console.log('Attempting to load Bangla font...');
    const response = await fetch('/fonts/NotoSansBengali-Regular.ttf');
    
    if (!response.ok) {
      console.warn(`Font not found (${response.status}). Make sure NotoSansBengali-Regular.ttf is in client/public/fonts/`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log('Bangla font loaded successfully, size:', arrayBuffer.byteLength, 'bytes');
    return arrayBuffer;
  } catch (error) {
    console.warn('Could not load Bangla font:', error.message);
    return null;
  }
};

// Helper function to detect if text contains Bangla characters
const containsBanglaText = (text) => {
  if (!text) return false;
  // Bengali Unicode range: U+0980–U+09FF
  const bengaliRegex = /[\u0980-\u09FF]/;
  return bengaliRegex.test(text);
};

// Helper function to set appropriate font based on text content
const setTextFont = (doc, text, style = 'normal', size = 10) => {
  doc.setFontSize(size);
  
  if (containsBanglaText(text)) {
    try {
      doc.setFont('NotoSansBengali', style);
      console.log('🔤 Using Bangla font for:', text.substring(0, 30) + (text.length > 30 ? '...' : ''));
    } catch (error) {
      console.warn('⚠️ Bangla font fallback for:', text.substring(0, 30) + (text.length > 30 ? '...' : ''));
      doc.setFont('helvetica', style);
    }
  } else {
    doc.setFont('helvetica', style);
  }
};

// Add the manual table rendering function before the generateInvoicePDF function
function renderManualTable(doc, margin, pageWidth, startY, headers, data) {
  console.log('Falling back to manual table rendering');

  // Manual table rendering without images (fallback)
  const cellWidths = [
    (pageWidth - 2 * margin) * 0.25, // Description - more space for product name
    (pageWidth - 2 * margin) * 0.15, // PID
    (pageWidth - 2 * margin) * 0.15, // Color
    (pageWidth - 2 * margin) * 0.10, // Size
    (pageWidth - 2 * margin) * 0.05, // Qty
    (pageWidth - 2 * margin) * 0.15, // Price
    (pageWidth - 2 * margin) * 0.15  // Item Total
  ];
  const cellHeight = 10;
  let currentY = startY;

  try {
    // Draw table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, pageWidth - 2 * margin, cellHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    let currentX = margin;
    headers.forEach((header, index) => {
      const align = index >= 4 ? 'right' : 'left';
      const xPos = align === 'right' ? currentX + cellWidths[index] - 2 : currentX + 2;
      doc.text(header, xPos, currentY + cellHeight / 2, {
        baseline: 'middle',
        align: align
      });
      currentX += cellWidths[index];
    });

    // Draw grid lines for header
    currentX = margin;
    for (let i = 0; i < headers.length; i++) {
      // Vertical lines
      currentX += cellWidths[i];
      if (i < headers.length - 1) {
        doc.line(currentX, currentY, currentX, currentY + cellHeight);
      }
    }
    // Horizontal line under header
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + cellHeight, margin + (pageWidth - 2 * margin), currentY + cellHeight);

    currentY += cellHeight;

    // Draw table rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    data.forEach((row, rowIndex) => {
      if (rowIndex % 2 === 1) {
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, currentY, pageWidth - 2 * margin, cellHeight, 'F');
      }

      // Draw grid lines
      doc.setLineWidth(0.1);
      doc.line(margin, currentY, margin + (pageWidth - 2 * margin), currentY);

      // Draw vertical lines
      let gridX = margin;
      for (let i = 0; i < cellWidths.length; i++) {
        doc.line(gridX, currentY, gridX, currentY + cellHeight);
        gridX += cellWidths[i];
        if (i === cellWidths.length - 1) {
          doc.line(gridX, currentY, gridX, currentY + cellHeight);
        }
      }

      // Process each cell
      currentX = margin;
      row.forEach((cell, cellIndex) => {
        // Handle normal text cells
        let displayText = String(cell || '');
        const textMaxWidth = cellWidths[cellIndex] - 4;
        const lines = doc.splitTextToSize(displayText, textMaxWidth);

        if (lines.length > 0) {
          displayText = lines[0];
          if (lines.length > 1 || displayText.length < cell.toString().length) {
            if (displayText.length > 3) {
              displayText = displayText.substring(0, displayText.length - 3) + '...';
            } else {
              displayText = displayText.substring(0, Math.max(0, displayText.length - 1)) + '...';
            }
          }
        } else {
          displayText = '';
        }

        const align = cellIndex >= 4 ? 'right' : 'left';
        const xPos = align === 'right' ? currentX + cellWidths[cellIndex] - 2 : currentX + 2;

        doc.text(displayText, xPos, currentY + cellHeight / 2, {
          align: align,
          baseline: 'middle'
        });
        currentX += cellWidths[cellIndex]; // Corrected this line from 'index' to 'cellIndex'
      });
      currentY += cellHeight;
    });

    // Bottom line
    doc.line(margin, currentY, margin + (pageWidth - 2 * margin), currentY);

    return currentY + 10;
  } catch (manualTableError) {
    console.error('Error in manual table rendering:', manualTableError);
    return startY + 20;
  }
}

// Invoice PDF generator
const generateInvoicePDF = (order, previewOnly = false) => {
  console.log('generateInvoicePDF called', { orderExists: !!order, previewOnly });

  return new Promise((resolve, reject) => {
    try {
      // Basic validation
      if (!order || !order._id) {
        console.error('Invalid order data', order);
        reject(new Error('Invalid order data'));
        return;
      }

      console.log('Order validation passed', { orderId: order._id });

      // Format order number
      const orderNumber = order.formattedOrderId;

      // Get order date
      const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      console.log('Order details prepared', { orderNumber, orderDate });

      // Get customer information
      const customerName = order.shippingAddress?.firstName
        ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`
        : 'Customer';

      const customerPhone = order.shippingAddress?.phone || order.shippingAddress?.mobile || '';

      // Format payment option - convert to proper case
      const formatPaymentOption = (option) => {
        if (!option) return 'Bkash';
        return option.charAt(0).toUpperCase() + option.slice(1).toLowerCase();
      };

      // Format delivery method - use Pathao Courier if available
      const formatDeliveryMethod = (method) => {
        if (!method) return 'Pathao Courier';
        return method;
      };

      console.log('Customer info prepared', { customerName, customerPhone });

      const loadImages = () => {
        return new Promise((resolveImages, rejectImages) => {
          try {
            const logoImg = new Image();
            let logoLoaded = false;
            logoImg.crossOrigin = "Anonymous";

            logoImg.onload = () => {
              console.log('Logo image loaded successfully');
              logoLoaded = true;
              resolveImages({ logoImg });
            };

            logoImg.onerror = (e) => {
              console.error('Failed to load logo image', e);
              logoLoaded = true; 
              resolveImages({ logoImg: null });
            };
            
            // Changed to load a .jpg file
            logoImg.src = window.location.origin + '/images/TweestBeTheChange.jpg'; 
            console.log('Loading logo from:', logoImg.src);

            setTimeout(() => {
              if (!logoLoaded) {
                console.warn('Logo image loading timed out after 3 seconds');
                resolveImages({ logoImg: null });
              }
            }, 3000);
          } catch (imgError) {
            console.error('Error in image loading function', imgError);
            rejectImages(imgError);
          }
        });
      };

      const generateInvoiceContent = async (doc, logoImg) => {
        try {
          console.log('Starting invoice content generation function');

          // Load and add Bangla font first
          try {
            console.log('Starting font loading...');
            const fontArrayBuffer = await loadBanglaFont();
            
            if (fontArrayBuffer) {
              // Simple conversion for jsPDF
              const uint8Array = new Uint8Array(fontArrayBuffer);
              const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
              const base64String = btoa(binaryString);
              
              doc.addFileToVFS('NotoSansBengali.ttf', base64String);
              doc.addFont('NotoSansBengali.ttf', 'NotoSansBengali', 'normal');
              console.log('✅ Bangla font successfully added to PDF');
            } else {
              console.warn('⚠️ Bangla font not available - using default fonts only');
            }
          } catch (fontError) {
            console.error('❌ Font loading error:', fontError);
          }

          // Continue with existing content generation
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();
          const margin = 15; 
          
          // Calculate logo dimensions maintaining aspect ratio
          const originalLogoWidthPx = 6584;
          const originalLogoHeightPx = 1852;
          const logoAspectRatio = originalLogoHeightPx / originalLogoWidthPx;
          const logoWidthMm = 40; 
          const logoHeightMm = logoWidthMm * logoAspectRatio; // Approx 11.26mm

          let rightSideContentBottomY = margin; // Y-coordinate for the bottom of the logo area

          // --- Top Right Section: Logo Image ---
          const logoX = pageWidth - margin - logoWidthMm;
          const logoY = margin;

          if (logoImg) {
            console.log('Attempting to add logo image to top-right');
            // Changed format to 'JPEG'
            doc.addImage(logoImg, 'JPEG', logoX, logoY, logoWidthMm, logoHeightMm, undefined, 'FAST'); 
            console.log('Logo image added successfully to top-right');
            rightSideContentBottomY = logoY + logoHeightMm;
          } else {
            console.log('Logo image not available.');
            // If no logo, reserve space for it to ensure consistent layout for text below
            rightSideContentBottomY = margin + logoHeightMm; 
          }
          
          // --- Company Name and Tagline REMOVED ---

          // --- Header section - Two column layout ---
          doc.setFont('helvetica'); 
          doc.setFontSize(10); 
          console.log('Set default font styles for header');

          const leftColumnX = margin;
          const rightAlignX = pageWidth - margin; // X for right-aligned text
          
          let leftTextCurrentY = margin; // Y for left column text starts at top margin
          
          // Y for right column header text starts below the logo area
          let rightHeaderTextCurrentY = rightSideContentBottomY + 7; // Add some padding

          // Left Column (Order Details)
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`ORDER NO: ${orderNumber}`, leftColumnX, leftTextCurrentY);
          leftTextCurrentY += 4;
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`INVOICE:`, leftColumnX, leftTextCurrentY);
          leftTextCurrentY += 4;
          doc.text(`ORDER DATE: ${orderDate}`, leftColumnX, leftTextCurrentY);
          leftTextCurrentY += 4;
          
          // Use Bangla font for customer name if needed
          setTextFont(doc, customerName, 'normal', 9);
          doc.text(`CUSTOMER: ${customerName}`, leftColumnX, leftTextCurrentY);
          leftTextCurrentY += 4;
          
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`PHONE: ${customerPhone}`, leftColumnX, leftTextCurrentY);
          leftTextCurrentY += 4;
          doc.text(`PAYMENT: ${formatPaymentOption(order.paymentOption || order.paymentMethod)}`, leftColumnX, leftTextCurrentY);
          leftTextCurrentY += 4;
          doc.text(`DELIVERY: ${formatDeliveryMethod(order.deliveryMethod)}`, leftColumnX, leftTextCurrentY);
          // leftTextCurrentY is now at the Y position for the *next* line in the left column

          // Right Column (Mushak, BIN NO, Payment Status) - RIGHT ALIGNED
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text("Mushak - 2.3", rightAlignX, rightHeaderTextCurrentY, { align: 'right' });
          rightHeaderTextCurrentY += 4;
          doc.text("BIN NO: 007073825-0402", rightAlignX, rightHeaderTextCurrentY, { align: 'right' });
          rightHeaderTextCurrentY += 4;
          
          doc.setFont('helvetica', 'bold');
          doc.text(`PAYMENT STATUS: ${order.paymentStatus === 'COMPLETED' ? 'Paid' : order.paymentStatus || 'Pending'}`, 
            rightAlignX, rightHeaderTextCurrentY, { align: 'right' });
          doc.setFont('helvetica', 'normal'); // Reset
          // rightHeaderTextCurrentY is now at the Y position for the *next* line in the right header column


          // Determine the Y coordinate for the line below the header
          const bottomOfLeftColumn = leftTextCurrentY - 5; // Approx bottom of last text line
          const bottomOfRightHeaderColumn = rightHeaderTextCurrentY -5; // Approx bottom of last text line
          
          const actualEndOfHeaderContentY = Math.max(bottomOfLeftColumn, bottomOfRightHeaderColumn);

          const lineBelowHeaderY = actualEndOfHeaderContentY + 7; // Add some padding before the line
          doc.setLineWidth(0.5);
          doc.line(margin, lineBelowHeaderY, pageWidth - margin, lineBelowHeaderY);
          console.log('Header section completed');
          
          // --- Address section ---
          let addressY = lineBelowHeaderY + 10; // Start address section below the line
          try {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(order.paymentOption === 'outlet' ? 'Pickup Location' : 'Shipping Address', margin, addressY);
            
            doc.setFont('helvetica', 'normal');
            if (order.paymentOption === 'outlet') {
              setTextFont(doc, customerName, 'normal', 8);
              doc.text(`${customerName}, ${customerPhone}`, margin, addressY + 5);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.text("Tweest Outlet", margin, addressY + 10);
              doc.text("147/C, Green Road, Panthapath Signal,", margin, addressY + 15);
              doc.text("Dhaka-1205, Bangladesh", margin, addressY + 20);
              doc.text("Phone: 01611-101430", margin, addressY + 25);
            } else {
              setTextFont(doc, customerName, 'normal', 8);
              doc.text(`${customerName}, ${customerPhone}`, margin, addressY + 5);
              
              const streetAddress = order.shippingAddress?.streetAddress || '';
              setTextFont(doc, streetAddress, 'normal', 8);
              doc.text(`${streetAddress}`, margin, addressY + 10);
              
              const locationText = `${order.shippingAddress?.upazilla || ''}${order.shippingAddress?.upazilla && order.shippingAddress?.district ? ', ' : ''}${order.shippingAddress?.district || ''}`;
              setTextFont(doc, locationText, 'normal', 8);
              doc.text(`${locationText}`, margin, addressY + 15);
            }
            
            const lineBelowAddressY = addressY + 30;
            doc.line(margin, lineBelowAddressY, pageWidth - margin, lineBelowAddressY);
            console.log('Address section completed');
            
            const tableY = lineBelowAddressY + 10; 
            console.log('Starting table generation at Y position:', tableY);
            
            console.log('Order items:', order.orderItems ? order.orderItems.length : 'none');
            
            let tableData = [];
            try {
              if (order.orderItems && Array.isArray(order.orderItems)) {
                tableData = order.orderItems.map(item => {
                  try {
                    const productName = item.product?.title || 'Product';
                    const truncatedName = productName.length > 40 ? 
                      productName.substring(0, 37) + '...' : productName;
                    const sku = item.sku || item.product?.sku || '-';
                    const color = item.color || '-';
                    const size = item.size || '-';
                    const quantity = item.quantity || 1;
                    const price = item.price || 0;
                    const total = (price * quantity).toFixed(2);
                    return [truncatedName, sku, color, size, quantity, `TK. ${price}`, `TK. ${total}`];
                  } catch (itemError) {
                    console.error('Error processing item:', itemError);
                    return ['Error with item', '-', '-', '-', 1, 'TK. 0', 'TK. 0.00'];
                  }
                });
                console.log('Table data prepared with data:', JSON.stringify(tableData[0]));
              } else {
                console.warn('No order items found or not an array');
              }
            } catch (tableDataError) {
              console.error('Error preparing table data:', tableDataError);
              tableData = [['Error loading items', '-', '-', '-', 1, 'TK. 0', 'TK. 0.00']];
            }
            
            console.log('Table data prepared:', tableData.length);
            const tableHeaders = ['DESCRIPTION', 'PID', 'COLOR', 'SIZE', 'QTY', 'PRICE', 'ITEM TOTAL'];
            let tableEndY;
            
            try {
              console.log('Using autoTable for table generation');
              let finalY;
              autoTable(doc, {
                startY: tableY,
                head: [tableHeaders],
                body: tableData,
                margin: { left: margin, right: margin },
                theme: 'striped',
                headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', lineWidth: 0.1, lineColor: [100, 100, 100] },
                styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak', valign: 'middle', lineWidth: 0.1, lineColor: [180, 180, 180] },
                columnStyles: {
                  0: { cellWidth: 'auto', minCellWidth: 20, halign: 'center' }, 1: { cellWidth: 'auto', minCellWidth: 20, halign: 'center' },
                  2: { cellWidth: 'auto', minCellWidth: 20, halign: 'center' }, 3: { cellWidth: 'auto', minCellWidth: 5, halign: 'center' },
                  4: { cellWidth: 'auto', minCellWidth: 5, halign: 'center' },  5: { cellWidth: 'auto', minCellWidth: 15, halign: 'center' },
                  6: { cellWidth: 'auto', minCellWidth: 15, halign: 'center' }
                },
                willDrawCell: function(data) {
                  if (data.section === 'body') {
                    const text = data.cell.text[0];
                    const maxChars = data.column.index === 0 ? 30 : 15; 
                    if (text && text.length > maxChars) data.cell.text[0] = text.substring(0, maxChars - 3) + '...';
                  }
                },
                didDrawPage: (data) => {
                  console.log('Table drawn on page, finalY:', data.cursor.y);
                  finalY = data.cursor.y;
                }
              });
              tableEndY = finalY ? finalY + 10 : tableY + 50; 
              console.log('AutoTable completed successfully, end Y:', tableEndY);
            } catch (autoTableError) {
              console.error('Error in autoTable rendering:', autoTableError);
              tableEndY = renderManualTable(doc, margin, pageWidth, tableY, tableHeaders, tableData);
            }
            
            try {
              console.log('Starting totals section');
              let totalsY = tableEndY; 
              const totalsX = pageWidth - margin - 110; 
              const valuesX = pageWidth - margin; 
              
              doc.setFontSize(9); doc.setFont('helvetica', 'bold');
              doc.text("SUBTOTAL", totalsX, totalsY);
              doc.setFont('helvetica', 'normal');
              doc.text(`TK. ${order.totalPrice - (order.deliveryCharge || 0)}.00`, valuesX, totalsY, { align: 'right' });
              totalsY += 4;
              
              if (order.discount) {
                doc.setFont('helvetica', 'bold'); doc.text("PRODUCT DISCOUNT", totalsX, totalsY);
                doc.setFont('helvetica', 'normal'); doc.text(`TK. ${order.discount - (order.promoCodeDiscount || 0)}.00`, valuesX, totalsY, { align: 'right' });
                totalsY += 4;
              }
              if (order.promoCodeDiscount) {
                doc.setFont('helvetica', 'bold'); doc.text("PROMO CODE DISCOUNT", totalsX, totalsY);
                doc.setFont('helvetica', 'normal'); doc.text(`TK. ${order.promoCodeDiscount}.00`, valuesX, totalsY, { align: 'right' });
                totalsY += 4;
              }
              if (order.deliveryCharge) {
                doc.setFont('helvetica', 'bold'); doc.text("DELIVERY CHARGE", totalsX, totalsY);
                doc.setFont('helvetica', 'normal'); doc.text(`TK. ${order.deliveryCharge}.00`, valuesX, totalsY, { align: 'right' });
                totalsY += 4;
              }
              if (order.additionalCharge) {
                doc.setFont('helvetica', 'bold'); doc.text("ADDITIONAL CHARGE", totalsX, totalsY);
                doc.setFont('helvetica', 'normal'); doc.text(`TK. ${order.additionalCharge}.00`, valuesX, totalsY, { align: 'right' });
                totalsY += 4;
              }
              
              doc.line(totalsX, totalsY, valuesX, totalsY); totalsY += 4;
              
              doc.setFontSize(10); doc.setFont('helvetica', 'bold');
              doc.text("TOTAL (Inc. VAT)", totalsX, totalsY);
              doc.text(`TK. ${order.totalDiscountedPrice || order.totalPrice || 0}.00`, valuesX, totalsY, { align: 'right' });
              totalsY += 4;
              
              doc.setFontSize(9); doc.text("TOTAL PAID", totalsX, totalsY);
              doc.text(`TK. ${order.totalDiscountedPrice - order.dueAmount}.00`, valuesX, totalsY, { align: 'right' });
              totalsY += 4;
              
              if ((order.totalDiscountedPrice || order.totalPrice) > (order.amountPaid || 0)) {
                doc.text("DUE AMOUNT", totalsX, totalsY);
                doc.text(`TK. ${((order.dueAmount))}.00`, valuesX, totalsY, { align: 'right' });
                totalsY += 4;
              }
              if (order.paymentOption !== 'outlet') {
                doc.text("COURIER COLLECTION", totalsX, totalsY);
                doc.text(`TK. ${order.dueAmount > 0 ? order.dueAmount : 0}.00`, valuesX, totalsY, { align: 'right' });
                totalsY += 4;
              }
              console.log('Totals section completed, end Y:', totalsY);
              
              const policyY = totalsY + 15; 
              try {
                console.log('Adding policy section at Y:', policyY);
                doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
                doc.text("RETURN & EXCHANGE POLICY:", margin, policyY);
                doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
                doc.text("• 3 days return window from the date of delivery", margin + 5, policyY + 4);
                doc.text("• Items must be unused and in original packaging", margin + 5, policyY + 8);
                doc.text("• Tags and labels must be intact", margin + 5, policyY + 12);
                doc.text("• Full refund including shipping costs for defective items", margin + 5, policyY + 16);
                console.log('Policy section completed');
              } catch (policyError) { console.error('Error adding policy section:', policyError); }
              
              try {
                console.log('Adding footer section');
                doc.setFontSize(8); doc.setFont('helvetica', 'normal');
                doc.setDrawColor(120, 120, 120); doc.setLineWidth(0.5);
                doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
                doc.text("fb.com/tweestbd | 01611-101430 | tweestbd@gmail.com", pageWidth / 2, pageHeight - 15, { align: 'center' });
                doc.text("www.tweestbd.com", pageWidth / 2, pageHeight - 10, { align: 'center' });
                console.log('Footer completed');
              } catch (footerError) { console.error('Error adding footer:', footerError); }
              
              if (previewOnly) {
                try {
                  console.log('Creating PDF data URL for preview');
                  const pdfData = doc.output('datauristring');
                  console.log('PDF data URL created successfully');
                  resolve(pdfData);
                } catch (previewError) { console.error('Error creating preview data URL:', previewError); reject(previewError); }
              } else {
                try {
                  console.log('Saving PDF file');
                  doc.save(`TweestBD_Invoice_${orderNumber}.pdf`);
                  console.log('PDF saved successfully');
                  resolve(`TweestBD_Invoice_${orderNumber}.pdf`);
                } catch (saveError) { console.error('Error saving PDF file:', saveError); reject(saveError); }
              }
            } catch (totalsError) { console.error('Error in totals section:', totalsError); reject(totalsError); }
          } catch (addressError) { console.error('Error in address/table section:', addressError); reject(addressError); }
        } catch (err) { console.error('Error in invoice content generation:', err); reject(err); }
      };

      loadImages().then(async ({logoImg}) => {
        let doc;
        try {
          doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          console.log('jsPDF instance created successfully');
        } catch (pdfError) {
          console.error('Failed to create jsPDF instance', pdfError);
          reject(new Error('Failed to create PDF document'));
          return;
        }
        await generateInvoiceContent(doc, logoImg);
      }).catch(async (imageError) => {
        console.error('Image loading failed:', imageError);
        let doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        await generateInvoiceContent(doc, null); // Pass null for logoImg if loading failed
      });
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      reject(error);
    }
  });
};

export const previewInvoicePDF = (order) => {
  console.log('previewInvoicePDF called', { orderExists: !!order });
  return generateInvoicePDF(order, true);
};

export default generateInvoicePDF;
