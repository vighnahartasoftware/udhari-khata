import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://*.supabase.co/rest/v1/customers*', () => {
    return HttpResponse.json([
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Ramesh Kumar',
        mobile: '9876543210',
        alternate_name: null,
        address: 'Shop 4, Dairy Colony',
        opening_balance: 500,
        notes: null,
        is_active: true,
        created_by: '123e4567-e89b-12d3-a456-426614174001',
        created_at: '2026-07-28T12:00:00Z',
        updated_at: '2026-07-28T12:00:00Z',
        version: 1,
      },
    ]);
  }),
];
