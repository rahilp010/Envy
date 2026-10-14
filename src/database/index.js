import db, { initDatabase, execute, query, queryRow } from './db';
import runMigrations from './migrations';
import * as productHandlers from './handlers/productHandlers';
import * as clientHandlers from './handlers/clientHandlers';
import * as accountHandlers from './handlers/accountHandlers';
import * as salesHandlers from './handlers/salesHandlers';
import * as purchaseHandlers from './handlers/purchaseHandlers';
import * as ledgerHandlers from './handlers/ledgerHandlers';
import * as transferHandlers from './handlers/transferHandlers';
import * as reportHandlers from './handlers/reportHandlers';
import * as settingsHandlers from './handlers/settingsHandlers';
import * as taxHandlers from './handlers/taxHandlers';
import * as actionLogHandlers from './handlers/actionLogHandlers';
import * as warrantyHandlers from './handlers/warrantyHandlers';
import * as billUtils from './handlers/billUtils';
import * as helpers from './handlers/helpers';

export const setupDatabase = async () => {
  await initDatabase();
  await runMigrations();
};

export {
  db,
  initDatabase,
  runMigrations,
  execute,
  query,
  queryRow,
  productHandlers,
  clientHandlers,
  accountHandlers,
  salesHandlers,
  purchaseHandlers,
  ledgerHandlers,
  transferHandlers,
  reportHandlers,
  settingsHandlers,
  taxHandlers,
  actionLogHandlers,
  warrantyHandlers,
  billUtils,
  helpers,
};

export default {
  setupDatabase,
  ...productHandlers,
  ...clientHandlers,
  ...accountHandlers,
  ...salesHandlers,
  ...purchaseHandlers,
  ...ledgerHandlers,
  ...transferHandlers,
  ...reportHandlers,
  ...settingsHandlers,
  ...taxHandlers,
  ...actionLogHandlers,
  ...warrantyHandlers,
  ...billUtils,
  ...helpers,
};
