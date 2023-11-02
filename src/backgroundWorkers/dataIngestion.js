const path = require('path');
const xlsx = require('xlsx');
const { sequelize, Customer, Loan } = require("../database");

async function ingestCustomerData() {
  const filePath = path.join(__dirname, '../../data/customer_data.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const customerData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  for (const customer of customerData) {
    // Use upsert to update existing records or insert new ones
    await Customer.upsert(customer, { returning: true });
  }

  console.log('Customer data ingested successfully');
}

async function ingestLoanData() {
  const filePath = path.join(__dirname, '../../data/loan_data.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const loanData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  for (const loan of loanData) {
    // Use upsert to update existing records or insert new ones
    await Loan.upsert(loan, { returning: true });
  }

  console.log('Loan data ingested successfully');
}

async function main() {
  try {
    // Sync models with the database to create tables
    await sequelize.sync();

    // Ingest customer data
    await ingestCustomerData();

    // Ingest loan data
    await ingestLoanData();

    console.log('Data ingestion completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during data ingestion:', error);
    process.exit(1);
  }
}

main();
