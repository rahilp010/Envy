import { Share, Linking, Alert } from 'react-native';

export const shareInvoiceText = async ({ transaction, client, company }) => {
  try {
    const total = transaction.totalAmountWithTax || transaction.saleAmount || 0;
    const billNo = transaction.billNo || 'INVOICE';
    const date = transaction.date ? new Date(transaction.date).toLocaleDateString('en-IN') : '';

    const message = `
*${company?.companyName || 'ENVY ERP'}*
----------------------------------------
*INVOICE / BILL DETAILS*
Invoice No: ${billNo}
Date: ${date}
Customer: ${client?.clientName || transaction?.clientName || 'Valued Customer'}
Total Amount: ₹${parseFloat(total).toFixed(2)}
Payment Status: ${(transaction.statusOfTransaction || 'Completed').toUpperCase()}
Payment Method: ${(transaction.paymentMethod || 'Bank').toUpperCase()}

Thank you for your business!
For queries, contact: ${company?.phone || ''}
----------------------------------------
    `.trim();

    await Share.share({
      title: `Invoice ${billNo}`,
      message,
    });
  } catch (error) {
    console.error('Error sharing invoice:', error);
  }
};

export const shareOnWhatsApp = async ({ phone, transaction, client, company }) => {
  try {
    const total = transaction.totalAmountWithTax || transaction.saleAmount || 0;
    const billNo = transaction.billNo || 'INVOICE';
    const date = transaction.date ? new Date(transaction.date).toLocaleDateString('en-IN') : '';

    const message = `*${company?.companyName || 'ENVY ERP'}*
Invoice No: *${billNo}*
Date: ${date}
Customer: *${client?.clientName || transaction?.clientName || 'Valued Customer'}*
Amount: *₹${parseFloat(total).toFixed(2)}*
Status: *${(transaction.statusOfTransaction || 'Completed').toUpperCase()}*

Thank you for doing business with us!`;

    const encoded = encodeURIComponent(message);
    let cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const nativeUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encoded}`
      : `whatsapp://send?text=${encoded}`;

    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
    } else {
      const webUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`
        : `https://api.whatsapp.com/send?text=${encoded}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('WhatsApp share error:', error);
    Alert.alert('Notice', 'Unable to launch WhatsApp directly. Using standard share...');
    shareInvoiceText({ transaction, client, company });
  }
};

export const shareContent = async (title, message) => {
  try {
    await Share.share({
      title,
      message,
    });
  } catch (err) {
    console.error('Share content error:', err);
  }
};
