// routes.js
const express = require('express');
const { Customer, Loan } = require('../database');

const { Sequelize } = require('sequelize');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, age, monthly_income, phone_number } = req.body;

    const approved_limit = Math.round(36 * monthly_income / 100000) * 100000;

    const newCustomer = await Customer.create({
      first_name,
      last_name,
      age,
      monthly_income,
      approved_limit,
      phone_number,
    });

    return res.json({
      customer_id: newCustomer.customer_id,
      name: `${newCustomer.first_name} ${newCustomer.last_name}`,
      age: newCustomer.age,
      monthly_income: newCustomer.monthly_income,
      approved_limit: newCustomer.approved_limit,
      phone_number: newCustomer.phone_number,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/check-eligibility', async (req, res) => {
    try {
      const { customer_id, loan_amount, interest_rate, tenure } = req.body;
  
      // Fetch customer's historical loan data
      const customerLoans = await Loan.findAll({
        where: { customer_id },
      });
  
      // Calculate credit score based on historical data
      const creditScore = calculateCreditScore(customerLoans);
  
      // Determine loan approval based on credit score
      let approval = false;
      let correctedInterestRate = null;
  
      if (creditScore > 50) {
        approval = true;
      } else if (50 >= creditScore && creditScore > 30) {
        if (interest_rate <= 12) {
          correctedInterestRate = 12;
        } else {
          approval = true;
        }
      } else if (30 >= creditScore && creditScore > 10) {
        if (interest_rate <= 16) {
          correctedInterestRate = 16;
        } else {
          approval = true;
        }
      }
  
      // Check if sum of current EMIs > 50% of monthly salary
      const customerDetails = await Customer.findByPk(customer_id);
      const totalEMIs = await Loan.sum('monthly_payment', {
        where: { customer_id, end_date: null },
      });
  
      if (totalEMIs > 0.5 * customerDetails.monthly_salary) {
        approval = false;
      }
  
      // Response body
      const response = {
        customer_id,
        approval,
        interest_rate,
        corrected_interest_rate: correctedInterestRate,
        tenure,
        monthly_installment: calculateMonthlyInstallment(loan_amount, correctedInterestRate || interest_rate, tenure),
      };
  
      return res.json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Helper function to calculate credit score based on historical loan data
  function calculateCreditScore(loans) {
    const emisPaidOnTimeScore = loans.reduce((score, loan) => score + loan.emis_paid_on_time, 0);
    const numberOfLoansScore = loans.length;
    const currentYear = new Date().getFullYear();
    const loanActivityScore = loans.filter(loan => new Date(loan.start_date).getFullYear() === currentYear).length;
    const loanApprovedVolumeScore = loans.reduce((score, loan) => score + loan.loan_amount, 0);
    const approvedLimit = loans[0]?.Customer?.approved_limit || 0; // Assuming customer has the same approved limit for all loans
  
    let creditScore = emisPaidOnTimeScore + numberOfLoansScore + loanActivityScore + loanApprovedVolumeScore;
  
    // If sum of current loans > approved limit, set credit score to 0
    if (loans.some(loan => loan.Customer?.current_debt > approvedLimit)) {
      creditScore = 0;
    }
  
    // Ensure credit score is a whole number
    return Math.round(creditScore);
  }
  
  // Helper function to calculate monthly installment
  function calculateMonthlyInstallment(loanAmount, interestRate, tenure) {
    const monthlyRate = interestRate / (12 * 100);
    const installment =
      (loanAmount * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -tenure));
    return parseFloat(installment.toFixed(2));
  }

  
  // ... (other imports and setup)

  router.post('/create-loan', async (req, res) => {
    try {
      const { customer_id, loan_amount, interest_rate, tenure } = req.body;
  
      // Fetch customer's details
      const customerDetails = await Customer.findByPk(customer_id);
  
      // Check if the loan amount is less than or equal to half of the monthly salary
      if (loan_amount <= 0.5 * customerDetails.monthly_salary) {
        // Process the new loan
        const newLoan = await Loan.create({
          customer_id,
          loan_amount,
          interest_rate,
          tenure,
          start_date: new Date(),
        });
  
        // Response body for approved loan
        const response = {
          loan_id: newLoan.id,
          customer_id,
          loan_approved: true,
          message: 'Loan approved.',
          monthly_installment: calculateMonthlyInstallment(loan_amount, interest_rate, tenure),
        };
  
        return res.json(response);
      } else {
        // If loan is not approved, return the response with loan_approved set to false
        const response = {
          loan_id: null,
          customer_id,
          loan_approved: false,
          message: 'Loan not approved. Check eligibility for details.',
          monthly_installment: 0,
        };
  
        return res.json(response);
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  router.get('/view-loan/:loan_id', async (req, res) => {
  try {
    const loan_id = req.params.loan_id;

    // Fetch loan details including associated customer details
    const loanDetails = await Loan.findByPk(loan_id, {
      include: [
        {
          model: Customer,
          attributes: ['customer_id', 'first_name', 'last_name', 'phone_number'],
          as: 'Customer', // Add this line to specify the alias
        },
      ],
    });

    // If loan not found, return appropriate response
    if (!loanDetails) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Response body
    const response = {
      loan_id: loanDetails.id,
      customer: {
        id: loanDetails.Customer.id, // Update to use the alias 'Customer'
        first_name: loanDetails.Customer.first_name,
        last_name: loanDetails.Customer.last_name,
        phone_number: loanDetails.Customer.phone_number,
        age: loanDetails.Customer.age,
      },
      loan_amount: loanDetails.loan_amount,
      interest_rate: loanDetails.interest_rate,
      monthly_installment: calculateMonthlyInstallment(
        loanDetails.loan_amount,
        loanDetails.interest_rate,
        loanDetails.tenure
      ),
      tenure: loanDetails.tenure,
    };

    return res.json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

  
router.post('/make-payment/:customer_id/:loan_id', async (req, res) => {
    try {
      const customer_id = req.params.customer_id;
      const loan_id = req.params.loan_id;
      const { amount_paid } = req.body;
  
      // Fetch loan details including associated customer details
      const loanDetails = await Loan.findByPk(loan_id, {
        include: [
          {
            model: Customer,
            attributes: ['customer_id', 'monthly_salary'],
          },
        ],
      });
  
      // If loan not found, return appropriate response
      if (!loanDetails) {
        return res.status(404).json({ error: 'Loan not found' });
      }
  
      // Calculate the remaining EMI amount
      const remainingEMI = loanDetails.monthly_payment - amount_paid;
  
      // If the remaining EMI is negative, return an error response
      if (remainingEMI < 0) {
        return res.status(400).json({ error: 'Amount paid exceeds the due installment amount' });
      }
  
      // Recalculate monthly installment based on the remaining EMI
      const recalculatedMonthlyInstallment = calculateMonthlyInstallment(
        loanDetails.loan_amount,
        loanDetails.interest_rate,
        loanDetails.tenure
      );
  
      // Update the loan details with the new remaining EMI and end date if EMI is fully paid
      const updatedLoanDetails = {
        monthly_payment: remainingEMI,
        end_date: remainingEMI === 0 ? new Date() : null,
      };
  
      // Use the correct primary key column name in the where clause
      await Loan.update(updatedLoanDetails, {
        where: { loan_id: loan_id },
      });
  
      // Response body
      const response = {
        customer_id,
        loan_id,
        remaining_emi: remainingEMI,
        recalculated_monthly_installment: recalculatedMonthlyInstallment,
      };
  
      return res.json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


  // Helper function to calculate remaining repayments
function calculateRepaymentsLeft(totalPayments, completedPayments) {
  return totalPayments - completedPayments;
}

router.get('/view-statement/:customer_id/:loan_id', async (req, res) => {
  try {
      const customer_id = req.params.customer_id;
      const loan_id = req.params.loan_id;
      console.log('Customer ID:', customer_id);
      console.log('Loan ID:', loan_id);

      // Fetch loan details including associated customer details
      const loanDetails = await Loan.findByPk(loan_id, {
          include: [
              {
                  model: Customer,
                  attributes: ['customer_id'],
              },
          ],
      });

      console.log('Loan Details:', loanDetails);

      // If loan not found or does not belong to the specified customer, return appropriate response
      if (!loanDetails || loanDetails.customer_id !== parseInt(customer_id)) {
          console.log('Loan not found or does not belong to the specified customer');
          return res.status(404).json({ error: 'Loan not found or does not belong to the specified customer' });
      }

      // Fetch all loan items for the specified loan
      const loanItems = await Loan.findAll({
          attributes: ['customer_id', 'loan_id', 'loan_amount', 'interest_rate', 'monthly_payment', 'end_date', 'EMIs_paid_on_Time'],
          where: { customer_id, loan_id: { [Sequelize.Op.lte]: loan_id } },
      });

      console.log('Loan Items:', loanItems);

      // Response body
      const response = loanItems.map(item => ({
          customer_id: item.customer_id,
          loan_id: item.loan_id,
          principal: item.loan_amount,
          interest_rate: item.interest_rate,
          amount_paid: item.monthly_payment,
          monthly_installment: item.monthly_payment,
          repayments_left: calculateRepaymentsLeft(loanDetails.tenure * 12, item.EMIs_paid_on_Time || 0),
      }));

      return res.json(response);
  } catch (error) {
      console.error('Error in view-statement route:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});


  module.exports = router;
  
  
 

// Repeat a similar structure for other endpoints
