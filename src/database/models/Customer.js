

module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    customer_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    monthly_salary: DataTypes.INTEGER,
    approved_limit: DataTypes.INTEGER,
  });

  // Manually set the start value for auto-increment
  sequelize.query('ALTER SEQUENCE "Customers_customer_id_seq" RESTART WITH 300;');

  return Customer;
};
