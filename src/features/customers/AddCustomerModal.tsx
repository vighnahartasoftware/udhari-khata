import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, UserPlus, Camera, Trash2, UserCheck } from 'lucide-react';
import { createCustomer } from '@/services/customerService';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/feedback/ToastStore';

const customerSchema = z.object({
  name: z.string().min(2, 'ग्राहकाचे नाव किमान २ अक्षरांचे असावे (Name required)'),
  alternateName: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
  openingBalance: z.coerce.number(),
  notes: z.string().optional(),
  gender: z.enum(['male', 'female']),
  recordedBy: z.enum(['vivek', 'nikhil']),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddCustomerModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      alternateName: '',
      mobile: '',
      address: '',
      openingBalance: 0,
      notes: '',
      gender: 'male',
      recordedBy: 'vivek',
    },
  });

  const selectedGender = watch('gender');
  const selectedRecordedBy = watch('recordedBy');

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: 'warning', message: 'फोटो साईज ५MB पेक्षा कमी असावी' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const creatorId = user?.id || globalThis.crypto.randomUUID();
      await createCustomer({
        id: globalThis.crypto.randomUUID(),
        name: data.name.trim(),
        alternateName: data.alternateName?.trim() || null,
        mobile: data.mobile?.trim() || '',
        address: data.address?.trim() || null,
        gender: data.gender,
        photoUrl: photoUrl,
        recordedBy: data.recordedBy,
        openingBalance: Number(data.openingBalance || 0),
        notes: data.notes?.trim() || null,
        isActive: true,
        createdBy: creatorId,
        version: 1,
        syncStatus: 'synced',
      });

      addToast({
        type: 'success',
        message: `नवीन ग्राहक '${data.name}' (नोंदणी: ${data.recordedBy === 'vivek' ? 'विवेक' : 'निखिल'}) जोडला!`,
      });

      setPhotoUrl(null);
      reset();
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'ग्राहक जोडताना त्रुटी आली';
      addToast({ type: 'error', message: errorMsg });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl text-slate-100 animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-100">नवीन ग्राहक जोडा</h2>
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
            <label className="block text-xs font-bold text-sky-400 flex items-center space-x-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>नोंद करणारा व्यक्ती निवडा (Who is Recording?) *</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('recordedBy', 'vivek')}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                  selectedRecordedBy === 'vivek'
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
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

          {/* Photo Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ग्राहकाचा फोटो (Customer Photo)
            </label>
            <div className="flex items-center space-x-3">
              <div className="relative w-16 h-16 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group">
                {photoUrl ? (
                  <>
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(null)}
                      className="absolute inset-0 bg-rose-950/80 text-rose-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <Camera className="w-6 h-6 text-slate-500" />
                )}
              </div>

              <label className="cursor-pointer px-3.5 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all">
                <span>फोटो निवडा (Upload Photo)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Customer Name & Gender */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                ग्राहकाचे नाव (Customer Name) *
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="उदा. रमेश अहिरे"
                className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm font-medium"
              />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
            </div>

            {/* Gender Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                लिंग (Gender) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setValue('gender', 'male')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                    selectedGender === 'male'
                      ? 'bg-sky-500/20 border-2 border-sky-500 text-sky-300'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span>♂️ पुरुष (Male)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('gender', 'female')}
                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                    selectedGender === 'female'
                      ? 'bg-pink-500/20 border-2 border-pink-500 text-pink-300'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span>♀️ महिला (Female)</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                मोबाईल नंबर (Mobile)
              </label>
              <input
                {...register('mobile')}
                type="tel"
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                टोपणनाव (Nick Name)
              </label>
              <input
                {...register('alternateName')}
                type="text"
                placeholder="उदा. काका"
                className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              प्रारंभिक बाकी रु. (Opening Balance ₹)
            </label>
            <input
              {...register('openingBalance')}
              type="number"
              step="any"
              placeholder="0"
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">पत्ता (Address)</label>
            <input
              {...register('address')}
              type="text"
              placeholder="उदा. डेअरी गल्ली, प्लॉट ४"
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">टीप / टीपण (Notes)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="अतिरिक्त माहिती..."
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
              className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
            >
              {isSubmitting ? 'जतन होत आहे...' : 'ग्राहक जतन करा (Save)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
