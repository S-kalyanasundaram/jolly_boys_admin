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

  const [fineAmount, setFineAmount] = useState("");

  const selectedUser = users[selectedUserIndex];

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

  useEffect(() => {
    if (selectedUser) {
      fetchLoanDetails(selectedUser.user_id);
      setFineAmount(selectedUser.fine_2026 || "");
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

  async function handleAmountSubmit() {
    if (!amount || !selectedUser) return;

    await supabase
      .from("amount_2026")
      .update({ [selectedMonth]: parseInt(amount) })
      .eq("user_id", selectedUser.user_id);

    setAmount("");
    moveToNextUser();
  }

  async function handleFineSubmit() {
    if (!selectedUser) return;

    await supabase
      .from("amount_2026")
      .update({ fine_2026: fineAmount ? parseInt(fineAmount) : null })
      .eq("user_id", selectedUser.user_id);

    fetchUsers();
  }

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

  async function handleStatusChange(value) {
    setLoanStatus(value);

    if (!loanData || !selectedUser) return;

    await supabase
      .from("loan_details")
      .update({ status_id: value })
      .eq("user_id", selectedUser.user_id)
      .eq("amount_id", loanData.amount_id);
  }

  async function handleCreateLoan() {
    if (!newLoanAmount || !selectedUser) return;

    await supabase
      .from("loan_details")
      .insert({
        user_id: selectedUser.user_id,
        loan_amount: parseInt(newLoanAmount),
        status_id: 1
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
    <div style={styles.page}>

      <h1 style={styles.title}>
       Jolly Boys Admin Monthly Collection
      </h1>

      <div style={styles.container}>

        {/* Select User */}
        <div style={styles.card}>
          <label>Select User</label>
          <select
            value={selectedUserIndex}
            onChange={(e) => setSelectedUserIndex(Number(e.target.value))}
            style={styles.input}
          >
            {users.map((user, index) => (
              <option key={user.user_id} value={index}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* Select Month */}
        <div style={styles.card}>
          <label>Select Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={styles.input}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly Amount */}
        <div style={styles.card}>
          <label>Enter Monthly Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
          />
          <button style={styles.greenBtn} onClick={handleAmountSubmit}>
            Submit Monthly Amount
          </button>
        </div>

        {/* Fine Section */}
        <div style={styles.card}>
          <h2 style={{color:"#60a5fa"}}>Fine Section</h2>

          <p>
            Current Fine:
            <span style={{color:"#f87171", marginLeft:10}}>
              ₹ {selectedUser?.fine_2026 || 0}
            </span>
          </p>

          <input
            type="number"
            placeholder="Enter Fine Amount"
            value={fineAmount}
            onChange={(e) => setFineAmount(e.target.value)}
            style={styles.input}
          />

          <button style={styles.blueBtn} onClick={handleFineSubmit}>
            Update Fine
          </button>
        </div>

        {/* Loan Section */}
        <div style={styles.card}>
          <h2 style={{color:"#facc15"}}>Loan Section</h2>

          {loanData && loanStatus === 1 ? (
            <>
              <p>Loan Amount: ₹ {loanData.loan_amount}</p>
              <p>Monthly Interest (1%): ₹ {interestAmount}</p>
              <p>Total Paid: ₹ {loanData.loan_total}</p>

              <select
                value={loanStatus}
                onChange={(e) => handleStatusChange(Number(e.target.value))}
                style={styles.input}
              >
                <option value={1}>Ongoing</option>
                <option value={2}>Closed</option>
              </select>

              <input
                type="number"
                placeholder="Enter Monthly Interest Payment"
                value={interestPay}
                onChange={(e) => setInterestPay(e.target.value)}
                style={styles.input}
              />

              <button style={styles.yellowBtn} onClick={handleInterestSubmit}>
                Submit Interest
              </button>
            </>
          ) : (
            <>
              <div>
                <input
                  type="checkbox"
                  checked={wantLoan}
                  onChange={(e) => setWantLoan(e.target.checked)}
                />
                <label style={{marginLeft:8}}>Want Loan?</label>
              </div>

              {wantLoan && (
                <>
                  <input
                    type="number"
                    placeholder="Enter Loan Amount"
                    value={newLoanAmount}
                    onChange={(e) => setNewLoanAmount(e.target.value)}
                    style={styles.input}
                  />

                  <button style={styles.blueBtn} onClick={handleCreateLoan}>
                    Create Loan
                  </button>
                </>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    background: "linear-gradient(135deg,#0f172a,#1e293b,#000)",
    color: "white",
    fontFamily: "Arial, sans-serif"
  },
  title: {
    textAlign: "center",
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "30px",
    background: "linear-gradient(90deg,#60a5fa,#a78bfa)",
    color:"white"
  },
  container: {
    maxWidth: "800px",
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "25px"
  },
  card: {
    backdropFilter: "blur(15px)",
    background: "rgba(255,255,255,0.08)",
    padding: "20px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  input: {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.3)",
  backgroundColor: "#1e293b",   // FIXED
  color: "#ffffff",
  outline: "none",
  fontSize: "14px"
},
  greenBtn: {
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(34,197,94,0.7)",
    color: "white",
    cursor: "pointer"
  },
  blueBtn: {
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(59,130,246,0.7)",
    color: "white",
    cursor: "pointer"
  },
  yellowBtn: {
    padding: "10px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(234,179,8,0.7)",
    color: "black",
    cursor: "pointer"
  }
};

export default AdminPanel;