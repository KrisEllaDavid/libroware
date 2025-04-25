const fetch = require("node-fetch");

// GraphQL endpoint
const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

// GraphQL query for pending borrows
const PENDING_BORROWS_QUERY = `
  query GetPendingBorrows {
    borrows(status: BORROWED) {
      id
      user {
        id
        firstName
        lastName
        email
      }
      book {
        id
        title
        isbn
        authors {
          name
        }
      }
      borrowedAt
      dueDate
      status
    }
  }
`;

// Function to execute a GraphQL query
async function executeQuery(query, variables = {}) {
  try {
    console.log(`Executing query to ${GRAPHQL_ENDPOINT}...`);
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error executing GraphQL query:", error);
    throw error;
  }
}

// Test the pending borrows query
async function testPendingBorrowsQuery() {
  try {
    console.log("Testing Pending Borrows Query...");

    // Execute the query
    const result = await executeQuery(PENDING_BORROWS_QUERY);

    // Check for errors
    if (result.errors) {
      console.error("GraphQL errors:", JSON.stringify(result.errors, null, 2));
      return;
    }

    // Log the results
    console.log("Query successful!");

    if (result.data && result.data.borrows) {
      console.log(`Found ${result.data.borrows.length} pending borrows:`);

      // Display a summary of each borrow
      result.data.borrows.forEach((borrow, index) => {
        console.log(`\n--- Borrow ${index + 1} ---`);
        console.log(`ID: ${borrow.id}`);
        console.log(`Book: ${borrow.book.title}`);
        console.log(`User: ${borrow.user.firstName} ${borrow.user.lastName}`);
        console.log(
          `Borrowed: ${new Date(borrow.borrowedAt).toLocaleString()}`
        );
        console.log(`Due: ${new Date(borrow.dueDate).toLocaleString()}`);
        console.log(`Status: ${borrow.status}`);
      });
    } else {
      console.log("No borrows data found in the response.");
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testPendingBorrowsQuery()
  .then(() => {
    console.log("Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed with error:", error);
    process.exit(1);
  });
