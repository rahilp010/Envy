import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DB_NAME = 'envy_data.db';

let dbInstance = null;

export const getDB = async () => {
  if (dbInstance) return dbInstance;
  try {
    dbInstance = await SQLite.openDatabase({
      name: DB_NAME,
      location: 'default',
    });
    // Enable foreign keys
    await dbInstance.executeSql('PRAGMA foreign_keys = ON;');
    return dbInstance;
  } catch (err) {
    console.error('❌ Failed to open SQLite database:', err);
    throw err;
  }
};

/**
 * Execute SQL that modifies data (INSERT, UPDATE, DELETE, CREATE, etc.)
 * Returns { insertId, rowsAffected }
 */
export const execute = async (sql, params = []) => {
  const db = await getDB();
  const [result] = await db.executeSql(sql, params);
  return {
    insertId: result.insertId,
    rowsAffected: result.rowsAffected,
  };
};

/**
 * Run a query that returns multiple rows
 * Returns Array<Object>
 */
export const query = async (sql, params = []) => {
  const db = await getDB();
  const [results] = await db.executeSql(sql, params);
  const rows = [];
  const len = results.rows.length;
  for (let i = 0; i < len; i++) {
    rows.push(results.rows.item(i));
  }
  return rows;
};

/**
 * Run a query that returns a single row
 * Returns Object or null
 */
export const queryRow = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Run a batch transaction of functions
 */
export const runTransaction = async (txCallback) => {
  const db = await getDB();
  return db.transaction(txCallback);
};

