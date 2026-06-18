import { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, X } from 'lucide-react';
import { getTransactions, createTransaction } from '../api/transactionApi';
import { useAuth } from '../context/AuthContext';
import RiskBadge from '../components/RiskBadge';
import { formatDate, formatCurrency } from '../utils/helpers';
import Loader from '../components/Loader';

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    beneficiary_id: '',
    beneficiary_name: '',
    city: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTransaction({
        user_id: user.user_id,
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowForm(false);
      setFormData({ amount: '', beneficiary_id: '', beneficiary_name: '', city: '' });
      fetchTransactions();
    } catch (err) {
      console.error('Failed to create transaction');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success';
      case 'blocked': return 'bg-danger/10 text-danger';
      case 'flagged': return 'bg-warning/10 text-warning';
      default: return 'bg-text-muted/10 text-text-muted';
    }
  };

  if (loading) return <Loader text="Loading transactions..." />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Transactions</h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2">Monitor and analyze transactions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-bg-dark font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancel' : 'New Transaction'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5">
          <h3 className="text-text-primary font-semibold text-base">Create Transaction</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Amount (INR)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Beneficiary ID</label>
              <input
                value={formData.beneficiary_id}
                onChange={(e) => setFormData({ ...formData, beneficiary_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="B001"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Beneficiary Name</label>
              <input
                value={formData.beneficiary_name}
                onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Rajesh Kumar"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">City</label>
              <input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Surat"
                required
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-bg-dark font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20">
              Submit
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-bg-dark hover:bg-bg-card-hover text-text-secondary rounded-xl transition-colors cursor-pointer border border-border">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-dark/50">
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">ID</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Amount</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Beneficiary</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">City</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Risk</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={tx.transaction_id} className={`border-b border-border/50 hover:bg-bg-card-hover/50 transition-colors ${idx % 2 === 0 ? 'bg-bg-dark/20' : ''}`}>
                  <td className="px-6 py-4 text-text-primary text-sm font-medium">#{tx.transaction_id}</td>
                  <td className="px-6 py-4 text-text-primary text-sm font-semibold">{formatCurrency(tx.amount)}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{tx.beneficiary_name}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{tx.city}</td>
                  <td className="px-6 py-4"><RiskBadge level={tx.risk_score > 70 ? 'High' : tx.risk_score > 30 ? 'Medium' : 'Low'} size="sm" /></td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-muted text-sm">{formatDate(tx.transaction_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <ArrowLeftRight size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-base">No transactions found</p>
            <p className="text-sm mt-1">Create a transaction to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
