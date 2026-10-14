import { execute, query, queryRow } from '../db';
import { toInt, parseParts, logAction } from './helpers';

export const getAllProducts = async () => {
  return query('SELECT * FROM products ORDER BY createdAt DESC');
};

export const createProduct = async (product = {}) => {
  const {
    productName = '',
    productPrice = 0,
    productQuantity = 0,
    clientId = 0,
    assetsType = 'Raw Material',
    addParts = 0,
    parts = '[]',
    saleHSN = '',
    purchaseHSN = '',
    taxRate = 0,
    taxAmount = 0,
    totalAmountWithTax = 0,
    totalAmountWithoutTax = 0,
    pageName = 'Product',
    createdAt = new Date().toISOString(),
  } = product;

  const partsStr = typeof parts === 'string' ? parts : JSON.stringify(parts);
  const parsedParts = parseParts(partsStr);

  let finalPrice = parseFloat(productPrice) || 0;

  // Auto-calculate price for Finished Goods if parts provided and price is 0
  if (
    finalPrice <= 0 &&
    assetsType === 'Finished Goods' &&
    toInt(addParts) === 1 &&
    parsedParts.length > 0
  ) {
    finalPrice = 0;
    for (const part of parsedParts) {
      const partRow = await queryRow('SELECT * FROM products WHERE id = ?', [toInt(part.partId)]);
      if (partRow) {
        finalPrice += (partRow.productPrice || 0) * toInt(part.productQuantity, 0);
      }
    }
  }

  const taxRateStr = typeof taxRate === 'object' ? JSON.stringify(taxRate) : JSON.stringify([]);

  const res = await execute(
    `INSERT INTO products 
     (productName, productPrice, productQuantity, clientId, assetsType, addParts, parts, saleHSN, purchaseHSN, taxRate, taxAmount, totalAmountWithTax, totalAmountWithoutTax, pageName, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      productName,
      finalPrice,
      Number(productQuantity) || 0,
      clientId || null,
      assetsType,
      toInt(addParts),
      partsStr,
      saleHSN,
      purchaseHSN,
      taxRateStr,
      Number(taxAmount) || 0,
      Number(totalAmountWithTax) || 0,
      Number(totalAmountWithoutTax) || 0,
      pageName,
      createdAt,
    ]
  );

  const newProductId = res.insertId;

  // Deduct sub-part stock for Finished Goods
  if (assetsType === 'Finished Goods' && toInt(addParts) === 1) {
    for (const row of parsedParts) {
      await execute(
        'UPDATE products SET productQuantity = productQuantity - ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [toInt(row.productQuantity, 0), toInt(row.partId)]
      );
    }
  }

  await logAction({
    actionType: 'CREATE',
    module: 'Product',
    entityId: newProductId,
    entityName: productName,
    title: `Product Added: ${productName}`,
    details: `Added new product "${productName}" (${assetsType || 'General'}). Price: ₹${finalPrice}, Stock Qty: ${productQuantity}`,
    amount: finalPrice,
    targetRoute: '/products',
  });

  return { success: true, insertId: newProductId };
};

export const updateProduct = async (product) => {
  const {
    id,
    productName,
    productPrice,
    productQuantity = 0,
    clientId = 0,
    assetsType,
    addParts = 0,
    parts = '[]',
    pageName = 'Product',
  } = product;

  const oldProduct = await queryRow('SELECT * FROM products WHERE id = ?', [id]);
  if (!oldProduct) throw new Error(`Product ${id} not found`);

  const partsStr = typeof parts === 'string' ? parts : JSON.stringify(parts || []);
  const taxRateStr =
    typeof product.taxRate === 'object' ? JSON.stringify(product.taxRate) : JSON.stringify([]);

  await execute(
    `UPDATE products
     SET 
       productName = ?, 
       productPrice = ?, 
       productQuantity = ?, 
       clientId = ?, 
       assetsType = ?, 
       addParts = ?, 
       parts = ?, 
       saleHSN = ?, 
       purchaseHSN = ?, 
       taxRate = ?, 
       taxAmount = ?, 
       totalAmountWithTax = ?, 
       totalAmountWithoutTax = ?, 
       pageName = ?,
       updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      productName,
      Number(productPrice) || 0,
      Number(productQuantity) || 0,
      clientId || null,
      assetsType,
      toInt(addParts),
      partsStr,
      product.saleHSN ?? '',
      product.purchaseHSN ?? '',
      taxRateStr,
      product.taxAmount ?? 0,
      product.totalAmountWithTax ?? 0,
      product.totalAmountWithoutTax ?? 0,
      pageName,
      id,
    ]
  );

  // Handle parts stock if Finished Goods
  if (assetsType === 'Finished Goods' && toInt(addParts) === 1) {
    const oldParts = parseParts(oldProduct.parts);
    const newParts = parseParts(partsStr);

    const oldMap = Object.fromEntries(oldParts.map((p) => [p.partId, p.productQuantity]));
    const newMap = Object.fromEntries(newParts.map((p) => [p.partId, p.productQuantity]));

    // Restore removed or reduced parts
    for (const [partId, oldQty] of Object.entries(oldMap)) {
      const newQty = newMap[partId] || 0;
      if (newQty < oldQty) {
        const diff = oldQty - newQty;
        await execute(
          'UPDATE products SET productQuantity = productQuantity + ? WHERE id = ?',
          [diff, partId]
        );
      }
    }

    // Deduct added or increased parts
    for (const [partId, newQty] of Object.entries(newMap)) {
      const oldQty = oldMap[partId] || 0;
      if (newQty > oldQty) {
        const diff = newQty - oldQty;
        await execute(
          'UPDATE products SET productQuantity = productQuantity - ? WHERE id = ?',
          [diff, partId]
        );
      }
    }
  }

  await logAction({
    actionType: 'UPDATE',
    module: 'Product',
    entityId: id,
    entityName: productName || oldProduct.productName,
    title: `Product Updated: ${productName || oldProduct.productName}`,
    details: `Updated product details. Price: ₹${productPrice}, Stock Qty: ${productQuantity}`,
    amount: productPrice,
    targetRoute: '/products',
  });

  return { success: true };
};

export const deleteProduct = async (id) => {
  const product = await queryRow('SELECT * FROM products WHERE id = ?', [id]);
  if (!product) return { success: false, message: 'Product not found' };

  if (product.assetsType === 'Finished Goods' && toInt(product.addParts) === 1) {
    const parsedParts = parseParts(product.parts);
    for (const part of parsedParts) {
      await execute(
        'UPDATE products SET productQuantity = productQuantity + ? WHERE id = ?',
        [toInt(part.productQuantity, 0), toInt(part.partId)]
      );
    }
  }

  await execute('DELETE FROM products WHERE id = ?', [id]);

  await logAction({
    actionType: 'DELETE',
    module: 'Product',
    entityId: id,
    entityName: product.productName,
    title: `Product Deleted: ${product.productName}`,
    details: `Deleted product "${product.productName}" from catalog`,
    amount: product.productPrice,
    targetRoute: '/products',
  });

  return { success: true };
};

export const getProductById = async (id) => {
  return queryRow('SELECT * FROM products WHERE id = ?', [id]);
};

export const adjustProductStock = async (productId, qtyChange) => {
  await execute(
    'UPDATE products SET productQuantity = productQuantity + ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [Number(qtyChange) || 0, productId]
  );
  return true;
};
