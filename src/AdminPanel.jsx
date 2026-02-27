import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const months = [
  "jan","feb","mar","apr","may","jun",
  "jul","aug","sep","oct","nov","dec"
];

function AdminPanel() {

  const [users, setUsers] = useState([]);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState("jan");
  const [amount, setAmount] = useState("");
  const [loanData, setLoanData] = useState(null);
  const [interestAmount, setInterestAmount] = useState(0);
  const [interestPay, setInterestPay] = useState("");

  const [loanStatus, setLoanStatus] = useState(2);
  const [newLoanAmount, setNewLoanAmount] = useState("");
  const [wantLoan, setWantLoan] = useState(false);

  const selectedUser = users[selectedUserIndex];

  // Fetch Users
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from("amount_2026")
      .select("*")
      .order("user_id");

    if (data) setUsers(data);
  }

  // Fetch Loan when user changes
  useEffect(() => {
    if (selectedUser) {
      fetchLoanDetails(selectedUser.user_id);
    }
  }, [selectedUserIndex]);

  async function fetchLoanDetails(userId) {
    setLoanData(null);
    setInterestPay("");
    setNewLoanAmount("");
    setWantLoan(false);

    const { data } = await supabase
      .from("loan_details")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setLoanData(data);
      setInterestAmount(data.intrest_amount);
      setLoanStatus(data.status_id);
    }
  }

  // Monthly Amount Submit
  async function handleAmountSubmit() {
    if (!amount || !selectedUser) return;

    await supabase
      .from("amount_2026")
      .update({ [selectedMonth]: parseInt(amount) })
      .eq("user_id", selectedUser.user_id);

    setAmount("");
    moveToNextUser();
  }

  // Interest Submit
  async function handleInterestSubmit() {
    if (!interestPay || !loanData || !selectedUser) return;

    const column = `in_${selectedMonth}`;

    await supabase
      .from("loan_details")
      .update({ [column]: parseInt(interestPay) })
      .eq("user_id", selectedUser.user_id)
      .eq("amount_id", loanData.amount_id);

    setInterestPay("");
    moveToNextUser();
  }

  // Change Loan Status
  async function handleStatusChange(value) {
    setLoanStatus(value);

    if (!loanData || !selectedUser) return;

    await supabase
      .from("loan_details")
      .update({ status_id: value })
      .eq("user_id", selectedUser.user_id)
      .eq("amount_id", loanData.amount_id);
  }

  // Create Loan
  async function handleCreateLoan() {
    if (!newLoanAmount || !selectedUser) return;

    await supabase
      .from("loan_details")
      .insert({
        user_id: selectedUser.user_id,
        loan_amount: parseInt(newLoanAmount),
        status_id: 1   // Ongoing
      });

    setWantLoan(false);
    fetchLoanDetails(selectedUser.user_id);
  }

  function moveToNextUser() {
    if (selectedUserIndex < users.length - 1) {
      setSelectedUserIndex(prev => prev + 1);
    } else {
      setSelectedUserIndex(0);
    }
  }

  return (
    <div className="space-y-8">

      <h1 className="text-3xl font-bold text-center">
        Admin Monthly Collection
      </h1>

      {/* USER SELECT */}
      <div>
        <label className="block mb-2">Select User</label>
        <select
          value={selectedUserIndex}
          onChange={(e) => setSelectedUserIndex(Number(e.target.value))}
          className="w-full p-2 bg-slate-700 rounded"
        >
          {users.map((user, index) => (
            <option key={user.user_id} value={index}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* MONTH SELECT */}
      <div>
        <label className="block mb-2">Select Month</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full p-2 bg-slate-700 rounded"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* MONTHLY AMOUNT */}
      <div>
        <label className="block mb-2">Enter Monthly Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 bg-slate-700 rounded"
        />
        <button
          onClick={handleAmountSubmit}
          className="mt-3 w-full bg-green-600 p-2 rounded"
        >
          Submit Monthly Amount
        </button>
      </div>

      {/* LOAN SECTION */}
      <div className="bg-slate-800 p-6 rounded-xl space-y-4">
        <h2 className="text-xl font-bold text-yellow-400">
          Loan Section
        </h2>

        {loanData && loanStatus === 1 ? (
          <>
            <p>Loan Amount: ₹ {loanData.loan_amount}</p>
            <p>Monthly Interest (1%): ₹ {interestAmount}</p>
            <p>Total Paid: ₹ {loanData.loan_total}</p>

            {/* STATUS */}
            <div>
              <label className="block mb-2">Loan Status</label>
              <select
                value={loanStatus}
                onChange={(e) => handleStatusChange(Number(e.target.value))}
                className="w-full p-2 bg-slate-700 rounded"
              >
                <option value={1}>Ongoing</option>
                <option value={2}>Closed</option>
              </select>
            </div>

            {/* Interest Payment */}
            <input
              type="number"
              placeholder="Enter Monthly Interest Payment"
              value={interestPay}
              onChange={(e) => setInterestPay(e.target.value)}
              className="w-full p-2 bg-slate-700 rounded"
            />

            <button
              onClick={handleInterestSubmit}
              className="w-full bg-yellow-600 p-2 rounded"
            >
              Submit Interest
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={wantLoan}
                onChange={(e) => setWantLoan(e.target.checked)}
              />
              <label>Want Loan?</label>
            </div>

            {wantLoan && (
              <>
                <input
                  type="number"
                  placeholder="Enter Loan Amount"
                  value={newLoanAmount}
                  onChange={(e) => setNewLoanAmount(e.target.value)}
                  className="w-full p-2 bg-slate-700 rounded"
                />

                <button
                  onClick={handleCreateLoan}
                  className="w-full bg-blue-600 p-2 rounded"
                >
                  Create Loan
                </button>
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
}

export default AdminPanel;