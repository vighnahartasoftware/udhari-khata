import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import type { Customer, PaymentMode } from '@/types/domain';
import { getCustomers } from '@/services/customerService';
import { addPaymentTransaction, getCustomerTransactions } from '@/services/transactionService';
import { calculateCustomerBalance } from '@/utils/balance';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/feedback/ToastStore';

const paymentSchema = z.object({
  customerId: z.string().min(1, 'कृपया ग्राहक निवडा (Select Customer)'),
  amount: z.coerce.number().gt(0, 'पेमेंट रक्कम ० पेक्षा जास्त असावी (Amount > 0)'),
  paymentMode: z.enum(['cash', 'upi', 'bank_transfer', 'other']),
  description: z.string().optional(),
  transactionDate: z.string().min(1, 'तारीख निवडा (Date required)'),
  recordedBy: z.enum(['vivek', 'nikhil']),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomerId?: string;
  onSuccess?: () => void;
}

export const AddPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  preselectedCustomerId,
  onSuccess,
}) => {
  const { user, isOwner } = useAuthStore();
  const { addToast } = useToastStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerBalance, setSelectedCustomerBalance] = useState<number>(0);
  const [showOverpaymentWarning, setShowOverpaymentWarning] = useState<boolean>(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<PaymentFormData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId: preselectedCustomerId || '',
      amount: 0,
      paymentMode: 'cash',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      recordedBy: 'vivek',
    },
  });

  const watchedCustomerId = watch('customerId');
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

  useEffect(() => {
    if (watchedCustomerId) {
      const selected = customers.find((c) => c.id === watchedCustomerId);
      if (selected) {
        getCustomerTransactions(selected.id).then((txns) => {
          const bal = calculateCustomerBalance(selected, txns);
          setSelectedCustomerBalance(bal);
        });
      }
    } else {
      setSelectedCustomerBalance(0);
    }
  }, [watchedCustomerId, customers]);

  if (!isOpen) return null;

  const savePayment = async (data: PaymentFormData) => {
    const creatorId = user?.id || globalThis.crypto.randomUUID();
    await addPaymentTransaction({
      id: globalThis.crypto.randomUUID(),
      customerId: data.customerId,
      amount: Number(data.amount),
      paymentMode: data.paymentMode as PaymentMode,
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
      message: `पेमेंट जमा ₹${data.amount} (नोंदणी: ${performerLabel}) यशस्वीरित्या नोंदवले!`,
    });

    reset();
    setShowOverpaymentWarning(false);
    setPendingSubmitData(null);
    onSuccess?.();
    onClose();
  };

  const onSubmit = async (data: PaymentFormData) => {
    try {
      if (data.amount > selectedCustomerBalance && selectedCustomerBalance > 0) {
        setShowOverpaymentWarning(true);
        setPendingSubmitData(data);
        return;
      }
      await savePayment(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'पेमेंट जमा करताना त्रुटी आली';
      addToast({ type: 'error', message: msg });
    }
  };

  const handleOwnerOverrideConfirm = async () => {
    if (pendingSubmitData) {
      await savePayment(pendingSubmitData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-100">पेमेंट जमा घ्या (Record Payment)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showOverpaymentWarning ? (
          <div className="p-4 bg-amber-950/70 border border-amber-600/40 rounded-2xl space-y-3">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-200">
                  सावधान: बाकी रकमेपेक्षा जास्त पेमेंट!
                </h4>
                <p className="text-xs text-amber-300/80 mt-1">
                  ग्राहकाची एकूण बाकी ₹{selectedCustomerBalance} आहे आणि तुम्ही ₹
                  {pendingSubmitData?.amount} पेमेंट घेत आहात.
                </p>
              </div>
            </div>

            {isOwner() ? (
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-amber-800/50">
                <button
                  type="button"
                  onClick={() => setShowOverpaymentWarning(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  रद्द करा
                </button>
                <button
                  type="button"
                  onClick={() => void handleOwnerOverrideConfirm()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg"
                >
                  मंजूर करा (Override & Proceed)
                </button>
              </div>
            ) : (
              <div className="text-xs text-rose-300 font-medium">
                केवळ दुकान मालक (Owner) बाकीपेक्षा जास्त रक्कम स्वीकारू शकतात.
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowOverpaymentWarning(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg"
                  >
                    मागे जा (Back)
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Performer Selector (विवेक vs निखिल) */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-emerald-400 flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>नोंद करणारा व्यक्ती निवडा (Who is Recording?) *</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('recordedBy', 'vivek')}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                    selectedRecordedBy === 'vivek'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
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

            {watchedCustomerId && (
              <div className="flex items-center justify-between p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-xs">
                <span className="text-slate-400">सध्याची एकूण बाकी (Current Balance):</span>
                <span className="font-bold text-rose-400 text-sm">
                  ₹{selectedCustomerBalance}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                जमा रक्कम रु. (Payment Amount ₹) *
              </label>
              <input
                {...register('amount')}
                type="number"
                step="any"
                placeholder="उदा. 500"
                className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-black text-emerald-400"
              />
              {errors.amount && (
                <p className="text-xs text-rose-400 mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                पेमेंट पद्धत (Payment Mode) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2 p-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-800">
                  <input
                    {...register('paymentMode')}
                    type="radio"
                    value="cash"
                    className="text-sky-500 focus:ring-0"
                  />
                  <span>रोख (Cash)</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-800">
                  <input
                    {...register('paymentMode')}
                    type="radio"
                    value="upi"
                    className="text-sky-500 focus:ring-0"
                  />
                  <span>UPI / PhonePe</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-800">
                  <input
                    {...register('paymentMode')}
                    type="radio"
                    value="bank_transfer"
                    className="text-sky-500 focus:ring-0"
                  />
                  <span>बँक ट्रान्सफर</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-800">
                  <input
                    {...register('paymentMode')}
                    type="radio"
                    value="other"
                    className="text-sky-500 focus:ring-0"
                  />
                  <span>इतर (Other)</span>
                </label>
              </div>
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
                टीप / संदर्भ क्रमांक (Reference / Note)
              </label>
              <input
                {...register('description')}
                type="text"
                placeholder="उदा. PhonePe Txn ID 123456"
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
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50"
              >
                {isSubmitting ? 'जतन होत आहे...' : 'पेमेंट जमा करा (Save Payment)'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
