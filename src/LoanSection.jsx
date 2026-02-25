import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function LoanSection({ userId }) {
  const [loanAmount, setLoanAmount] = useState(0);
  const [interestRate, setInterestRate] = useState(1);
  const [interestAmount, setInterestAmount] = useState(0);
  const [status, setStatus] = useState("Ongoing");

  useEffect(() => {
    if (userId) fetchLoan();
  }, [userId]);

  async function fetchLoan() {
    const { data } = await supabase
      .from("loan_details")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setLoanAmount(data.loan_amount || 0);
      setInterestAmount(data.intrest_amount || 0);
      setStatus(data.status_id === 2 ? "Closed" : "Ongoing");
    }
  }

  async function saveLoan() {
    const interest = loanAmount * (interestRate / 100);

    const payload =
      status === "Closed"
        ? { loan_amount: null, intrest_amount: null, status_id: 2 }
        : {
            loan_amount: loanAmount,
            intrest_amount: interest,
            status_id: 1,
          };

    await supabase
      .from("loan_details")
      .upsert({ ...payload, user_id: userId });

    alert("Loan Saved");
    fetchLoan();
  }

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl mb-8">

      <h2 className="text-2xl font-semibold mb-6">🏦 Loan Management</h2>

      <div className="grid md:grid-cols-3 gap-4 mb-4">

        <input
          type="number"
          placeholder="Loan Amount"
          value={loanAmount}
          onChange={(e) => setLoanAmount(Number(e.target.value))}
          className="bg-slate-800 p-3 rounded-lg border border-slate-600"
        />

        <input
          type="number"
          placeholder="Interest %"
          value={interestRate}
          onChange={(e) => setInterestRate(Number(e.target.value))}
          className="bg-slate-800 p-3 rounded-lg border border-slate-600"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-slate-800 p-3 rounded-lg border border-slate-600"
        >
          <option>Ongoing</option>
          <option>Closed</option>
        </select>
      </div>

      <button
        onClick={saveLoan}
        className="bg-green-600 hover:bg-green-700 transition-all duration-300 px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/40"
      >
        Save Loan
      </button>

      {/* SUMMARY CARDS */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">

        <div className="bg-slate-800 p-5 rounded-xl shadow-lg">
          <p className="text-slate-400">Loan Amount</p>
          <h3 className="text-xl font-bold">₹ {loanAmount}</h3>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl shadow-lg">
          <p className="text-slate-400">Interest</p>
          <h3 className="text-xl font-bold">₹ {interestAmount}</h3>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl shadow-lg">
          <p className="text-slate-400">Status</p>
          <h3 className={`text-xl font-bold ${status === "Closed" ? "text-red-400" : "text-green-400"}`}>
            {status}
          </h3>
        </div>

      </div>
    </div>
  );
}