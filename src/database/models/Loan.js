// src/database/models/Loan.js

module.exports = (sequelize, DataTypes) => {
    const Loan = sequelize.define('Loan', {
      loan_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        field: 'loan_id',
      },
      loan_amount: DataTypes.FLOAT,
      tenure: DataTypes.INTEGER,
      interest_rate: DataTypes.FLOAT,
      monthly_payment: DataTypes.FLOAT,
      EMIs_paid_on_Time: DataTypes.INTEGER,
      start_date: DataTypes.DATE,
      end_date: DataTypes.DATE,
    });
  
    return Loan;
};