export const initDatabase = async () => {
  const db = await getDB();

  // 1. Products Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER DEFAULT NULL,
      productName TEXT NOT NULL,
      productPrice REAL NOT NULL,
      productQuantity INTEGER DEFAULT 0,
      addParts INTEGER DEFAULT 0 CHECK (addParts IN (0,1)),
      parts TEXT DEFAULT '[]',
      assetsType TEXT DEFAULT 'Raw Material' CHECK (assetsType IN ('Raw Material', 'Finished Goods', 'Assets')),
      saleHSN TEXT,
      purchaseHSN TEXT,
      taxRate REAL DEFAULT 0,
      taxAmount REAL DEFAULT 0,
      totalAmountWithTax REAL DEFAULT 0,
      totalAmountWithoutTax REAL DEFAULT 0,
      pageName TEXT DEFAULT 'Product',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Clients Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER,
      clientName TEXT NOT NULL,
      phoneNo TEXT,
      gstNo TEXT,
      address TEXT,
      accountType TEXT CHECK (accountType IN ('Creditor', 'Debtor')),
      accountNumber TEXT,
      pendingAmount REAL DEFAULT 0,
      paidAmount REAL DEFAULT 0,
      pendingFromOurs REAL DEFAULT 0,
      pageName TEXT DEFAULT 'Client',
      isEmployee INTEGER DEFAULT 0 CHECK (isEmployee IN (0,1)),
      salary REAL DEFAULT 0,
      salaryHistory TEXT DEFAULT '[]',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Accounts Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER DEFAULT NULL,
      accountName TEXT NOT NULL,
      accountType TEXT NOT NULL 
        CHECK (accountType IN ('Creditor', 'Debtor', 'Bank', 'Cash', 'Employee', 'GPay', 'Sales', 'Purchase', 'Tax', 'Expense')),
      accounterType TEXT CHECK (accounterType IN ('Main', 'GPay', 'Client')),
      openingBalance REAL DEFAULT 0,
      openingBalanceType TEXT DEFAULT 'DR' CHECK (openingBalanceType IN ('DR', 'CR')),
      closingBalance REAL DEFAULT 0,
      closingBalanceType TEXT DEFAULT 'DR' CHECK (closingBalanceType IN ('DR', 'CR')),
      accountNumber TEXT,
      status TEXT DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  // 4. Purchase Payments Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS purchase_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchaseId INTEGER NOT NULL,
      method TEXT,
      amount REAL,
      chequeNo TEXT,
      clientId INTEGER,
      accountId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchaseId) REFERENCES purchases(id) ON DELETE CASCADE
    );
  `);

  // 5. Sales Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER,
      productId INTEGER,
      date DATETIME,
      quantity INTEGER CHECK (quantity >= 1),
      saleAmount REAL CHECK (saleAmount >= 0),
      multipleProducts TEXT DEFAULT '[]',
      isMultiProduct INTEGER DEFAULT 0 CHECK (isMultiProduct IN (0,1)),
      paymentMethod TEXT DEFAULT 'bank'
        CHECK (paymentMethod IN ('cash','bank','googlepay', 'split','pending')),
      statusOfTransaction TEXT DEFAULT 'pending'
        CHECK (statusOfTransaction IN ('completed','pending','partial')),
      paymentType TEXT DEFAULT 'full'
        CHECK (paymentType IN ('full','partial')),
      pendingAmount REAL DEFAULT 0 CHECK (pendingAmount >= 0),
      paidAmount REAL DEFAULT 0 CHECK (paidAmount >= 0),
      pendingFromOurs REAL DEFAULT 0 CHECK (pendingFromOurs >= 0),
      taxRate REAL DEFAULT 0,
      taxAmount REAL,
      freightCharges REAL,
      freightTaxAmount REAL,
      totalAmountWithTax REAL,
      totalAmountWithoutTax REAL,
      billNo TEXT,
      methodType TEXT DEFAULT 'Receipt'
        CHECK (methodType IN ('Receipt','Payment','Salary')),
      dueDate DATETIME,
      description TEXT,
      payments TEXT DEFAULT '[]',
      pageName TEXT DEFAULT 'Sales',
      discount REAL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // 6. Purchases Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER,
      productId INTEGER,
      date DATETIME,
      quantity INTEGER CHECK (quantity >= 1),
      purchaseAmount REAL CHECK (purchaseAmount >= 0),
      multipleProducts TEXT DEFAULT '[]',
      isMultiProduct INTEGER DEFAULT 0 CHECK (isMultiProduct IN (0,1)),
      paymentMethod TEXT DEFAULT 'bank'
        CHECK (paymentMethod IN ('cash','bank','googlepay','split','pending')),
      statusOfTransaction TEXT DEFAULT 'pending'
        CHECK (statusOfTransaction IN ('completed','pending','partial')),
      paymentType TEXT DEFAULT 'full'
        CHECK (paymentType IN ('full','partial')),
      pendingAmount REAL DEFAULT 0 CHECK (pendingAmount >= 0),
      paidAmount REAL DEFAULT 0 CHECK (paidAmount >= 0),
      pendingFromOurs REAL DEFAULT 0 CHECK (pendingFromOurs >= 0),
      taxRate REAL DEFAULT 0,
      taxAmount REAL,
      freightCharges REAL,
      freightTaxAmount REAL,
      totalAmountWithTax REAL,
      totalAmountWithoutTax REAL,
      billNo TEXT,
      methodType TEXT DEFAULT 'Payment'
        CHECK (methodType IN ('Receipt','Payment','Salary')),
      dueDate DATETIME,
      description TEXT,
      payments TEXT DEFAULT '[]',
      pageName TEXT DEFAULT 'Purchase',
      discount REAL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE SET NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // 7. Ledger Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accountId INTEGER NOT NULL,
      clientId INTEGER,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      entryType TEXT CHECK (entryType IN ('debit', 'credit', 'opening')),
      amount REAL,
      balanceAfter REAL,
      balanceType TEXT DEFAULT 'DR' CHECK (balanceType IN ('DR', 'CR')),
      referenceType TEXT CHECK (referenceType IN ('Opening', 'Purchase', 'Sales', 'Payment', 'Adjustment', 'Transfer', 'Salary', 'Adjustment(Manual)', 'BankAdjustment(Manual)')),
      referenceId INTEGER,
      narration TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
    );
  `);

  // 8. Settings Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxName TEXT NOT NULL,
      taxValue TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. KeyBindings Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS keyBindings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      key TEXT NOT NULL,
      modifiers TEXT DEFAULT '[]',
      action TEXT CHECK (action IN ('navigate','callback','custom')) DEFAULT 'navigate',
      value TEXT,
      enabled INTEGER DEFAULT 1 CHECK (enabled IN (0,1)),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. Taxes Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxName TEXT NOT NULL,
      taxValue REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 11. Action Logs Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS action_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actionType TEXT CHECK (actionType IN ('CREATE', 'UPDATE', 'DELETE', 'TRANSFER')),
      module TEXT NOT NULL,
      entityId INTEGER,
      entityName TEXT,
      title TEXT NOT NULL,
      details TEXT,
      fromSource TEXT,
      toDestination TEXT,
      amount REAL,
      oldBalance REAL,
      newBalance REAL,
      balanceType TEXT,
      targetRoute TEXT,
      routeParams TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. WhatsApp Messages Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      phone TEXT NOT NULL,
      message TEXT,
      message_type TEXT DEFAULT 'text',
      file_path TEXT,
      status TEXT NOT NULL,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    );
  `);

  // 13. Company Profile Table
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS company_profile (
      id INTEGER PRIMARY KEY DEFAULT 1,
      companyName TEXT DEFAULT 'ENVY ERP',
      tagline TEXT DEFAULT '',
      address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      gstin TEXT DEFAULT '',
      pan TEXT DEFAULT '',
      website TEXT DEFAULT '',
      bankName TEXT DEFAULT '',
      bankAccNo TEXT DEFAULT '',
      bankIfsc TEXT DEFAULT '',
      bankBranch TEXT DEFAULT '',
      terms TEXT DEFAULT '',
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed Nominal Accounts
  const nominals = [
    { name: 'Sales Revenue', type: 'Sales' },
    { name: 'Purchase Expenses', type: 'Purchase' },
    { name: 'GST Tax Account', type: 'Tax' },
    { name: 'Salary Expense', type: 'Expense' },
  ];
  for (const acc of nominals) {
    const exist = await queryRow(
      'SELECT id FROM accounts WHERE accountName = ? AND accountType = ?',
      [acc.name, acc.type]
    );
    if (!exist) {
      await execute(
        `INSERT INTO accounts (accountName, accountType, accounterType, status, openingBalance, openingBalanceType, closingBalance, closingBalanceType)
         VALUES (?, ?, 'Main', 'active', 0, 'DR', 0, 'DR')`,
        [acc.name, acc.type]
      );
    }
  }

  // Seed Default Company Profile
  const companyProfile = await queryRow('SELECT * FROM company_profile WHERE id = 1');
  if (!companyProfile) {
    await execute(
      `INSERT INTO company_profile (id, companyName, tagline, address, phone, email, gstin, pan, website, bankName, bankAccNo, bankIfsc, bankBranch, terms)
       VALUES (1, 'ENVY ERP', 'Industrial & Commercial Solutions', '', '', '', '', '', '', '', '', '', '', ?)`,
      ['1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged if payment is delayed.\n3. Subject to Jurisdiction.']
    );
  }

  // Create Indexes
  try {
    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_ledger_accountId ON ledger(accountId);');
    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_ledger_clientId ON ledger(clientId);');
    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_ledger_date ON ledger(date);');

    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_sales_clientId ON sales(clientId);');
    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_sales_productId ON sales(productId);');
    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);');

    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_purchases_clientId ON purchases(clientId);');
    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_purchases_productId ON purchases(productId);');
    await db.executeSql('CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(date);');
  } catch (idxErr) {
    console.warn('Index creation warning:', idxErr);
  }

  console.log('✅ SQLite database initialized successfully with all 13 tables & seeds');
  return true;
};

export default {
  getDB,
  execute,
  query,
  queryRow,
  runTransaction,
  initDatabase,
};
