import React, { useState } from 'react';
import { useExpenses, DEFAULT_EXPENSE_CATEGORIES } from '../features/expenses/useExpenses';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Expense } from '../types';
import { getTashkentTodayString, formatUzbekDate } from '../lib/dates';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Filter,
  PieChart,
  Calendar,
  DollarSign,
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const {
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    totalAmount,
    getCategoryBreakdown,
  } = useExpenses();

  const todayStr = getTashkentTodayString();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Form inputs
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [expenseDate, setExpenseDate] = useState<string>(todayStr);
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setAmount('');
    setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
    setExpenseDate(todayStr);
    setDescription('');
    setNotes('');
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setExpenseDate(exp.expense_date);
    setDescription(exp.description);
    setNotes(exp.notes || '');
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Xarajat summasi 0 dan katta bo‘lishi lozim');
      return;
    }

    if (!description.trim()) {
      setError('Tavsif kiritilishi shart');
      return;
    }

    setLoading(true);
    setError(null);

    if (editingExpense) {
      const res = await updateExpense(editingExpense.id, {
        amount: numAmount,
        category,
        expense_date: expenseDate,
        description: description.trim(),
        notes: notes.trim() || undefined,
      });
      setLoading(false);
      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setError(res.error || 'Yangilashda xatolik');
      }
    } else {
      const res = await addExpense({
        amount: numAmount,
        currency: 'UZS',
        category,
        expense_date: expenseDate,
        description: description.trim(),
        notes: notes.trim() || undefined,
      });
      setLoading(false);
      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setError(res.error || 'Qo‘shishda xatolik');
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    await deleteExpense(deletingId);
    setDeletingId(null);
  };

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => {
    if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;

    if (dateFilter === 'today') {
      return e.expense_date === todayStr;
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return e.expense_date >= sevenDaysAgo;
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return e.expense_date >= thirtyDaysAgo;
    }
    return true;
  });

  const filteredTotal = filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

  // Today's total
  const todayTotal = expenses
    .filter((e) => e.expense_date === todayStr)
    .reduce((acc, e) => acc + Number(e.amount), 0);

  const breakdown = getCategoryBreakdown();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/40 rounded-2xl sm:rounded-3xl border border-emerald-200/90 border-l-[5px] border-l-emerald-600 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 mb-1">
              <Wallet className="w-4 h-4" />
              <span>KUNLIK XARAJATLAR</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Shaxsiy Moliya va Xarajatlar
            </h2>
          </div>

          <Button variant="primary" size="md" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Yangi xarajat
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Bugungi xarajat"
          value={`${todayTotal.toLocaleString()} UZS`}
          icon={Wallet}
        />
        <StatCard
          label="Chaqiriq jami xarajati"
          value={`${totalAmount.toLocaleString()} UZS`}
          icon={DollarSign}
        />
        <StatCard
          label="Filtr bo‘yicha summa"
          value={`${filteredTotal.toLocaleString()} UZS`}
          icon={Filter}
        />
        <StatCard
          label="Asosiy kategoriya"
          value={breakdown[0] ? breakdown[0].name : '—'}
          icon={PieChart}
        />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        {/* Date Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {(
            [
              { key: 'all', label: 'Barchasi' },
              { key: 'today', label: 'Bugun' },
              { key: '7days', label: '7 kun' },
              { key: '30days', label: '30 kun' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setDateFilter(t.key)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                dateFilter === t.key
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Toifa:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-800 outline-none"
          >
            <option value="all">Barcha toifalar</option>
            {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses History List */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Xarajatlar ro‘yxati ({filteredExpenses.length})
          </h3>
          <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">
            Jami: {filteredTotal.toLocaleString()} UZS
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-8 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
            Tanlangan parametrlar bo‘yicha xarajat topilmadi.{' '}
            <button
              onClick={handleOpenAdd}
              className="text-blue-600 font-semibold hover:underline"
            >
              Yangi xarajat kiritish
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm truncate">
                      {item.description}
                    </span>
                    <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 mt-1">
                    <span>{formatUzbekDate(item.expense_date)}</span>
                    {item.notes && <span>· "{item.notes}"</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold font-mono text-slate-900 tabular-nums">
                    {Number(item.amount).toLocaleString()} {item.currency}
                  </span>

                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                    title="Tahrirlash"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                    title="O‘chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingExpense ? 'Xarajatni tahrirlash' : 'Yangi xarajat kiritish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Summa (UZS) *
            </label>
            <input
              type="number"
              required
              min="100"
              step="500"
              placeholder="35000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm font-mono tabular-nums text-slate-900 font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategoriya
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sana
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tavsif (nima uchun sarflandi?) *
            </label>
            <input
              type="text"
              required
              placeholder="Tushlik, SAT kitobi, metro yo‘lkira..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Qo‘shimcha izoh (ixtiyoriy)
            </label>
            <textarea
              rows={2}
              placeholder="Chek raqami yoki do‘kon nomi..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={loading}>
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Xarajatni o‘chirish"
        message="Haqiqatan ham ushbu xarajat qaydini o‘chirmoqchimisiz? Ushbu amal hisobotlarga ta’sir qiladi."
        confirmLabel="O‘chirish"
      />
    </div>
  );
};
