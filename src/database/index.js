// src/database/index.js
const { Sequelize } = require('sequelize');
const CustomerModel = require('./models/Customer');
const LoanModel = require('./models/Loan');


const sequelize = new Sequelize('credit-approval-system', 'postgres', 'user', {
  host: 'localhost',
  dialect: 'postgres',
  
});

const Customer = CustomerModel(sequelize, Sequelize);
const Loan = LoanModel(sequelize, Sequelize);

// Define the association
Customer.hasMany(Loan, { foreignKey: 'customer_id' });
Loan.belongsTo(Customer, { foreignKey: 'customer_id' });

sequelize.sync().then(() => {
  console.log('Database and tables created!');
})
.catch((error) => {
  console.error('Error synchronizing tables:', error);
});

module.exports = { sequelize, Customer, Loan };
