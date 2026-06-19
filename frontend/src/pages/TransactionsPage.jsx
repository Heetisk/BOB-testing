import { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, X } from 'lucide-react';
import { getTransactions, createTransaction } from '../api/transactionApi';
import { useAuth } from '../context/AuthContext';
import RiskBadge from '../components/RiskBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
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

  const fetchTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data.transactions || []);
    } catch {
      console.error('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchAndSet = () => {
      getTransactions()
        .then((data) => { if (!cancelled) setTransactions(data.transactions || []); })
        .catch(() => console.error('Failed to fetch transactions'))
        .finally(() => { if (!cancelled) setLoading(false); });
    };
    fetchAndSet();
    const interval = setInterval(fetchAndSet, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

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
    } catch {
      console.error('Failed to create transaction');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'text-success bg-success-subtle';
      case 'blocked': return 'text-danger bg-danger-subtle';
      case 'flagged': return 'text-warning bg-warning-subtle';
      default: return 'text-text-3 bg-surface-2';
    }
  };

  if (loading) return <Loader text="Loading transactions..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ArrowLeftRight size={20} className="text-accent" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Transactions</h1>
          </div>
          <p className="text-sm text-text-3 ml-[32px]">Monitor and analyze financial transactions</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'secondary' : 'primary'}
          icon={showForm ? X : Plus}
          aria-expanded={showForm}
        >
          {showForm ? 'Cancel' : 'New Transaction'}
        </Button>
      </div>

      {showForm && (
        <Card padding="lg" className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold text-text-1 font-display">Create Transaction</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Amount (INR)" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
              <Input label="Beneficiary ID" value={formData.beneficiary_id} onChange={(e) => setFormData({ ...formData, beneficiary_id: e.target.value })} placeholder="B001" required />
              <Input label="Beneficiary Name" value={formData.beneficiary_name} onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })} placeholder="Rajesh Kumar" required />
              <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Surat" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="md">Submit</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card padding="none" className="animate-fade-in-up stagger-1">
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-3/50">
                  {['ID', 'Amount', 'Beneficiary', 'City', 'Risk', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-text-3/70 bg-surface-0/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="border-b border-surface-3/30 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-2 font-mono">#{tx.transaction_id}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-1 font-mono">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3 text-sm text-text-2">{tx.beneficiary_name}</td>
                    <td className="px-4 py-3 text-sm text-text-2">{tx.city}</td>
                    <td className="px-4 py-3"><RiskBadge level={tx.risk_score > 70 ? 'High' : tx.risk_score > 30 ? 'Medium' : 'Low'} size="sm" /></td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusStyle(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-3">{formatDate(tx.transaction_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ArrowLeftRight} title="No transactions found" description="Create a transaction to get started" />
        )}
      </Card>
    </div>
  );
}
