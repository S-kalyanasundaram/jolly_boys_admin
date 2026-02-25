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

  const selectedUser = users[selectedUserIndex];

  // 🔹 Fetch All Users
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("amount_2026")
      .select("*")
      .order("user_id");
      

    if (!error) {
      setUsers(data);
    }
  }

  // 🔹 Fetch Loan Details when user changes
  useEffect(() => {
    if (selectedUser) {
      fetchLoanDetails(selectedUser.user_id);
    }
  }, [selectedUserIndex]);

  async function fetchLoanDetails(userId) {
    setLoanData(null);
    setInterestPay("");

    const { data, error } = await supabase
      .from("loan_details")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setLoanData(data);
      setInterestAmount(data.intrest_amount);
    } else {
      setLoanData(null);
    }
  }

  // 🔹 Submit Monthly Amount
  async function handleAmountSubmit() {
    if (!amount) return;

    await supabase
      .from("amount_2026")
      .update({ [selectedMonth]: parseInt(amount) })
      .eq("user_id", selectedUser.user_id);

    setAmount("");

    moveToNextUser();
  }

  // 🔹 Submit Monthly Interest
  async function handleInterestSubmit() {
    if (!interestPay) return;

    const column = `in_${selectedMonth}`;

    await supabase
      .from("loan_details")
      .update({ [column]: parseInt(interestPay) })
      .eq("user_id", selectedUser.user_id);

    setInterestPay("");

    moveToNextUser();
  }

  // 🔹 Auto Move Next User
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
      {loanData && (
        <div className="bg-slate-800 p-6 rounded-xl space-y-4">

          <h2 className="text-xl font-bold text-yellow-400">
            Loan Details
          </h2>

          <p>Loan Amount: ₹ {loanData.loan_amount}</p>
          <p>Monthly Interest (1%): ₹ {interestAmount}</p>

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

        </div>
      )}

    </div>
  );
}

export default AdminPanel;