// Script to run comprehensive tests for Secondary Market Control features
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

console.log("🧪 Running Secondary Market Control Tests...\n");
console.log("=".repeat(70));
console.log("Testing Anti-Scalping & Price Control Features");
console.log("=".repeat(70));
console.log();

async function runTests() {
  try {
    // Run the specific test file
    const { stdout, stderr } = await execPromise(
      "npx hardhat test test/SecondaryMarketControl.test.js"
    );

    console.log(stdout);

    if (stderr) {
      console.error("⚠️  Warnings:", stderr);
    }

    console.log("\n" + "=".repeat(70));
    console.log("✅ All Secondary Market Control tests completed!");
    console.log("=".repeat(70));
  } catch (error) {
    console.error("\n" + "=".repeat(70));
    console.error("❌ Test execution failed!");
    console.error("=".repeat(70));
    console.error("\nError output:");
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

runTests();
