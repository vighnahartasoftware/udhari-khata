import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, PlusCircle, UserCheck } from 'lucide-react';
import type { Customer } from '@/types/domain';
import { getCustomers } from '@/services/customerService';
import { addCreditTransaction } from '@/services/transactionService';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/feedback/ToastStore';

const creditSchema = z.object({
  customerId: z.string().min(1, 'कृपया ग्राहक निवडा (Select Customer)'),
  amount: z.coerce.number().gt(0, 'उधारी रक्कम ० पेक्षा जास्त असावी (Amount > 0)'),
  description: z.string().optional(),
  transactionDate: z.string().min(1, 'तारीख निवडा (Date required)'),
  recordedBy: z.enum(['vivek', 'nikhil']),
});

type CreditFormData = z.infer<typeof creditSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
  onSuccess?: () => void;
}

export const AddCreditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [customers, setCustomers] = useState<Customer[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema),
    defaultValues: {
      customerId: preselectedCustomerId || '',
      amount: 0,
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      recordedBy: 'vivek',
    },
  });

  const selectedRecordedBy = watch('recordedBy');

  useEffect(() => {
    if (isOpen) {
      getCustomers().then((list) => {
        setCustomers(list);
        if (preselectedCustomerId) {
          setValue('customerId', preselectedCustomerId);
        }
      });
    }
  }, [isOpen, preselectedCustomerId, setValue]);

  if (!isOpen) return null;

  const onSubmit = async (data: CreditFormData) => {
    try {
      const creatorId = user?.id || globalThis.crypto.randomUUID();
      await addCreditTransaction({
        id: globalThis.crypto.randomUUID(),
        customerId: data.customerId,
        amount: Number(data.amount),
        paymentMode: null,
        description: data.description?.trim() || null,
        recordedBy: data.recordedBy,
        transactionDate: new Date(data.transactionDate).toISOString(),
        createdBy: creatorId,
        version: 1,
        syncStatus: 'synced',
        deletedAt: null,
      });

      const performerLabel = data.recordedBy === 'vivek' ? 'विवेक' : 'निखिल';
      addToast({
        type: 'success',
        message: `उधारी नोंद ₹${data.amount} (नोंदणी: ${performerLabel}) यशस्वीरित्या जोडली!`,
      });

      reset();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'उधारी जोडताना त्रुटी आली';
      addToast({ type: 'error', message: msg });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <PlusCircle className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-100">उधारी जोडा (Add Credit Entry)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Performer Selector (विवेक vs निखिल) */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-rose-400 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>नोंद करणारा व्यक्ती निवडा (Who is Recording?) *</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('recordedBy', 'vivek')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                  selectedRecordedBy === 'vivek'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                <span>👨‍💼 विवेक (Vivek)</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('recordedBy', 'nikhil')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                  selectedRecordedBy === 'nikhil'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                }`}
              >
                <span>👨‍💼 निखिल (Nikhil)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              ग्राहक निवडा (Customer) *
            </label>
            <select
              {...register('customerId')}
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 text-sm font-medium"
            >
              <option value="">-- ग्राहक निवडा --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.mobile ? `(${c.mobile})` : ''}
                </option>
              ))}
            </select>
            {errors.customerId && (
              <p className="text-xs text-rose-400 mt-1">{errors.customerId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              उधारी रक्कम रु. (Credit Amount ₹) *
            </label>
            <input
              {...register('amount')}
              type="number"
              step="any"
              placeholder="उदा. 250"
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm font-black text-rose-400"
            />
            {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              तारीख (Transaction Date)
            </label>
            <input
              {...register('transactionDate')}
              type="date"
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              विवरण / दूध प्रमाण (Description)
            </label>
            <input
              {...register('description')}
              type="text"
              placeholder="उदा. 5 लीटर दूध + 100 ग्रॅम लोणी"
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm font-medium"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl transition-colors"
            >
              रद्द करा (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/25 disabled:opacity-50"
            >
              {isSubmitting ? 'जतन होत आहे...' : 'उधारी जतन करा (Save Credit)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
