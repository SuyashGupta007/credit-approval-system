// const express = require('express');
// const routes = require('./src/routes');
// const { sequelize } = require('./src/database');
// const { ingestCustomerData, ingestLoanData } = require('./src/backgroundWorkers/dataIngestion');
// const Customer = require('./src/database/models/Customer');
// const Loan = require('./src/database/models/Loan');

// const app = express();
// const port = process.env.PORT || 5000;

// app.use(express.json());
// app.use('/api', routes);

// const startServer = async () => {
//   try {
//     //await sequelize.authenticate();
//     //console.log('Database connection has been established successfully.');

//     //await sequelize.sync();
//     a//wait ingestCustomerData();
//     //await ingestLoanData();

//     app.listen(port, () => {
//       console.log(`Server is running at http://localhost:${port}`);
//     });
//   } catch (error) {
//     console.error('Error during server startup:', error);
//     if (error.original) {
//       console.error('Original error:', error.original);
//     }
//     process.exit(1);
//   }
// };

// // Global handler for unhandled promise rejections
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });

// startServer();
const express = require('express');
const routes = require('./src/routes');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 5000;
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
